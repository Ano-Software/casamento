import { ChapterLabel } from '../components/ChapterLabel';
import { Countdown } from '../components/Countdown';
import { Reveal } from '../components/Reveal';
import { INVITE } from '../config/invite';
import { MOMENTS } from './moments';

const { date: d } = INVITE;

function Name({ first, last }: { first: string; last: string }) {
  return (
    <span className="flex flex-col items-center">
      <span className="font-serif text-[clamp(2.6rem,12vw,4.5rem)] font-light leading-none tracking-[0.02em]">
        {first}
      </span>
      <span className="mt-2 text-[0.68rem] uppercase tracking-[0.5em] text-taupe">{last}</span>
    </span>
  );
}

/**
 * O convite. A luz se acende: transição do escuro para o papel, com a data
 * como protagonista e o "sumário" dos três capítulos do dia.
 */
export function Invitation() {
  return (
    <section aria-label="O convite" className="relative">
      {/* Fade to light — como a luz da sala voltando aos poucos */}
      <div
        aria-hidden="true"
        className="h-[34svh]"
        style={{
          background:
            'linear-gradient(180deg, #11100f 0%, #2a2521 22%, #6f655a 52%, #c9bba8 80%, #f5f0e8 100%)',
        }}
      />

      <div className="bg-paper px-6 pb-28 text-center text-ink">
        <Reveal>
          <ChapterLabel title="O convite" className="text-taupe" />
        </Reveal>

        <Reveal delay={0.15} className="mx-auto mt-8 max-w-[22ch]">
          <p className="font-serif text-[clamp(1.5rem,6vw,2.2rem)] font-light italic leading-snug text-balance text-ink/85">
            Com alegria, queremos compartilhar com você o início de um novo capítulo.
          </p>
        </Reveal>

        <Reveal delay={0.1} className="mt-16">
          <h2 className="flex flex-col items-center gap-5 text-ink">
            <Name first={INVITE.groom.first} last={INVITE.groom.last} />
            <span className="font-serif text-3xl italic text-gold" aria-label="e">
              &amp;
            </span>
            <Name first={INVITE.bride.first} last={INVITE.bride.last} />
          </h2>
        </Reveal>

        <Reveal className="mt-20">
          <p className="sr-only">
            {d.weekday}, {d.long}.
          </p>
          <div aria-hidden="true" className="mx-auto flex max-w-sm items-center justify-center">
            <span className="flex-1 border-y border-ink/20 py-3 text-[0.7rem] uppercase tracking-[0.32em]">
              {d.weekday}
            </span>
            <span className="px-5 font-serif text-[clamp(5.5rem,26vw,8.5rem)] font-light leading-[0.8] text-ink">
              {d.day}
            </span>
            <span className="flex-1 border-y border-ink/20 py-3 text-[0.7rem] uppercase tracking-[0.32em]">
              {d.year}
            </span>
          </div>
          <p aria-hidden="true" className="mt-5 font-serif text-[clamp(1.6rem,6.5vw,2.2rem)] font-light uppercase tracking-[0.3em]">
            {d.month}
          </p>
        </Reveal>

        {/* Sumário do "filme": um dia, três momentos */}
        <Reveal className="mx-auto mt-16 max-w-xs">
          <span aria-hidden="true" className="mx-auto mb-8 block h-10 w-px bg-ink/25" />
          <p className="font-serif text-xl italic text-ink/75">Um dia, três momentos.</p>
          <nav aria-label="Os três momentos do dia" className="mt-7">
            <ol className="flex flex-col">
              {MOMENTS.map((mo) => (
                <li key={mo.id}>
                  <a
                    href={`#${mo.id}`}
                    className="group flex min-h-12 items-baseline gap-4 border-t border-ink/12 py-3.5 text-left transition-colors last:border-b hover:text-gold"
                  >
                    <span className="w-7 font-serif text-sm tracking-[0.12em] text-gold">{mo.index}</span>
                    <span className="flex-1 font-serif text-lg leading-tight">{mo.title}</span>
                    <span className="text-[0.62rem] uppercase tracking-[0.2em] text-taupe">{mo.when}</span>
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </Reveal>

        <Reveal className="mt-20">
          <Countdown />
        </Reveal>
      </div>
    </section>
  );
}
