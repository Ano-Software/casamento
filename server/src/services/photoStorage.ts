import { randomBytes } from 'node:crypto';
import { mkdir, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { env } from '../config/env.js';

/** Formatos aceitos, reconhecidos pelos primeiros bytes do arquivo (não pelo nome). */
const FORMATS = {
  jpg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  heic: 'image/heic',
  heif: 'image/heif',
  avif: 'image/avif',
} as const;

export type PhotoExt = keyof typeof FORMATS;

export function mimeOf(ext: PhotoExt): string {
  return FORMATS[ext];
}

export function detectFormat(buf: Buffer): PhotoExt | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg';
  if (buf.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47]))) return 'png';
  if (buf.subarray(0, 4).toString('latin1') === 'GIF8') return 'gif';
  if (buf.subarray(0, 4).toString('latin1') === 'RIFF' && buf.subarray(8, 12).toString('latin1') === 'WEBP') return 'webp';
  if (buf.subarray(4, 8).toString('latin1') === 'ftyp') {
    const brand = buf.subarray(8, 12).toString('latin1');
    if (['heic', 'heix', 'hevc', 'hevx', 'heim', 'heis'].includes(brand)) return 'heic';
    if (['mif1', 'msf1'].includes(brand)) return 'heif';
    if (['avif', 'avis'].includes(brand)) return 'avif';
  }
  return null;
}

/** Nome do convidado em formato seguro para compor o nome do arquivo. */
function slugify(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .replace(/-+$/, '');
}

/**
 * Nome do arquivo: AAAAMMDD-HHMMSS-xxxxxx--nome-do-convidado.ext (UTC).
 * Começa pela data para que a ordem alfabética seja a ordem de envio.
 */
const FILE_PATTERN = /^(\d{8})-(\d{6})-([a-z0-9]{6})(?:--([a-z0-9-]{1,40}))?\.(jpg|png|gif|webp|heic|heif|avif)$/;

function buildBase(sender: string): string {
  const iso = new Date().toISOString(); // 2026-11-28T18:30:12.345Z
  const stamp = `${iso.slice(0, 10).replaceAll('-', '')}-${iso.slice(11, 19).replaceAll(':', '')}`;
  const rand = randomBytes(6).toString('base64url').toLowerCase().replace(/[^a-z0-9]/g, '0').slice(0, 6);
  const slug = slugify(sender);
  return slug ? `${stamp}-${rand}--${slug}` : `${stamp}-${rand}`;
}

export function isPhotoFile(name: string): boolean {
  return FILE_PATTERN.test(name);
}

function parseName(file: string) {
  const m = FILE_PATTERN.exec(file);
  if (!m) return null;
  const [, d, t, , slug] = m;
  const createdAt = new Date(
    `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}T${t.slice(0, 2)}:${t.slice(2, 4)}:${t.slice(4, 6)}Z`,
  );
  const sender = slug
    ? slug
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ')
    : null;
  return { base: file.replace(/\.[a-z]+$/, ''), createdAt, sender };
}

export interface StoredPhoto {
  file: string;
  sender: string | null;
  createdAt: string;
  size: number;
  url: string;
  thumbUrl: string | null;
  downloadUrl: string;
}

export interface NewPhoto {
  data: Buffer;
  ext: PhotoExt;
  /** Miniatura JPEG gerada pelo navegador do convidado (opcional). */
  thumb: Buffer | null;
  sender: string;
}

interface PhotoStore {
  readonly name: string;
  save(photo: NewPhoto): Promise<string>;
  list(): Promise<StoredPhoto[]>;
}

const ORIGINALS = 'originais';
const THUMBS = 'miniaturas';

/** Disco local. Em produção, aponte PHOTOS_DIR para uma pasta fora da pasta publicada. */
class FilePhotoStore implements PhotoStore {
  readonly name = 'file';

  constructor(readonly dir: string) {}

  async save({ data, ext, thumb, sender }: NewPhoto): Promise<string> {
    const base = buildBase(sender);
    await mkdir(path.join(this.dir, ORIGINALS), { recursive: true });
    await writeFile(path.join(this.dir, ORIGINALS, `${base}.${ext}`), data, { flag: 'wx' });
    if (thumb) {
      await mkdir(path.join(this.dir, THUMBS), { recursive: true });
      await writeFile(path.join(this.dir, THUMBS, `${base}.jpg`), thumb, { flag: 'wx' });
    }
    return `${base}.${ext}`;
  }

  async list(): Promise<StoredPhoto[]> {
    const read = (sub: string) =>
      readdir(path.join(this.dir, sub)).catch((err: NodeJS.ErrnoException) => {
        if (err.code === 'ENOENT') return [] as string[];
        throw err;
      });
    const [originals, thumbs] = await Promise.all([read(ORIGINALS), read(THUMBS)]);
    const thumbSet = new Set(thumbs);

    const items = await Promise.all(
      originals.map(async (file) => {
        const info = parseName(file);
        if (!info) return null;
        const { size } = await stat(path.join(this.dir, ORIGINALS, file));
        const url = `/api/fotos/arquivo/${ORIGINALS}/${file}`;
        return {
          file,
          sender: info.sender,
          createdAt: info.createdAt.toISOString(),
          size,
          url,
          thumbUrl: thumbSet.has(`${info.base}.jpg`) ? `/api/fotos/arquivo/${THUMBS}/${info.base}.jpg` : null,
          downloadUrl: `${url}?download=1`,
        } satisfies StoredPhoto;
      }),
    );
    return items.filter((x) => x !== null).sort((a, b) => b.file.localeCompare(a.file));
  }

