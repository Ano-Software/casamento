/**
 * Trilha sonora. Duas fontes possíveis, nesta ordem de prioridade:
 *
 * 1. VITE_AUDIO_SRC — arquivo de áudio licenciado/autorizado (toca completo, em loop).
 * 2. Spotify — player oficial (iFrame API) da faixa abaixo. Para quem não está
 *    logado no Spotify, o próprio Spotify toca apenas a prévia de 30 s.
 *
 * Veja o README, seção "Música".
 */

/** "Photograph" — Ed Sheeran. Pode ser trocada por VITE_SPOTIFY_TRACK_URL. */
const DEFAULT_SPOTIFY_TRACK = 'https://open.spotify.com/intl-pt/track/1HNkqx9Ahdgi1Ixy2xkKkL';

export const AUDIO = {
  src: import.meta.env.VITE_AUDIO_SRC?.trim() ?? '',
  title: import.meta.env.VITE_AUDIO_TITLE?.trim() || 'Photograph — Ed Sheeran',
  volume: 0.55,
  fadeInMs: 2400,
  fadeOutMs: 600,
};

/** Extrai o ID da faixa de um link do Spotify (aceita /intl-xx/ e parâmetros ?si=). */
export function spotifyTrackId(): string | null {
  const raw = import.meta.env.VITE_SPOTIFY_TRACK_URL?.trim() || DEFAULT_SPOTIFY_TRACK;
  if (raw.toLowerCase() === 'off') return null;
  const match = raw.match(/open\.spotify\.com\/(?:intl-[a-z-]+\/)?track\/([A-Za-z0-9]{10,32})/);
  return match ? match[1] : null;
}
