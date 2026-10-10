import { AnimatePresence, m } from 'motion/react';
import { INVITE } from '../config/invite';
import { useCountdown } from '../hooks/useCountdown';

const UNITS = [
  { key: 'days', one: 'dia', many: 'dias' },
  { key: 'hours', one: 'hora', many: 'horas' },
  { key: 'minutes', one: 'minuto', many: 'minutos' },
  { key: 'seconds', one: 'segundo', many: 'segundos' },
] as const;

/** Contagem regressiva editorial: numerais serifados separados por fios finos. */
export function Countdown() {
  const c = useCountdown(INVITE.ceremony.iso);

  if (c.phase !== 'before') {
    return (
      <p className="mx-auto max-w-[24ch] font-serif text-2xl font-light italic leading-snug text-ink/80">
        {c.phase === 'today'
          ? 'Hoje é o grande dia. Obrigado por estar com a gente.'
          : 'Nosso para sempre já começou. Obrigado por fazer parte dessa história.'}
      </p>
    );
  }

  return (
    <div>
      <p className="eyebrow mb-6 text-taupe">Faltam</p>
      <div className="mx-auto grid max-w-md grid-cols-4" role="timer" aria-live="off">
        {UNITS.map((u, i) => {
          const value = c[u.key];
          return (
            <div key={u.key} className={`flex flex-col items-center px-1 ${i > 0 ? 'border-l border-ink/15' : ''}`}>
              <span className="relative block h-[1.15em] overflow-hidden font-serif text-[clamp(2.1rem,9.5vw,3rem)] font-light leading-none tabular-nums text-ink">
                <AnimatePresence mode="popLayout" initial={false}>
                  <m.span
                    key={value}
                    className="block"
                    initial={{ y: '-60%', opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: '60%', opacity: 0 }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  >
                    {u.key === 'days' ? value : String(value).padStart(2, '0')}
                  </m.span>
                </AnimatePresence>
              </span>
              <span className="mt-2 text-[0.6rem] uppercase tracking-[0.24em] text-taupe">
                {value === 1 ? u.one : u.many}
              </span>
            </div>
          );
        })}
      </div>
      <p className="sr-only">
        Faltam {c.days} dias, {c.hours} horas e {c.minutes} minutos para o casamento.
      </p>
    </div>
  );
}
