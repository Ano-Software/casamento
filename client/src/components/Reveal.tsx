import { m } from 'motion/react';
import type { ReactNode } from 'react';
import { EASE_CINE } from '../lib/motion';

interface Props {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  duration?: number;
  /** Fração do elemento visível para disparar a entrada. */
  amount?: number;
}

/** Entrada suave (opacidade + leve subida) quando o elemento entra na tela. */
export function Reveal({ children, className, delay = 0, y = 22, duration = 1.1, amount = 0.4 }: Props) {
  return (
    <m.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount }}
      transition={{ duration, delay, ease: EASE_CINE }}
    >
      {children}
    </m.div>
  );
}
