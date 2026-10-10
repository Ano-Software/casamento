import { m, useReducedMotion } from 'motion/react';
import { ChapterLabel } from '../components/ChapterLabel';
import { MapButton } from '../components/MapButton';
import { Reveal } from '../components/Reveal';
import { INVITE } from '../config/invite';
import { EASE_CINE } from '../lib/motion';

const { civil: c, date: d } = INVITE;

/** Duas alianças desenhadas em traço fino, entrelaçando-se ao entrar na tela. */
function Rings() {
  const reduce = useReducedMotion();
  const draw = (delay: number) => ({
    initial: reduce ? { pathLength: 1, opacity: 0 } : { pathLength: 0, opacity: 0 },
    whileInView: { pathLength: 1, opacity: 1 },
    viewport: { once: true, amount: 0.8 },
    transition: { duration: reduce ? 0.6 : 2.2, delay, ease: EASE_CINE },
  });
  return (
    <svg width="76" height="44" viewBox="0 0 76 44" fill="none" aria-hidden="true" className="mx-auto text-gold">
      <m.circle cx="27" cy="22" r="18" stroke="currentColor" strokeWidth="1" {...draw(0.1)} />
      <m.circle cx="49" cy="22" r="18" stroke="currentColor" strokeWidth="1" {...draw(0.6)} />
    </svg>
  );
}

/**
 * Capítulo I — O sim. O casamento civil, momento principal do dia:
 * composição tipográfica sobre tom areia, com o horário em destaque.
 */
export function CivilChapter() {
  return (
    <section id="o-sim" aria-label="Capítulo I — O sim: casamento civil" className="relative scroll-mt-4 bg-sand text-ink">
      <div aria-hidden="true" className="h-[18svh] bg-gradient-to-b from-paper to-sand" />

      <div className="mx-auto max-w-md px-6 pb-28 text-center">
        <Reveal>
          <ChapterLabel index="I" title="O sim" className="text-ink/60" />
        </Reveal>

        <Reveal delay={0.15} className="mt-10">
          <h2 className="font-serif text-[clamp(2.4rem,10.5vw,3.6rem)] font-light leading-[1.05]">
            O primeiro sim.
            <span className="mt-2 block text-[0.62em] italic leading-snug text-ink/75">O começo de uma vida inteira.</span>
          </h2>
        </Reveal>

        <div className="mt-14">
          <Rings />
        </div>

        <Reveal className="mt-8">
          <p className="eyebrow text-ink/60">Casamento civil</p>
          <p className="mt-3 font-serif text-[clamp(5rem,24vw,7.5rem)] font-light leading-none">{c.time}</p>
          <p className="mt-4 font-serif text-xl italic text-ink/80">
            {d.weekday}, {d.long}
          </p>
        </Reveal>

        <Reveal className="mt-10">
          <span aria-hidden="true" className="mx-auto mb-6 block h-10 w-px bg-ink/25" />
          <p className="text-[0.78rem] uppercase leading-relaxed tracking-[0.26em]">
            {c.venueLines.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </p>
        </Reveal>

        <Reveal className="mt-10">
          <MapButton href={c.mapsUrl} label="Como chegar" />
        </Reveal>
      </div>
    </section>
  );
}
