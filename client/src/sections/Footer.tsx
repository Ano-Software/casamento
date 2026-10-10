import { useState } from 'react';
import { m } from 'motion/react';
import { AUDIO, spotifyEmbedUrl } from '../audio/config';
import { Reveal } from '../components/Reveal';

const spotify = spotifyEmbedUrl();

/** Créditos finais. */
export function Footer() {
  const [showPlayer, setShowPlayer] = useState(false);

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

      {spotify && (
        <div className="mx-auto mt-12 max-w-sm">
          {showPlayer ? (
            <m.iframe
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              title="Nossa música no Spotify"
              src={spotify}
              width="100%"
              height="80"
              loading="lazy"
              allow="encrypted-media"
              className="rounded-xl border-0"
            />
          ) : (
            <button
              type="button"
              onClick={() => setShowPlayer(true)}
              className="min-h-11 border border-paper/20 px-6 py-3 text-[0.62rem] uppercase tracking-[0.3em] text-paper/70 transition-colors hover:border-paper/50"
            >
              Ouvir nossa música
            </button>
          )}
        </div>
      )}

      {AUDIO.src && AUDIO.title && (
        <p className="mt-12 text-[0.6rem] uppercase tracking-[0.28em] text-paper/30">Trilha · {AUDIO.title}</p>
      )}
    </footer>
  );
}
