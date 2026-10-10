import { m } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { EASE_CINE } from '../lib/motion';

/** Subconjunto da Spotify iFrame API usado aqui. */
interface EmbedController {
  play(): void;
  pause(): void;
  resume(): void;
  togglePlay(): void;
  destroy(): void;
  addListener(event: 'ready', cb: () => void): void;
  addListener(event: 'playback_update', cb: (e: { data: { isPaused: boolean; position: number } }) => void): void;
}
interface IFrameAPI {
  createController(el: HTMLElement, opts: { uri: string; width?: string | number; height?: number }, cb: (c: EmbedController) => void): void;
}
declare global {
  interface Window {
    onSpotifyIframeApiReady?: (api: IFrameAPI) => void;
  }
}

const SCRIPT_SRC = 'https://open.spotify.com/embed/iframe-api/v1';
let apiPromise: Promise<IFrameAPI> | null = null;

/** Carrega o script oficial uma única vez (mesmo com StrictMode montando duas vezes). */
function loadSpotifyApi(): Promise<IFrameAPI> {
  if (!apiPromise) {
    apiPromise = new Promise((resolve, reject) => {
      window.onSpotifyIframeApiReady = resolve;
      const s = document.createElement('script');
      s.src = SCRIPT_SRC;
      s.async = true;
      s.onerror = () => {
        apiPromise = null;
        reject(new Error('Spotify indisponível'));
      };
      document.body.appendChild(s);
    });
  }
  return apiPromise;
}

interface Props {
  trackId: string;
  started: boolean;
}

/**
 * Trilha pelo player oficial do Spotify. O player fica visível num cartão
 * discreto no rodapé (fallback para quando o navegador exige um toque direto
 * nele) e se recolhe sozinho quando a música começa; o botão redondo no topo
 * pausa/retoma.
 */
export function SpotifyPlayer({ trackId, started }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<EmbedController | null>(null);
  const wantsPlay = useRef(false);
  const resumeOnVisible = useRef(false);
  const everPlayed = useRef(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [open, setOpen] = useState(true);

  // Prepara o player já na abertura, para estar pronto quando o convidado tocar.
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let cancelled = false;
    const target = document.createElement('div');
    host.appendChild(target);

    loadSpotifyApi()
      .then((api) => {
        if (cancelled) return;
        api.createController(target, { uri: `spotify:track:${trackId}`, width: '100%', height: 80 }, (c) => {
          if (cancelled) return c.destroy();
          controllerRef.current = c;
          c.addListener('ready', () => {
            setReady(true);
            if (wantsPlay.current) c.play();
          });
          c.addListener('playback_update', (e) => {
            const isPlaying = !e.data.isPaused;
            setPlaying(isPlaying);
            if (isPlaying) everPlayed.current = true;
          });
        });
      })
      .catch(() => !cancelled && setFailed(true));

    return () => {
      cancelled = true;
      controllerRef.current?.destroy();
      controllerRef.current = null;
      host.innerHTML = '';
    };
  }, [trackId]);

  // Toque em "Viver esse momento": tenta iniciar a faixa.
  useEffect(() => {
    if (!started) return;
    wantsPlay.current = true;
    if (ready) controllerRef.current?.play();
  }, [started, ready]);

  // Quando a música começa, recolhe o cartão para devolver a tela às fotos.
  useEffect(() => {
    if (!playing || !open) return;
    const t = window.setTimeout(() => setOpen(false), 4500);
    return () => window.clearTimeout(t);
  }, [playing, open]);

  // Pausa ao sair do app/aba (ex.: voltar ao WhatsApp) e retoma ao voltar.
  useEffect(() => {
    const onVisibility = () => {
      const c = controllerRef.current;
      if (!c) return;
      if (document.hidden) {
        resumeOnVisible.current = playing;
        if (playing) c.pause();
      } else if (resumeOnVisible.current) {
        resumeOnVisible.current = false;
        c.resume();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [playing]);

  if (failed) return null;

  const toggle = () => {
    const c = controllerRef.current;
    if (!c) return setOpen(true);
    if (playing) c.pause();
    else {
      c.resume();
      // Se o navegador bloquear o comando, o convidado pode tocar no player.
      if (!everPlayed.current) setOpen(true);
    }
  };

  const visible = started && open;

  return (
    <>
      {started && (
        <m.div
          className="fixed right-4 z-50 flex items-center gap-2"
          style={{ top: 'max(1rem, env(safe-area-inset-top))' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6, duration: 1 }}
        >
          <button
            type="button"
            onClick={toggle}
            aria-label={playing ? 'Pausar música' : 'Tocar música'}
            aria-pressed={playing}
            className="grid size-11 place-items-center rounded-full border border-paper/20 bg-ink/45 text-paper backdrop-blur-md transition-[background-color,transform] hover:bg-ink/65 active:scale-95"
          >
            <span className={`flex h-3.5 items-end gap-[3px] ${playing ? 'eq-playing' : ''}`} aria-hidden="true">
              {[0, 0.25, 0.5, 0.15].map((delay, i) => (
                <span key={i} className="eq-bar block h-full w-[2px] rounded-full bg-paper/90" style={{ animationDelay: `${delay}s` }} />
              ))}
            </span>
          </button>
        </m.div>
      )}

      {/* Cartão com o player oficial: montado desde o início, visível após a abertura. */}
      <m.div
        className="fixed inset-x-0 z-50 mx-auto w-[min(92vw,360px)]"
        style={{ bottom: 'max(1rem, env(safe-area-inset-bottom))', pointerEvents: visible ? 'auto' : 'none' }}
        initial={false}
        animate={visible ? { y: 0, opacity: 1 } : { y: '160%', opacity: 0 }}
        transition={{ duration: 0.9, ease: EASE_CINE }}
        aria-hidden={!visible}
        inert={!visible}
      >
        <div className="relative">
          <div ref={hostRef} className="h-20 overflow-hidden rounded-xl bg-ink shadow-[0_12px_40px_rgb(0_0_0/0.45)]" />
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Recolher player"
            className="absolute -top-3 -right-2 grid size-8 place-items-center rounded-full border border-paper/25 bg-ink text-paper/80 shadow-lg"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
        </div>
      </m.div>
    </>
  );
}
