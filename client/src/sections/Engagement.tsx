import { m, useReducedMotion } from 'motion/react';
import { Photo } from '../components/Photo';
import { ChapterLabel } from '../components/ChapterLabel';
import { Reveal } from '../components/Reveal';
import { PHOTOS } from '../config/invite';
import { EASE_CINE } from '../lib/motion';

/** Ponto do anel na foto: a revelação nasce dele. */
const RING = '47% 51%';

/**
 * Cena 3 — O noivado. Mais intimista: a foto é "descoberta" a partir do
 * anel, como uma íris de cinema se abrindo.
 */
export function Engagement() {
  const reduce = useReducedMotion();

  return (
    <section aria-label="O noivado" className="min-h-screen-s relative flex flex-col overflow-hidden bg-ink">
      <div className="relative flex-1 md:flex md:items-center md:justify-center md:py-24">
        {/* O gatilho fica num contêiner sem clip-path: o Chromium desconta o
            clip-path do alvo no IntersectionObserver, e circle(0%) nunca "entraria". */}
        <m.div
          className="absolute inset-0 md:relative md:inset-auto md:aspect-[3/4] md:h-[78svh]"
          initial="hidden"
          whileInView="shown"
          viewport={{ once: true, amount: 0.35 }}
        >
          <m.div
            className="absolute inset-0 overflow-hidden"
            variants={{
              hidden: reduce ? { opacity: 0 } : { clipPath: `circle(0% at ${RING})` },
              shown: reduce ? { opacity: 1 } : { clipPath: `circle(85% at ${RING})` },
            }}
            transition={{ duration: reduce ? 0.8 : 2.6, ease: EASE_CINE }}
          >
            <m.div
              className="h-full w-full"
              variants={{ hidden: { scale: 1.18 }, shown: { scale: 1.04 } }}
              transition={{ duration: 6, ease: EASE_CINE }}
            >
              <Photo photo={PHOTOS.rings} className="grade-tame h-full w-full object-cover" style={{ objectPosition: RING }} />
            </m.div>
            <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(ellipse_at_47%_51%,transparent_30%,rgb(17_16_15/0.7)_100%)]" />
            <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-ink via-ink/70 to-transparent md:hidden" />
            <div aria-hidden="true" className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-ink to-transparent md:hidden" />
          </m.div>
        </m.div>
      </div>

      <div
        className="relative z-10 -mt-[38svh] flex flex-col items-center px-7 text-center md:mt-0 md:pb-28"
        style={{ paddingBottom: 'max(4rem, calc(env(safe-area-inset-bottom) + 3rem))' }}
      >
        <Reveal amount={0.6}>
          <ChapterLabel title="O noivado" className="text-sand/75" />
        </Reveal>
        <Reveal delay={0.3} amount={0.6} className="mt-6 max-w-[20ch]">
          <p className="font-serif text-[clamp(1.75rem,7.4vw,2.8rem)] font-light leading-[1.15] text-paper">
            Um sim que nos trouxe até aqui.
          </p>
        </Reveal>
        <Reveal delay={1.3} amount={0.6} className="mt-4 max-w-[22ch]">
          <p className="font-serif text-[clamp(1.35rem,5.6vw,2.1rem)] font-light italic leading-snug text-sand">
            Outro que nos acompanhará para sempre.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
