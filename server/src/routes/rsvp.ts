import { Router, type Request, type Response } from 'express';
import { rateLimit } from 'express-rate-limit';
import { env } from '../config/env.js';
import { fieldErrors, rsvpSchema } from '../services/validation.js';
import { store, type RsvpRecord } from '../services/storage.js';
import { sendRsvpEmail } from '../services/mailer.js';

export const rsvpRouter = Router();

/** Tempo mínimo (ms) entre abrir o formulário e enviar — filtra robôs simples. */
const MIN_FILL_TIME_MS = 1500;

const submitLimiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  limit: env.rateLimit.max,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { ok: false, error: 'Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.' },
});

rsvpRouter.get('/config', (_req, res) => {
  res.set('Cache-Control', 'public, max-age=60');
  res.json({
    allowCompanions: env.rsvp.allowCompanions,
    maxCompanions: env.rsvp.maxCompanions,
  });
});

rsvpRouter.post('/rsvp', submitLimiter, async (req: Request, res: Response) => {
  if (!req.is('application/json')) {
    return res.status(415).json({ ok: false, error: 'Formato de envio não suportado.' });
  }

  const parsed = rsvpSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      error: 'Verifique os dados informados.',
      fields: fieldErrors(parsed.error),
    });
  }

  const input = parsed.data;

  // Honeypot preenchido: responde como sucesso, mas não registra nada.
  if (input.website && input.website.trim() !== '') {
    console.warn('[rsvp] Envio descartado (honeypot).');
    return res.status(201).json({ ok: true });
  }

  if (input.elapsedMs < MIN_FILL_TIME_MS) {
    return res.status(400).json({ ok: false, error: 'Não foi possível validar o envio. Tente novamente.' });
  }

  const attendsAny = input.civil || input.photos || input.dinner;
  const companions = env.rsvp.allowCompanions && attendsAny ? input.companions : 0;
  if (companions > env.rsvp.maxCompanions) {
    return res.status(400).json({
      ok: false,
      error: 'Verifique os dados informados.',
      fields: { companions: `O limite é de ${env.rsvp.maxCompanions} acompanhante(s).` },
    });
  }

  const record: RsvpRecord = {
    requestId: input.requestId,
    fullName: input.fullName,
    secondName: input.secondName,
    civil: input.civil,
    photos: input.photos,
    dinner: input.dinner,
    companions,
    createdAt: new Date(),
  };

  // 1) Registro persistente — é a fonte da verdade.
  let stored = false;
  let duplicate = false;
  try {
    ({ duplicate } = await store.save(record));
    stored = true;
  } catch (err) {
    console.error(`[rsvp] Falha ao gravar (${store.name}):`, (err as Error).message);
  }

  // 2) Notificação por e-mail (não reenvia para duplicados).
  let mailed = false;
  if (env.mailEnabled && !duplicate) {
    try {
      await sendRsvpEmail(record);
      mailed = true;
    } catch (err) {
      console.error('[rsvp] Falha ao enviar e-mail:', (err as Error).message);
    }
  }

  // Sucesso apenas se a resposta ficou registrada em pelo menos um canal confiável.
  if (!stored && !mailed) {
    return res.status(503).json({
      ok: false,
      error: 'Não conseguimos registrar sua resposta agora. Tente novamente em alguns minutos.',
    });
  }

  console.info(
    `[rsvp] ${duplicate ? 'Reenvio ignorado' : 'Registrado'} id=${record.requestId} civil=${record.civil} fotos=${record.photos} jantar=${record.dinner} ` +
      `armazenado=${stored} email=${mailed}`,
  );
  return res.status(201).json({ ok: true });
});
