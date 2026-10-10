import { AUDIO, spotifyTrackId } from '../audio/config';
import { Reveal } from '../components/Reveal';

const hasSoundtrack = Boolean(AUDIO.src || spotifyTrackId());

/** Créditos finais. */
export function Footer() {
  return (
    <footer
      className="bg-ink px-6 pt-24 text-center"
      style={{ paddingBottom: 'max(3.5rem, calc(env(safe-area-inset-bottom) + 2rem))' }}
    >
      <Reveal>
        <p className="font-serif text-5xl font-light text-paper">
          A <span className="italic text-gold-soft">&amp;</span> R
        </p>
        <p className="mt-5 text-[0.65rem] uppercase tracking-[0.5em] text-sand/70">28 · 11 · 2026</p>
        <p className="mt-10 font-serif text-lg italic text-paper/60">Our forever.</p>
      </Reveal>

      {hasSoundtrack && (
        <p className="mt-12 text-[0.6rem] uppercase tracking-[0.28em] text-paper/30">Trilha · {AUDIO.title}</p>
      )}
    </footer>
  );
}
