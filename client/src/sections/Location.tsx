import { m, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { useRef } from 'react';
import { ChapterLabel } from '../components/ChapterLabel';
import { Photo } from '../components/Photo';
import { Reveal } from '../components/Reveal';
import { INVITE, PHOTOS } from '../config/invite';

const { ceremony: c } = INVITE;

/**
 * Cena 5 — Localização. Composição editorial sobre tom areia.
 * A foto do espelho entra recortada só no reflexo: uma moldura natural
 * para "o que vem pela frente".
 */
export function Location() {
  const frameRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: frameRef, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], ['-6%', '6%']);

  return (
    <section aria-label="Localização" className="relative bg-sand px-6 pt-24 pb-28 text-ink">
      <div className="mx-auto max-w-md">
        <Reveal className="text-center">
          <ChapterLabel index="IV" title="O lugar" className="text-ink/60" />
        </Reveal>

        <Reveal delay={0.1} className="mx-auto mt-10 w-[86%]">
          <div className="relative">
            {/* Moldura deslocada, como um passe-partout */}
            <span aria-hidden="true" className="absolute inset-0 translate-x-3 translate-y-3 border border-ink/25" />
            <div ref={frameRef} className="relative aspect-[769/600] overflow-hidden bg-ink-soft">
              <m.div style={{ y: reduce ? 0 : y }} className="absolute -inset-y-[8%] inset-x-0">
                <Photo
                  photo={PHOTOS.mirror}
                  className="grade-warm h-full w-full object-cover"
                  style={{ objectPosition: '50% 0%' }}
                />
              </m.div>
            </div>
          </div>
          <p className="mt-8 text-center font-serif text-sm italic text-ink/55">Nós dois, em cada reflexo.</p>
        </Reveal>

        <div className="mt-16 text-center">
          <Reveal>
            <h2 className="font-serif text-[clamp(2.5rem,11vw,3.75rem)] font-light leading-none">Nosso grande dia</h2>
          </Reveal>
          <Reveal delay={0.15}>
            <p className="mt-6 font-serif text-xl font-light italic text-ink/80">
              {c.dateLong}, às {c.time}.
            </p>
          </Reveal>
          <Reveal delay={0.25}>
            <p className="mx-auto mt-6 max-w-[18rem] text-[0.78rem] uppercase leading-relaxed tracking-[0.26em]">
              {c.venueLines.map((line) => <span key={line} className="block">{line}</span>)}
            </p>
          </Reveal>
          <Reveal delay={0.35} className="mt-10">
            <a
              href={c.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex min-h-12 items-center gap-3 bg-ink px-9 py-4 text-[0.68rem] uppercase tracking-[0.34em] text-paper transition-[background-color,transform] duration-500 hover:bg-ink-soft active:scale-[0.97]"
            >
              Como chegar
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
                aria-hidden="true"
                className="transition-transform duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              >
                <path d="M7 17 17 7M9 7h8v8" />
              </svg>
              <span className="sr-only">(abre o Google Maps em uma nova aba)</span>
            </a>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
