import { useCallback, useEffect, useRef, useState } from 'react';
import { AUDIO } from './config';

export type AudioStatus =
  | 'disabled' // nenhuma fonte configurada
  | 'idle' // aguardando a primeira interação
  | 'loading'
  | 'playing'
  | 'paused'
  | 'error'; // fonte indisponível: o convite segue sem música

/**
 * Trilha sonora de fundo com HTMLAudioElement.
 * `play()` deve ser chamado de forma síncrona dentro de um toque/clique,
 * exigência dos navegadores móveis para liberar o áudio.
 */
export function useBackgroundAudio(src: string = AUDIO.src) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeRef = useRef<number | null>(null);
  const resumeOnVisible = useRef(false);
  const [status, setStatus] = useState<AudioStatus>(src ? 'idle' : 'disabled');

  const stopFade = () => {
    if (fadeRef.current !== null) cancelAnimationFrame(fadeRef.current);
    fadeRef.current = null;
  };

  // Em iOS o volume é somente leitura: o fade simplesmente não tem efeito.
  const fadeTo = useCallback((target: number, ms: number, done?: () => void) => {
    const a = audioRef.current;
    if (!a) return;
    stopFade();
    const from = a.volume;
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / ms);
      try {
        a.volume = from + (target - from) * t;
      } catch {
        /* volume não suportado */
      }
      if (t < 1) fadeRef.current = requestAnimationFrame(step);
      else {
        fadeRef.current = null;
        done?.();
      }
    };
    fadeRef.current = requestAnimationFrame(step);
  }, []);

  const ensureAudio = useCallback(() => {
    if (audioRef.current) return audioRef.current;
    const a = new Audio();
    a.loop = true;
    a.preload = 'auto';
    a.src = src;
    try {
      a.volume = 0;
    } catch {
      /* iOS */
    }
    a.addEventListener('playing', () => setStatus('playing'));
    a.addEventListener('waiting', () => setStatus((s) => (s === 'playing' ? 'loading' : s)));
    a.addEventListener('error', () => {
      stopFade();
      setStatus('error');
    });
    audioRef.current = a;
    return a;
  }, [src]);

  const play = useCallback(() => {
    if (!src) return;
    const a = ensureAudio();
    if (a.error) return setStatus('error');
    setStatus('loading');
    const result = a.play();
    const onStart = () => fadeTo(AUDIO.volume, AUDIO.fadeInMs);
    if (result && typeof result.then === 'function') {
      result.then(onStart).catch(() => setStatus(a.error ? 'error' : 'paused'));
    } else onStart();
  }, [src, ensureAudio, fadeTo]);

  const pause = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    setStatus('paused');
    fadeTo(0, AUDIO.fadeOutMs, () => a.pause());
  }, [fadeTo]);

  const toggle = useCallback(() => {
    if (status === 'playing' || status === 'loading') pause();
    else play();
  }, [status, play, pause]);

  // Pausa quando o convidado troca de aba/app (ex.: volta ao WhatsApp) e retoma ao voltar.
  useEffect(() => {
    const onVisibility = () => {
      const a = audioRef.current;
      if (!a) return;
      if (document.hidden) {
        resumeOnVisible.current = !a.paused;
        if (!a.paused) {
          stopFade();
          a.pause();
          setStatus('paused');
        }
      } else if (resumeOnVisible.current) {
        resumeOnVisible.current = false;
        play();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [play]);

  useEffect(
    () => () => {
      stopFade();
      audioRef.current?.pause();
      audioRef.current = null;
    },
    [],
  );

  return { status, play, pause, toggle, available: status !== 'disabled' && status !== 'error' };
}