  /** Caminho absoluto de um arquivo da galeria, ou null se o nome não for válido. */
  resolve(folder: string, file: string): string | null {
    if (folder === ORIGINALS && isPhotoFile(file)) return path.join(this.dir, ORIGINALS, file);
    if (folder === THUMBS && isPhotoFile(file) && file.endsWith('.jpg')) return path.join(this.dir, THUMBS, file);
    return null;
  }
}

type SupabaseConfig = typeof env.photos.supabase;

/** Bucket privado do Supabase Storage, acessado só pelo servidor (chave service_role). */
class SupabasePhotoStore implements PhotoStore {
  readonly name = 'supabase';
  private bucketReady: Promise<void> | null = null;

  constructor(private readonly cfg: SupabaseConfig) {}

  private async call(endpoint: string, init: RequestInit): Promise<Response> {
    return fetch(`${this.cfg.url}/storage/v1${endpoint}`, {
      ...init,
      headers: { Authorization: `Bearer ${this.cfg.key}`, apikey: this.cfg.key, ...init.headers },
      signal: AbortSignal.timeout(60_000),
    });
  }

  private async json<T>(endpoint: string, body: unknown): Promise<T> {
    const res = await this.call(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Supabase ${endpoint}: ${res.status} ${await res.text()}`);
    return (await res.json()) as T;
  }

  /** Cria o bucket privado na primeira utilização. */
  private ensureBucket(): Promise<void> {
    if (!this.bucketReady) {
      this.bucketReady = (async () => {
        const res = await this.call('/bucket', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: this.cfg.bucket, name: this.cfg.bucket, public: false }),
        });
        if (res.ok) return;
        const text = await res.text();
        if (res.status === 409 || /already exists|duplicate/i.test(text)) return;
        throw new Error(`Supabase: não foi possível criar o bucket (${res.status} ${text})`);
      })().catch((err) => {
        this.bucketReady = null;
        throw err;
      });
    }
    return this.bucketReady;
  }

  private async upload(objectPath: string, data: Buffer, contentType: string): Promise<void> {
    const res = await this.call(`/object/${this.cfg.bucket}/${objectPath}`, {
      method: 'POST',
      headers: { 'Content-Type': contentType, 'x-upsert': 'false', 'cache-control': 'max-age=31536000' },
      body: new Uint8Array(data),
    });
    if (!res.ok) throw new Error(`Supabase upload: ${res.status} ${await res.text()}`);
  }

  async save({ data, ext, thumb, sender }: NewPhoto): Promise<string> {
    await this.ensureBucket();
    const base = buildBase(sender);
    await this.upload(`${ORIGINALS}/${base}.${ext}`, data, mimeOf(ext));
    if (thumb) {
      // A miniatura é só conveniência: sem ela, a galeria usa a foto original.
      await this.upload(`${THUMBS}/${base}.jpg`, thumb, 'image/jpeg').catch((err: Error) =>
        console.warn('[fotos] Miniatura não gravada:', err.message),
      );
    }
    return `${base}.${ext}`;
  }

  private async listFolder(prefix: string) {
    const all: { name: string; id: string | null; metadata?: { size?: number } | null }[] = [];
    for (let offset = 0; ; offset += 1000) {
      const page = await this.json<typeof all>(`/object/list/${this.cfg.bucket}`, {
        prefix,
        limit: 1000,
        offset,
        sortBy: { column: 'name', order: 'desc' },
      });
      all.push(...page);
      if (page.length < 1000) return all.filter((o) => o.id !== null);
    }
  }

  async list(): Promise<StoredPhoto[]> {
    await this.ensureBucket();
    const [originals, thumbs] = await Promise.all([this.listFolder(ORIGINALS), this.listFolder(THUMBS)]);
    const thumbSet = new Set(thumbs.map((t) => t.name));
    const photos = originals.flatMap((o) => {
      const info = parseName(o.name);
      return info ? [{ ...info, file: o.name, size: o.metadata?.size ?? 0 }] : [];
    });
    if (!photos.length) return [];

    const paths = photos.flatMap((p) => {
      const list = [`${ORIGINALS}/${p.file}`];
      if (thumbSet.has(`${p.base}.jpg`)) list.push(`${THUMBS}/${p.base}.jpg`);
      return list;
    });
    // Links temporários (6 h) para o navegador baixar direto do Supabase.
    const signed = new Map<string, string>();
    for (let i = 0; i < paths.length; i += 500) {
      const batch = await this.json<{ path: string | null; signedURL: string | null; error: string | null }[]>(
        `/object/sign/${this.cfg.bucket}`,
        { expiresIn: 6 * 3600, paths: paths.slice(i, i + 500) },
      );
      for (const s of batch) if (s.path && s.signedURL) signed.set(s.path, `${this.cfg.url}/storage/v1${s.signedURL}`);
    }

    return photos.flatMap((p) => {
      const url = signed.get(`${ORIGINALS}/${p.file}`);
      if (!url) return [];
      return [
        {
          file: p.file,
          sender: p.sender,
          createdAt: p.createdAt.toISOString(),
          size: p.size,
          url,
          thumbUrl: signed.get(`${THUMBS}/${p.base}.jpg`) ?? null,
          downloadUrl: `${url}&download=${encodeURIComponent(p.file)}`,
        },
      ];
    });
  }
}

export const filePhotoStore = env.photos.driver === 'file' ? new FilePhotoStore(env.photos.dir) : null;

export const photoStore: PhotoStore = filePhotoStore ?? new SupabasePhotoStore(env.photos.supabase);
