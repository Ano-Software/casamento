import { m, useReducedMotion, useScroll, useTransform, type MotionValue } from 'motion/react';
import { useRef, type CSSProperties } from 'react';
import { ChapterLabel } from '../components/ChapterLabel';
import { MapButton } from '../components/MapButton';
import { Photo } from '../components/Photo';
import { Reveal } from '../components/Reveal';
import { ALBUM, INVITE, type PhotoAsset } from '../config/invite';

const { photos: p } = INVITE;

interface PrintProps {
  photo: PhotoAsset;
  className: string;
  aspect: string;
  rotate: number;
  y: MotionValue<string> | string;
  focus?: string;
  grade?: string;
}

/** Foto "impressa": moldura de papel, leve rotação e parallax próprio. */
function Print({ photo, className, aspect, rotate, y, focus = '50% 50%', grade = 'grade-warm' }: PrintProps) {
  return (
    <m.figure
      style={{ y, rotate } as unknown as CSSProperties}
      className={`absolute bg-paper p-1.5 shadow-[0_18px_50px_rgb(0_0_0/0.5)] ${className}`}
    >
      <div className="overflow-hidden" style={{ aspectRatio: aspect }}>
        <Photo photo={photo} className={`${grade} h-full w-full object-cover`} style={{ objectPosition: focus }} />
      </div>
    </m.figure>
  );
}

/**
 * Capítulo II — Memórias para sempre. A sessão de fotos, como um álbum
 * aberto: quatro fotografias reais que deslizam em velocidades diferentes.
 */
export function PhotosChapter() {
  const albumRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: albumRef, offset: ['start end', 'end start'] });
  const yA = useTransform(scrollYProgress, [0, 1], ['4%', '-4%']);
  const yB = useTransform(scrollYProgress, [0, 1], ['22%', '-18%']);
  const yC = useTransform(scrollYProgress, [0, 1], ['14%', '-12%']);
  const yD = useTransform(scrollYProgress, [0, 1], ['26%', '-22%']);
  const still = '0%';

  return (
    <section
      id="memorias"
      aria-label="Capítulo II — Memórias para sempre: sessão de fotos"
      className="relative scroll-mt-4 overflow-hidden bg-ink text-paper"
    >
      {/* Do areia para o entardecer */}
      <div
        aria-hidden="true"
        className="h-[30svh]"
        style={{ background: 'linear-gradient(180deg, #d8c8b4 0%, #8f7a62 35%, #3a2f26 70%, #11100f 100%)' }}
      />
      {/* Luz dourada de fim de tarde */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-[30svh] h-[70%]"
        style={{ background: 'radial-gradient(ellipse at 70% 30%, rgb(196 167 122 / 0.16), transparent 60%)' }}
      />

      <div className="relative mx-auto max-w-md px-6 pb-28 text-center">
        <Reveal>
          <ChapterLabel index="II" title="Memórias para sempre" className="text-sand/75" />
        </Reveal>

        <Reveal delay={0.15} className="mx-auto mt-8 max-w-[19ch]">
          <h2 className="font-serif text-[clamp(1.9rem,8.4vw,2.9rem)] font-light leading-[1.12] text-balance">
            Depois do nosso sim, <span className="italic text-sand">queremos eternizar esse momento.</span>
          </h2>
        </Reveal>

        {/* Álbum */}
        <div ref={albumRef} className="relative mx-auto mt-14 aspect-[4/6.6] w-full">
          <Print
            photo={ALBUM.passeio}
            aspect="4 / 5.6"
            rotate={-2.5}
            y={reduce ? still : yA}
            focus="50% 20%"
            className="top-0 left-0 w-[58%]"
          />
          <Print
            photo={ALBUM.juntinhos}
            aspect="3 / 4"
            rotate={3}
            y={reduce ? still : yB}
            focus="50% 40%"
            grade="grade-tame"
            className="top-[6%] right-0 w-[46%]"
          />
          <Print
            photo={ALBUM.festa}
            aspect="4 / 5"
            rotate={2}
            y={reduce ? still : yC}
            focus="50% 45%"
            className="top-[45%] right-[2%] w-[50%]"
          />
          <Print
            photo={ALBUM.espelho}
            aspect="3 / 4"
            rotate={-3}
            y={reduce ? still : yD}
            focus="50% 55%"
            grade="grade-tame"
            className="top-[52%] left-[2%] w-[48%]"
          />
        </div>
        <p className="mt-6 font-serif text-sm italic text-paper/50">Para guardar, para sempre.</p>

        <div className="mt-16">
          <Reveal>
            <p className="eyebrow text-sand/70">Sessão de fotos</p>
            <p className="mt-4 font-serif text-[clamp(2rem,9vw,2.8rem)] font-light leading-tight">{p.venue}</p>
          </Reveal>
          <Reveal delay={0.15}>
            <p className="mt-4 font-serif text-xl italic text-sand">{p.time ?? p.timeFallback}</p>
            {!p.time && (
              <p className="mt-2 text-xs tracking-[0.04em] text-paper/45">O horário exato será informado em breve.</p>
            )}
          </Reveal>
          <Reveal delay={0.25} className="mt-10">
            <MapButton href={p.mapsUrl} label="Ver localização" variant="outline" />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
