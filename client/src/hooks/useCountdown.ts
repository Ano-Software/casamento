import { useEffect, useState } from 'react';

export type Countdown =
  | { phase: 'before'; days: number; hours: number; minutes: number; seconds: number }
  | { phase: 'today' }
  | { phase: 'after' };

/** Janela após o início da cerimônia em que mostramos "é hoje". */
const TODAY_WINDOW_MS = 10 * 60 * 60 * 1000;

/**
 * Contagem regressiva até um instante absoluto (o ISO já carrega o fuso
 * de Brasília), portanto independe do fuso configurado no aparelho.
 */
export function useCountdown(targetIso: string): Countdown {
  const target = Date.parse(targetIso);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let id: number;
    const tick = () => {
      setNow(Date.now());
      id = window.setTimeout(tick, 1000 - (Date.now() % 1000) + 5);
    };
    id = window.setTimeout(tick, 1000 - (Date.now() % 1000) + 5);
    return () => window.clearTimeout(id);
  }, []);

  const diff = target - now;
  if (diff <= 0) return { phase: -diff < TODAY_WINDOW_MS ? 'today' : 'after' };

  const total = Math.floor(diff / 1000);
  return {
    phase: 'before',
    days: Math.floor(total / 86_400),
    hours: Math.floor((total % 86_400) / 3_600),
    minutes: Math.floor((total % 3_600) / 60),
    seconds: total % 60,
  };
}
