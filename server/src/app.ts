import { existsSync } from 'node:fs';
import path from 'node:path';
import express, { type NextFunction, type Request, type Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { rateLimit } from 'express-rate-limit';
import { env, PROJECT_ROOT } from './config/env.js';
import { photosRouter } from './routes/photos.js';
import { rsvpRouter } from './routes/rsvp.js';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', env.trustProxy);

  app.use(
    helmet({
      contentSecurityPolicy: env.serveClient
        ? {
            directives: {
              defaultSrc: ["'self'"],
              // Spotify iFrame API (player oficial da trilha). O script do Spotify usa
              // eval internamente; scripts continuam restritos a estas origens fixas.
              scriptSrc: ["'self'", "'unsafe-eval'", 'https://open.spotify.com', 'https://embed-cdn.spotifycdn.com'],
              styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
              fontSrc: ["'self'", 'https://fonts.gstatic.com'],
              imgSrc: ["'self'", 'data:', 'blob:', 'https://*.supabase.co'],
              mediaSrc: ["'self'", 'https:', 'blob:'],
              connectSrc: ["'self'"],
              frameSrc: ['https://open.spotify.com'],
              objectSrc: ["'none'"],
              baseUri: ["'self'"],
              formAction: ["'self'"],
              frameAncestors: ["'none'"],
            },
          }
        : false,
      crossOriginEmbedderPolicy: false,
    }),
  );

  const api = express.Router();

  if (env.allowedOrigins.length) {
    api.use(
      cors({
        origin: env.allowedOrigins,
        methods: ['GET', 'POST'],
        allowedHeaders: ['Content-Type'],
        maxAge: 600,
      }),
    );
  }

  api.use(rateLimit({ windowMs: 15 * 60_000, limit: 120, standardHeaders: 'draft-7', legacyHeaders: false }));
  api.use(express.json({ limit: '10kb' }));
  api.use((_req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });

  api.get('/health', (_req, res) => res.json({ ok: true }));
  api.use(rsvpRouter);
  api.use((_req, res) => res.status(404).json({ ok: false, error: 'Rota não encontrada.' }));

  // Fotos dos convidados: limites próprios (uploads grandes, galeria com muitas imagens).
  const photos = express.Router();
  if (env.allowedOrigins.length) {
    photos.use(cors({ origin: env.allowedOrigins, methods: ['GET', 'POST'], maxAge: 600 }));
  }
  photos.use(photosRouter);
  app.use('/api/fotos', photos);

  app.use('/api', api);

  if (env.serveClient) {
    const dist = path.join(PROJECT_ROOT, 'client', 'dist');
    if (!existsSync(path.join(dist, 'index.html'))) {
      console.warn('[app] SERVE_CLIENT=true, mas client/dist não existe. Rode "npm run build".');
    }
    app.use(
      '/assets',
      express.static(path.join(dist, 'assets'), { immutable: true, maxAge: '1y', fallthrough: false }),
    );
    app.use(express.static(dist, { maxAge: '1h', index: false }));
    app.use((req, res, next) => {
      if (req.method !== 'GET' && req.method !== 'HEAD') return next();
      res.set('Cache-Control', 'no-cache');
      res.sendFile(path.join(dist, 'index.html'), (err) => err && next());
    });
  }

  // Tratamento centralizado: nunca expõe detalhes internos ao visitante.
  app.use((err: Error & { type?: string; status?: number }, _req: Request, res: Response, _next: NextFunction) => {
    if (err.type === 'entity.parse.failed') {
      return res.status(400).json({ ok: false, error: 'Dados enviados em formato inválido.' });
    }
    if (err.type === 'entity.too.large') {
      return res.status(413).json({ ok: false, error: 'Dados enviados são grandes demais.' });
    }
    if (err.status === 404) return res.status(404).end();
    console.error('[app] Erro inesperado:', err.message);
    return res.status(500).json({ ok: false, error: 'Ocorreu um erro inesperado. Tente novamente.' });
  });

  return app;
}
