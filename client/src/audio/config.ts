/**
 * Fonte da trilha sonora — configurada por variáveis de ambiente.
 * Use apenas áudio licenciado ou autorizado (veja o README, seção "Música").
 * Sem VITE_AUDIO_SRC, o convite funciona normalmente, sem música.
 */
export const AUDIO = {
  src: import.meta.env.VITE_AUDIO_SRC?.trim() ?? '',
  title: import.meta.env.VITE_AUDIO_TITLE?.trim() ?? '',
  volume: 0.55,
  fadeInMs: 2400,
  fadeOutMs: 600,
};

/** Converte https://open.spotify.com/track/ID em URL do player oficial embutível. */
export function spotifyEmbedUrl(): string | null {
  const raw = import.meta.env.VITE_SPOTIFY_TRACK_URL?.trim();
  if (!raw) return null;
  const match = raw.match(/open\.spotify\.com\/(?:intl-[a-z-]+\/)?track\/([A-Za-z0-9]{10,32})/);
  return match ? `https://open.spotify.com/embed/track/${match[1]}?utm_source=generator&theme=0` : null;
}
