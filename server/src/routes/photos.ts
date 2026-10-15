import { createHmac, timingSafeEqual } from 'node:crypto';
import express, { Router, type NextFunction, type Request, type Response } from 'express';
import multer from 'multer';
import { rateLimit } from 'express-rate-limit';
import { env } from '../config/env.js';
import { detectFormat, filePhotoStore, mimeOf, photoStore } from '../services/photoStorage.js';

export const photosRouter = Router();

const COOKIE = 'fotos_sessao';
const SESSION_DAYS = 30;
const MAX_THUMB_BYTES = 1024 * 1024;

const limiter = (limit: number, error: string) =>
  rateLimit({
    windowMs: 15 * 60_000,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { ok: false, error },
  });

const uploadLimiter = limiter(80, 'Muitas fotos em pouco tempo. Aguarde alguns minutos e tente novamente.');
const loginLimiter = limiter(10, 'Muitas tentativas. Aguarde alguns minutos e tente novamente.');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.photos.maxBytes, files: 2, fields: 4, fieldSize: 1024 },
}).fields([
  { name: 'foto', maxCount: 1 },
  { name: 'miniatura', maxCount: 1 },
]);

/** Token da sessão dos noivos: derivado da senha, muda se a senha mudar. */
function sessionToken(): string | null {
  const pw = env.photos.adminPassword;
  return pw ? createHmac('sha256', pw).update('fotos-sessao-v1').digest('hex') : null;
}

function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

function readCookie(req: Request, name: string): string | null {
  for (const part of (req.headers.cookie ?? '').split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return decodeURIComponent(v.join('='));
  }
  return null;
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const token = sessionToken();
  const cookie = readCookie(req, COOKIE);
  if (token && cookie && safeEqual(cookie, token)) return next();
  res.set('Cache-Control', 'no-store');
  return res.status(401).json({ ok: false, error: 'Acesso restrito aos noivos.' });
}

// ---------------------------------------------------------------------
//  Envio pelos convidados (/momentos) — uma foto por requisição
// ---------------------------------------------------------------------
photosRouter.post('/', uploadLimiter, (req: Request, res: Response) => {
  res.set('Cache-Control', 'no-store');
  upload(req, res, async (err: unknown) => {
    if (err) {
      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        return res
          .status(413)
          .json({ ok: false, error: `A foto passa de ${env.photos.maxBytes / 1024 / 1024} MB.` });
      }
      return res.status(400).json({ ok: false, error: 'Não foi possível ler o arquivo enviado.' });
    }

    const files = req.files as Record<string, Express.Multer.File[]> | undefined;
    const photo = files?.foto?.[0];
    if (!photo) return res.status(400).json({ ok: false, error: 'Nenhuma foto recebida.' });

    const ext = detectFormat(photo.buffer);
    if (!ext) return res.status(415).json({ ok: false, error: 'Este arquivo não é uma foto (use JPG, PNG, HEIC ou WEBP).' });

    const thumbFile = files?.miniatura?.[0];
    const thumb =
      thumbFile && thumbFile.size <= MAX_THUMB_BYTES && detectFormat(thumbFile.buffer) === 'jpg' ? thumbFile.buffer : null;

    const sender = typeof req.body?.nome === 'string' ? req.body.nome.slice(0, 60) : '';

    try {
      const file = await photoStore.save({ data: photo.buffer, ext, thumb, sender });
      console.info(`[fotos] Recebida ${file} (${(photo.size / 1024 / 1024).toFixed(1)} MB)`);
      return res.status(201).json({ ok: true });
    } catch (e) {
      console.error(`[fotos] Falha ao gravar (${photoStore.name}):`, (e as Error).message);
      return res.status(503).json({ ok: false, error: 'Não conseguimos guardar a foto agora. Tente novamente.' });
    }
  });
});

// ---------------------------------------------------------------------
//  Galeria dos noivos (/fotos)
// ---------------------------------------------------------------------
photosRouter.post('/entrar', loginLimiter, express.json({ limit: '2kb' }), (req: Request, res: Response) => {
  res.set('Cache-Control', 'no-store');
  const token = sessionToken();
  if (!token) {
    return res.status(503).json({ ok: false, error: 'Defina PHOTOS_ADMIN_PASSWORD no servidor para liberar a galeria.' });
  }
  const password = typeof req.body?.senha === 'string' ? req.body.senha : '';
  if (!safeEqual(password, env.photos.adminPassword!)) {
    return res.status(401).json({ ok: false, error: 'Senha incorreta.' });
  }
  res.cookie(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.isProduction,
    path: '/api/fotos',
    maxAge: SESSION_DAYS * 24 * 3600_000,
  });
  return res.json({ ok: true });
});

photosRouter.post('/sair', (_req, res) => {
  res.set('Cache-Control', 'no-store');
  res.clearCookie(COOKIE, { path: '/api/fotos' });
  res.json({ ok: true });
});

photosRouter.get('/lista', requireAdmin, async (_req, res) => {
  res.set('Cache-Control', 'no-store');
  try {
    res.json({ ok: true, photos: await photoStore.list() });
  } catch (e) {
    console.error(`[fotos] Falha ao listar (${photoStore.name}):`, (e as Error).message);
    res.status(503).json({ ok: false, error: 'Não conseguimos carregar as fotos agora. Tente novamente.' });
  }
});

// Arquivos em disco (somente no modo "file"; no Supabase os links vêm assinados).
photosRouter.get('/arquivo/:folder/:file', requireAdmin, (req, res) => {
  const { folder, file } = req.params as { folder: string; file: string };
  const full = filePhotoStore?.resolve(folder, file);
  if (!full) return res.status(404).end();
  const ext = file.split('.').pop() as Parameters<typeof mimeOf>[0];
  res.set('Cache-Control', 'private, max-age=86400');
  res.type(mimeOf(ext));
  if (req.query.download) res.attachment(file);
  res.sendFile(full, (err) => err && !res.headersSent && res.status(404).end());
});
