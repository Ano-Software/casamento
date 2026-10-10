import { AnimatePresence, m, useReducedMotion } from 'motion/react';
import { useEffect, useState } from 'react';
import { INVITE } from '../config/invite';
import { EASE_CINE } from '../lib/motion';

interface Props {
  onStart: () => void;
  withSound: boolean;
}

/** 0: escuro · 1: frase · 2: nomes · 3: nomes + chamada */
type Stage = 0 | 1 | 2 | 3;

/**
 * Cena 1 — Abertura. Uma cartela escura, como o início de um filme.
 * Dura ~4 s; um toque em qualquer lugar adianta direto para o botão.
 */
export function Intro({ onStart, withSound }: Props) {
  const reduce = useReducedMotion();
  const [stage, setStage] = useState<Stage>(reduce ? 3 : 0);

  useEffect(() => {
    if (reduce) return setStage(3);
    const timers = [
      window.setTimeout(() => setStage(1), 350),
      window.setTimeout(() => setStage(2), 3000),
      window.setTimeout(() => setStage(3), 4700),
    ];
    return () => timers.forEach(window.clearTimeout);
  }, [reduce]);

  const skip = () => setStage((s) => (s < 2 ? 3 : s === 2 ? 3 : s));

  return (
    <m.div
      key="intro"
      role="dialog"
      aria-modal="true"
      aria-label="Abertura do convite"
      className="h-screen-d fixed inset-0 z-[70] flex items-center justify-center overflow-hidden bg-ink px-6"
      onClick={stage < 3 ? skip : undefined}
      exit={{ opacity: 0, transition: { duration: 1.4, ease: EASE_CINE } }}
    >
      {/* Luz quente muito suave, como um projetor ao fundo */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(ellipse at 50% 42%, rgb(168 135 90 / 0.10), transparent 62%)' }}
      />

      <AnimatePresence mode="wait">
        {stage === 1 && (
          <m.p
            key="phrase"
            className="max-w-[17ch] text-center font-serif text-[clamp(1.6rem,6.6vw,2.6rem)] font-light italic leading-snug text-paper/90"
            initial={{ opacity: 0, y: 14, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
            transition={{ duration: 1.5, ease: EASE_CINE }}
          >
            Algumas histórias são escritas para durar para sempre.
          </m.p>
        )}

        {stage >= 2 && (
          <m.div
            key="names"
            className="flex flex-col items-center text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="flex flex-col items-center font-serif font-light uppercase leading-[0.95] text-paper">
              <m.span
                className="block text-[clamp(2.4rem,10.5vw,4.6rem)] tracking-[0.14em]"
                initial={{ opacity: 0, y: 18, filter: 'blur(8px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 1.4, ease: EASE_CINE }}
              >
                {INVITE.groom.first}
              </m.span>
              <m.span
                className="my-2 block font-serif text-[clamp(1.8rem,7vw,3rem)] italic normal-case text-gold-soft"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.2, delay: 0.35, ease: EASE_CINE }}
              >
                &amp;
              </m.span>
              <m.span
                className="block text-[clamp(2.4rem,10.5vw,4.6rem)] tracking-[0.14em]"
                initial={{ opacity: 0, y: 18, filter: 'blur(8px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 1.4, delay: 0.55, ease: EASE_CINE }}
              >
                {INVITE.bride.first}
              </m.span>
            </h1>

            <m.p
              className="mt-8 font-serif text-lg font-light italic text-sand/90 sm:text-xl"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, delay: 1.0, ease: EASE_CINE }}
            >
              Uma nova página da nossa história.
            </m.p>

            <m.div
              className="mt-12 flex flex-col items-center gap-4"
              initial={{ opacity: 0, y: 10 }}
              animate={stage === 3 ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
              transition={{ duration: 1.1, ease: EASE_CINE }}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onStart();
                }}
                disabled={stage < 3}
                autoFocus={stage === 3}
                className="group relative min-h-12 overflow-hidden border border-paper/35 px-9 py-4 font-sans text-[0.68rem] font-normal uppercase tracking-[0.34em] text-paper transition-[border-color,transform] duration-500 hover:border-gold-soft active:scale-[0.97] disabled:pointer-events-none"
              >
                <span
                  aria-hidden="true"
                  className="absolute inset-0 origin-left scale-x-0 bg-paper/10 transition-transform duration-700 ease-[var(--ease-cine)] group-hover:scale-x-100 group-active:scale-x-100"
                />
                <span className="relative">Viver esse momento</span>
              </button>
              {withSound && (
                <p className="flex items-center gap-2 text-[0.65rem] tracking-[0.18em] text-paper/45 uppercase">
                  <SpeakerIcon /> Com trilha sonora
                </p>
              )}
            </m.div>
          </m.div>
        )}
      </AnimatePresence>
    </m.div>
  );
}

function SpeakerIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M4 9v6h4l5 4V5L8 9H4z" />
      <path d="M16.5 8.5a5 5 0 0 1 0 7" />
    </svg>
  );
}
