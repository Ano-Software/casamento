import { m } from 'motion/react';
import { ChapterLabel } from '../components/ChapterLabel';
import { Photo } from '../components/Photo';
import { Reveal } from '../components/Reveal';
import { PHOTOS } from '../config/invite';

interface Props {
  onOpen: () => void;
}

/** Cena 6 — Confirmação de presença, sobre a foto mais próxima do casal. */
export function Rsvp({ onOpen }: Props) {
  return (
    <section aria-label="Confirmação de presença" className="min-h-screen-s relative flex items-end overflow-hidden bg-ink">
      <div aria-hidden="true" className="absolute inset-0">
        {/* Telas largas: fundo desfocado + foto em coluna retrato, como no início */}
        <div className="absolute inset-0 hidden md:block">
          <Photo photo={PHOTOS.close} decorative className="h-full w-full scale-110 object-cover blur-2xl brightness-[0.4]" />
        </div>
        <m.div
          className="absolute inset-0 md:right-auto md:left-1/2 md:aspect-[3/4] md:-translate-x-1/2"
          initial={{ scale: 1.12 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 8, ease: [0.22, 1, 0.36, 1] }}
        >
          <Photo
            photo={PHOTOS.close}
            decorative
            className="grade-warm h-full w-full object-cover"
            style={{ objectPosition: '50% 30%' }}
          />
        </m.div>
        {/* Transição do areia para o escuro + véu para leitura */}
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-sand to-transparent opacity-90" />
        <div className="absolute inset-0 bg-ink/35" />
        <div className="absolute inset-x-0 bottom-0 h-[75%] bg-gradient-to-t from-ink via-ink/85 to-transparent" />
      </div>

      <div
        className="relative mx-auto flex w-full max-w-md flex-col items-center px-7 text-center"
        style={{ paddingBottom: 'max(5rem, calc(env(safe-area-inset-bottom) + 4rem))' }}
      >
        <Reveal>
          <ChapterLabel index="V" title="Sua presença" className="text-sand/80" />
        </Reveal>
        <Reveal delay={0.15} className="mt-6">
          <h2 className="font-serif text-[clamp(2.3rem,10vw,3.5rem)] font-light leading-[1.05] text-paper">
            Queremos você <span className="block italic text-sand">com a gente.</span>
          </h2>
        </Reveal>
        <Reveal delay={0.3} className="mt-6">
          <p className="max-w-[34ch] text-[0.95rem] font-light leading-relaxed text-paper/75">
            Sua presença tornará esse momento ainda mais especial. Confirme sua presença para que possamos nos preparar
            para esse dia.
          </p>
        </Reveal>
        <Reveal delay={0.45} className="mt-10">
          <button
            type="button"
            onClick={onOpen}
            aria-haspopup="dialog"
            className="min-h-12 bg-paper px-9 py-4 text-[0.68rem] uppercase tracking-[0.34em] text-ink transition-[background-color,transform] duration-500 hover:bg-sand active:scale-[0.97]"
          >
            Confirmar presença
          </button>
        </Reveal>
      </div>
    </section>
  );
}
