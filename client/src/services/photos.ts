import { BASE } from './api';

/** Mesmo limite padrão do servidor (PHOTOS_MAX_MB). */
export const MAX_PHOTO_MB = 25;
export const MAX_PHOTOS_PER_BATCH = 10;

export interface GuestPhoto {
  file: string;
  sender: string | null;
  createdAt: string;
  size: number;
  url: string;
  thumbUrl: string | null;
  downloadUrl: string;
}

export class PhotoApiError extends Error {
  constructor(
    message: string,
    readonly status = 0,
  ) {
    super(message);
  }
}

const NETWORK = 'Não foi possível conectar. Verifique sua internet e tente novamente.';

const abs = (url: string) => (url.startsWith('/') ? `${BASE}${url}` : url);

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}/api/fotos${path}`, { credentials: 'include', ...init });
  } catch {
    throw new PhotoApiError(NETWORK);
  }
  const body = (await res.json().catch(() => null)) as ({ ok?: boolean; error?: string } & T) | null;
  if (res.ok && body?.ok) return body;
  throw new PhotoApiError(body?.error ?? 'Algo deu errado. Tente novamente.', res.status);
}

/** Envia uma foto (com miniatura opcional), informando o progresso de 0 a 1. */
export function uploadPhoto(
  file: File,
  thumb: Blob | null,
  sender: string,
  onProgress: (fraction: number) => void,
): Promise<void> {
  const form = new FormData();
  form.append('nome', sender);
  if (thumb) form.append('miniatura', thumb, 'miniatura.jpg');
  form.append('foto', file, file.name);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${BASE}/api/fotos`);
    xhr.timeout = 5 * 60_000;
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) return resolve();
      let message = 'Não conseguimos enviar esta foto. Tente novamente.';
      try {
        message = (JSON.parse(xhr.responseText) as { error?: string }).error ?? message;
      } catch {
        if (xhr.status === 413) message = `A foto passa de ${MAX_PHOTO_MB} MB.`;
      }
      reject(new PhotoApiError(message, xhr.status));
    };
    xhr.onerror = () => reject(new PhotoApiError(NETWORK));
    xhr.ontimeout = () => reject(new PhotoApiError('O envio demorou demais. Tente novamente.'));
    xhr.send(form);
  });
}

/**
 * Miniatura JPEG (até 640 px) gerada no próprio navegador, para a galeria
 * carregar rápido. Retorna null quando o navegador não lê o formato (ex.: HEIC).
 */
export async function makeThumbnail(file: File, max = 640): Promise<Blob | null> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    return await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.82));
  } catch {
    return null;
  }
}

export async function listPhotos(): Promise<GuestPhoto[]> {
  const { photos } = await call<{ photos: GuestPhoto[] }>('/lista', { cache: 'no-store' });
  return photos.map((p) => ({
    ...p,
    url: abs(p.url),
    thumbUrl: p.thumbUrl && abs(p.thumbUrl),
    downloadUrl: abs(p.downloadUrl),
  }));
}

export async function login(password: string): Promise<void> {
  await call('/entrar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ senha: password }),
  });
}

export async function logout(): Promise<void> {
  await call('/sair', { method: 'POST' }).catch(() => undefined);
}
