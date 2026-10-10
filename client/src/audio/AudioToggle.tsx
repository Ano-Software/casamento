import { m } from 'motion/react';
import type { AudioStatus } from './useBackgroundAudio';

interface Props {
  status: AudioStatus;
  onToggle: () => void;
}

/** Controle discreto e sempre acessível para pausar/retomar a música. */
export function AudioToggle({ status, onToggle }: Props) {
  if (status === 'disabled' || status === 'error') return null;
  const playing = status === 'playing' || status === 'loading';

  return (
    <m.button
      type="button"
      onClick={onToggle}
      aria-label={playing ? 'Pausar música' : 'Tocar música'}
      aria-pressed={playing}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1.6, duration: 1 }}
      whileTap={{ scale: 0.92 }}
      className="fixed right-4 z-50 grid size-11 place-items-center rounded-full border border-paper/20 bg-ink/45 text-paper backdrop-blur-md transition-colors hover:bg-ink/65"
      style={{ top: 'max(1rem, env(safe-area-inset-top))' }}
    >
      <span className={`flex h-3.5 items-end gap-[3px] ${playing ? 'eq-playing' : ''}`} aria-hidden="true">
        {[0, 0.25, 0.5, 0.15].map((delay, i) => (
          <span
            key={i}
            className="eq-bar block h-full w-[2px] rounded-full bg-paper/90"
            style={{ animationDelay: `${delay}s` }}
          />
        ))}
      </span>
    </m.button>
  );
}
