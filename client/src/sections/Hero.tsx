import { m, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { useRef } from 'react';
import { Photo } from '../components/Photo';
import { ChapterLabel } from '../components/ChapterLabel';
import { PHOTOS } from '../config/invite';
import { EASE_CINE } from '../lib/motion';

const LINES = ['Dois caminhos,', 'uma escolha,', 'uma vida inteira.'];

/**
 * Cena 2 — Nossa história. A foto principal em tela cheia, com um
 * movimento de câmera lento. Em telas largas, a foto mantém o formato
 * retrato original, sobre um fundo desfocado dela mesma.
 */
export function Hero({ started }: { started: boolean }) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const photoY = useTransform(scrollYProgress, [0, 1], ['0%', '16%']);
  const textOpacity = useTransform(scrollYProgress, [0, 0.55], [1, 0]);

  return (
    <section ref={ref} aria-label="Nossa história" className="h-screen-s relative overflow-hidden bg-ink">
      {/* Fundo desfocado (somente telas largas) */}
      <div aria-hidden="true" className="absolute inset-0 hidden md:block">
        <Photo photo={PHOTOS.main} decorative priority className="h-full w-full scale-110 object-cover blur-2xl brightness-[0.45]" />
      </div>

      <m.div style={{ y: reduce ? 0 : photoY }} className="absolute inset-0 will-change-transform">
        <div className="absolute inset-0 overflow-hidden md:right-auto md:left-1/2 md:w-auto md:aspect-[9/16] md:-translate-x-1/2 md:shadow-[0_0_120px_rgb(0_0_0/0.6)]">
          <div className={`h-full w-full ${started ? 'kenburns-run' : 'kenburns-idle'}`}>
            <Photo
              photo={PHOTOS.main}
              priority
              className="grade-warm h-full w-full object-cover"
              style={{ objectPosition: '50% 22%' }}
            />
          </div>
          {/* Legibilidade: véu superior para o controle de áudio, inferior para o texto */}
          <div aria-hidden="true" className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-ink/55 to-transparent" />
          <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[62%] bg-gradient-to-t from-ink via-ink/60 to-transparent" />
          <div aria-hidden="true" className="vignette absolute inset-0" />
        </div>
      </m.div>

      <m.div
        style={{ opacity: reduce ? 1 : textOpacity }}
        className="absolute inset-x-0 bottom-0 flex flex-col items-center px-6 text-center"
      >
        <div style={{ paddingBottom: 'max(2.5rem, calc(env(safe-area-inset-bottom) + 1.75rem))' }} className="flex flex-col items-center">
          <m.div
            initial={{ opacity: 0 }}
            animate={started ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 1.2, delay: 0.5 }}
          >
            <ChapterLabel index="Prólogo" title="Nossa história" className="text-sand/80" />
          </m.div>

          <h2 className="mt-5 font-serif text-[clamp(2.1rem,9vw,3.6rem)] font-light leading-[1.08] text-paper">
            {LINES.map((line, i) => (
              <m.span
                key={line}
                className={`block ${i === 2 ? 'italic text-sand' : ''}`}
                initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }}
                animate={started ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
                transition={{ duration: 1.5, delay: 0.9 + i * 0.75, ease: EASE_CINE }}
              >
                {line}
              </m.span>
            ))}
          </h2>

          <m.div
            aria-hidden="true"
            className="mt-10 flex flex-col items-center gap-3 text-paper/50"
            initial={{ opacity: 0 }}
            animate={started ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 1, delay: 3.6 }}
          >
            <span className="eyebrow text-[0.55rem]">Deslize</span>
            <span className="relative block h-10 w-px overflow-hidden bg-paper/15">
              <span className="scroll-cue-line absolute inset-0 bg-paper/70" />
            </span>
          </m.div>
        </div>
      </m.div>
    </section>
  );
}
