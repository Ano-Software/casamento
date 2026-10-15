import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadDotenv } from 'dotenv';
import { z } from 'zod';

const here = path.dirname(fileURLToPath(import.meta.url));

/** Raiz do repositório (funciona tanto em src/ via tsx quanto em dist/). */
export const PROJECT_ROOT = path.resolve(here, '../../..');
export const SERVER_ROOT = path.resolve(here, '../..');

// O .env fica na raiz do projeto. Em hospedagens, as variáveis vêm do painel.
loadDotenv({ path: [path.resolve(process.cwd(), '.env'), path.join(PROJECT_ROOT, '.env')], quiet: true });

const bool = (fallback: boolean) =>
  z
    .string()
    .optional()
    .transform((v) => (v === undefined ? fallback : ['true', '1', 'yes', 'sim'].includes(v.toLowerCase())));

const list = z
  .string()
  .optional()
  .transform((v) =>
    (v ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  );

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  HOST: z.string().default('0.0.0.0'),
  TRUST_PROXY: z.coerce.number().int().min(0).max(10).default(0),
  ALLOWED_ORIGINS: list,
  SERVE_CLIENT: bool(false),

  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().min(1).max(65535).default(587),
  SMTP_SECURE: bool(false),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  RSVP_RECIPIENT_EMAIL: list.pipe(z.array(z.email('RSVP_RECIPIENT_EMAIL contém um e-mail inválido'))),
  RSVP_SENDER_EMAIL: z.email('RSVP_SENDER_EMAIL inválido').optional(),

  RSVP_ALLOW_COMPANIONS: bool(false),
  RSVP_MAX_COMPANIONS: z.coerce.number().int().min(0).max(20).default(2),

  STORAGE_DRIVER: z.enum(['mysql', 'file']).optional(),
  // MySQL da Hostinger. No próprio servidor da Hostinger use 127.0.0.1;
  // de fora, use o host srvNNNN.hstgr.io após liberar o acesso remoto.
  DB_HOST: z.string().optional(),
  DB_PORT: z.coerce.number().int().min(1).max(65535).default(3306),
  DB_USER: z.string().optional(),
  DB_PASSWORD: z.string().optional(),
  DB_NAME: z.string().optional(),
  DB_TABLE: z
    .string()
    .regex(/^[a-z_][a-z0-9_]*$/i, 'DB_TABLE inválido')
    .default('rsvps'),
  DB_SSL: bool(false),
  DATA_DIR: z.string().optional(),

  // Fotos enviadas pelos convidados (/momentos) e galeria privada dos noivos (/fotos).
  PHOTOS_ADMIN_PASSWORD: z.string().min(8, 'PHOTOS_ADMIN_PASSWORD precisa de ao menos 8 caracteres').optional(),
  PHOTOS_MAX_MB: z.coerce.number().int().min(1).max(50).default(25),
  PHOTOS_DIR: z.string().optional(),
  SUPABASE_URL: z.url('SUPABASE_URL inválida').optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  SUPABASE_PHOTOS_BUCKET: z
    .string()
    .regex(/^[a-z0-9_-]+$/i, 'SUPABASE_PHOTOS_BUCKET inválido')
    .default('momentos'),

  RATE_LIMIT_MAX: z.coerce.number().int().min(1).max(1000).default(5),
  RATE_LIMIT_WINDOW_MIN: z.coerce.number().int().min(1).max(1440).default(15),
});

// Variáveis vazias (ex.: "SMTP_HOST=") são tratadas como ausentes.
const raw = Object.fromEntries(
  Object.entries(process.env)
    .map(([k, v]) => [k, v?.trim()])
    .filter(([, v]) => v !== undefined && v !== ''),
);

const parsed = schema.safeParse(raw);
if (!parsed.success) {
  console.error('[config] Variáveis de ambiente inválidas:');
  for (const issue of parsed.error.issues) console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
  process.exit(1);
}

const e = parsed.data;

const mysqlReady = Boolean(e.DB_HOST && e.DB_USER && e.DB_NAME);
const storageDriver = e.STORAGE_DRIVER ?? (mysqlReady ? 'mysql' : 'file');
if (storageDriver === 'mysql' && !mysqlReady) {
  console.error('[config] STORAGE_DRIVER=mysql exige DB_HOST, DB_USER e DB_NAME.');
  process.exit(1);
}

export const env = {
  isProduction: e.NODE_ENV === 'production',
  port: e.PORT,
  host: e.HOST,
  trustProxy: e.TRUST_PROXY,
  allowedOrigins: e.ALLOWED_ORIGINS,
  serveClient: e.SERVE_CLIENT,

  smtp: {
    host: e.SMTP_HOST,
    port: e.SMTP_PORT,
    secure: e.SMTP_SECURE,
    user: e.SMTP_USER,
    pass: e.SMTP_PASS,
  },
  mail: {
    recipients: e.RSVP_RECIPIENT_EMAIL,
    sender: e.RSVP_SENDER_EMAIL ?? e.SMTP_USER,
  },
  mailEnabled: Boolean(e.SMTP_HOST && e.RSVP_RECIPIENT_EMAIL.length && (e.RSVP_SENDER_EMAIL ?? e.SMTP_USER)),

  rsvp: {
    allowCompanions: e.RSVP_ALLOW_COMPANIONS && e.RSVP_MAX_COMPANIONS > 0,
    maxCompanions: e.RSVP_ALLOW_COMPANIONS ? e.RSVP_MAX_COMPANIONS : 0,
  },

  storage: {
    driver: storageDriver as 'mysql' | 'file',
    mysql: {
      host: e.DB_HOST,
      port: e.DB_PORT,
      user: e.DB_USER,
      password: e.DB_PASSWORD,
      database: e.DB_NAME,
      table: e.DB_TABLE,
      ssl: e.DB_SSL,
    },
    dataDir: path.resolve(e.DATA_DIR ?? path.join(SERVER_ROOT, 'data')),
  },

  photos: {
    adminPassword: e.PHOTOS_ADMIN_PASSWORD,
    maxBytes: e.PHOTOS_MAX_MB * 1024 * 1024,
    // Supabase Storage quando a chave existir; senão, disco local.
    driver: (e.SUPABASE_URL && e.SUPABASE_SERVICE_ROLE_KEY ? 'supabase' : 'file') as 'supabase' | 'file',
    dir: path.resolve(e.PHOTOS_DIR ?? path.join(e.DATA_DIR ?? path.join(SERVER_ROOT, 'data'), 'fotos')),
    supabase: {
      url: (e.SUPABASE_URL ?? '').replace(/\/+$/, ''),
      key: e.SUPABASE_SERVICE_ROLE_KEY ?? '',
      bucket: e.SUPABASE_PHOTOS_BUCKET,
    },
  },

  rateLimit: {
    max: e.RATE_LIMIT_MAX,
    windowMs: e.RATE_LIMIT_WINDOW_MIN * 60_000,
  },
} as const;
