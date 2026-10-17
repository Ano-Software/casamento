import { ChapterLabel } from '../components/ChapterLabel';
import { MapButton } from '../components/MapButton';
import { Reveal } from '../components/Reveal';
import { INVITE } from '../config/invite';

const { dinner: n } = INVITE;
const pending = !n.venue && !n.time;

/** Pequenas luzes quentes ao fundo, como velas e luzes da cidade à noite. */
const LIGHTS = [
  { x: 12, y: 18, s: 3, d: 0 },
  { x: 84, y: 12, s: 2, d: 1.2 },
  { x: 70, y: 34, s: 4, d: 2.1 },
  { x: 22, y: 52, s: 2, d: 0.7 },
  { x: 90, y: 60, s: 3, d: 1.7 },
  { x: 8, y: 78, s: 2, d: 2.6 },
  { x: 60, y: 86, s: 3, d: 0.4 },
  { x: 40, y: 8, s: 2, d: 3 },
];

function Detail({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-t border-paper/10 py-4 text-left first:border-t-0">
      <dt className="eyebrow shrink-0 text-sand/60">{label}</dt>
      <dd className={`text-right font-serif text-lg ${value ? 'text-paper' : 'italic text-paper/55'}`}>
        {value ?? 'Será informado em breve'}
      </dd>
    </div>
  );
}

/**
 * Capítulo III — Uma noite para celebrar. O encontro no restaurante:
 * atmosfera acolhedora, informações pendentes e o aviso sobre o consumo.
 */
export function NightChapter() {
  const venue = n.venue ? [n.venue, n.space, n.address].filter(Boolean).join(' — ') : null;

  return (
    <section
      id="celebracao"
      aria-label="Capítulo III — Uma noite para celebrar: encontro no restaurante"
      className="relative scroll-mt-4 overflow-hidden bg-[#0c0b0a] text-paper"
    >
      {/* Continuação do entardecer para a noite */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-ink to-transparent" />
      {/* Brilho âmbar, como luz de velas */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 35%, rgb(196 140 70 / 0.16), transparent 55%), radial-gradient(ellipse at 50% 100%, rgb(168 135 90 / 0.10), transparent 60%)',
        }}
      />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        {LIGHTS.map((l, i) => (
          <span
            key={i}
            className="night-light absolute rounded-full bg-gold-soft"
            style={{ left: `${l.x}%`, top: `${l.y}%`, width: l.s, height: l.s, animationDelay: `${l.d}s` }}
          />
        ))}
      </div>

      <div className="relative mx-auto max-w-md px-6 pt-28 pb-28 text-center">
        <Reveal>
          <ChapterLabel index="III" title="Uma noite para celebrar" className="text-sand/75" />
        </Reveal>

        <Reveal delay={0.15} className="mx-auto mt-8 max-w-[26ch]">
          <p className="font-serif text-[clamp(1.4rem,5.8vw,2rem)] font-light italic leading-snug text-paper/85 text-balance">
            E porque momentos especiais merecem ser celebrados, queremos continuar essa história ao lado de pessoas
            queridas.
          </p>
        </Reveal>

        <Reveal className="mt-14">
          <span aria-hidden="true" className="mx-auto mb-8 block h-10 w-px bg-gold/50" />
          <h2 className="font-serif text-[clamp(1.7rem,7.6vw,2.6rem)] font-light uppercase leading-tight tracking-[0.14em] text-balance">
            Um encontro para celebrar
          </h2>
          <p className="mx-auto mt-6 max-w-[34ch] text-[0.95rem] font-light leading-relaxed text-paper/75">
            {pending ? (
              'À noite, nos reuniremos em um restaurante para brindar ao amor, à vida e ao início dessa nova etapa.'
            ) : (
              <>
                Às {n.time}, nos reuniremos no {n.venue}, no {n.space}, para brindar ao amor, à vida e ao início dessa
                nova etapa.
              </>
            )}
            {pending && (
              <>
                <br />
                <br />O local e o horário serão informados em breve.
              </>
            )}
          </p>
        </Reveal>

        {/* Local e horário aparecem assim que forem definidos em config/invite.ts */}
        {!pending && (
          <Reveal className="mt-10">
            <img
              src={n.logo.src}
              width={n.logo.width}
              height={n.logo.height}
              alt={`${n.venue} — ${n.space}`}
              loading="lazy"
              className="mx-auto mb-10 h-auto w-52 mix-blend-screen"
            />
            <dl className="mx-auto max-w-sm border-y border-paper/10 px-1">
              <Detail label="Local" value={venue} />
              <Detail label="Horário" value={n.time} />
            </dl>
            {n.mapsUrl && (
              <div className="mt-8">
                <MapButton href={n.mapsUrl} label="Ver localização" variant="outline" />
              </div>
            )}
          </Reveal>
        )}

        {/* Aviso sobre o consumo: legível, acolhedor e sem tom de cobrança */}
        <Reveal className="mt-14">
          <aside className="relative mx-auto max-w-sm border border-gold/35 bg-paper/[0.03] px-6 pt-9 pb-7">
            <span className="absolute -top-4 left-1/2 grid size-8 -translate-x-1/2 place-items-center bg-[#0c0b0a] text-gold-soft">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.1" aria-hidden="true">
                <path d="M7 3h4l-.5 6a2.5 2.5 0 0 1-3 0L7 3Z" />
                <path d="M13 3h4l-.5 6a2.5 2.5 0 0 1-3 0L13 3Z" />
                <path d="M9 11v8M15 11v8M7 21h4M13 21h4" />
              </svg>
            </span>
            <p className="eyebrow text-sand/70">Sobre o encontro</p>
            <p className="mt-4 font-serif text-[1.08rem] leading-relaxed text-paper/85">
              Para esse encontro, cada convidado ficará responsável pelo pagamento do seu próprio consumo no
              restaurante. O mais importante para nós será compartilhar essa noite especial com pessoas queridas.
            </p>
          </aside>
        </Reveal>
      </div>
    </section>
  );
}
