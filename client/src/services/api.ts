const BASE = (import.meta.env.VITE_API_URL?.trim() ?? '').replace(/\/+$/, '');
const TIMEOUT_MS = 20_000;

export interface RsvpConfig {
  allowCompanions: boolean;
  maxCompanions: number;
}

export interface RsvpPayload {
  fullName: string;
  civil: boolean;
  photos: boolean;
  dinner: boolean;
  companions: number;
  requestId: string;
  elapsedMs: number;
  website: string;
}

export type ApiErrorKind = 'network' | 'timeout' | 'validation' | 'rate' | 'server';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly kind: ApiErrorKind,
    readonly fields: Record<string, string> = {},
  ) {
    super(message);
  }
}

const MESSAGES: Record<ApiErrorKind, string> = {
  network: 'Não foi possível conectar. Verifique sua internet e tente novamente.',
  timeout: 'O envio demorou mais do que o esperado. Tente novamente — não haverá duplicidade.',
  validation: 'Verifique os dados informados.',
  rate: 'Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.',
  server: 'Não conseguimos registrar sua resposta agora. Tente novamente em alguns minutos.',
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, { ...init, signal: controller.signal });
  } catch (err) {
    throw new ApiError(
      MESSAGES[(err as Error).name === 'AbortError' ? 'timeout' : 'network'],
      (err as Error).name === 'AbortError' ? 'timeout' : 'network',
    );
  } finally {
    window.clearTimeout(timer);
  }

  const body = (await res.json().catch(() => null)) as
    | ({ ok?: boolean; error?: string; fields?: Record<string, string> } & T)
    | null;

  if (res.ok && body && body.ok !== false) return body;

  if (res.status === 400 || res.status === 422) {
    throw new ApiError(body?.error ?? MESSAGES.validation, 'validation', body?.fields ?? {});
  }
  if (res.status === 429) throw new ApiError(body?.error ?? MESSAGES.rate, 'rate');
  throw new ApiError(MESSAGES.server, 'server');
}

/**
 * Chamada silenciosa ao abrir o convite: "acorda" backends em planos que
 * hibernam, para que o RSVP responda rápido quando o convidado chegar lá.
 */
export function warmUpApi(): void {
  fetch(`${BASE}/api/health`, { cache: 'no-store' }).catch(() => undefined);
}

export function fetchRsvpConfig(): Promise<RsvpConfig> {
  return request<RsvpConfig>('/api/config', { headers: { Accept: 'application/json' } });
}

/** Resolve somente quando o servidor confirma o registro da resposta. */
export async function submitRsvp(payload: RsvpPayload): Promise<void> {
  const body = await request<{ ok: boolean }>('/api/rsvp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  });
  if (body.ok !== true) throw new ApiError(MESSAGES.server, 'server');
}
