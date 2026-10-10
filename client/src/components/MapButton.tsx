interface Props {
  href: string;
  label: string;
  /** `solid`: fundo escuro (para cenas claras) · `outline`: contorno claro (para cenas escuras). */
  variant?: 'solid' | 'outline';
}

/** Botão que abre o Google Maps em nova aba. */
export function MapButton({ href, label, variant = 'solid' }: Props) {
  const style =
    variant === 'solid'
      ? 'bg-ink text-paper hover:bg-ink-soft'
      : 'border border-paper/35 text-paper hover:border-gold-soft hover:bg-paper/5';
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`group inline-flex min-h-12 items-center gap-3 px-9 py-4 text-[0.68rem] uppercase tracking-[0.34em] transition-[background-color,border-color,transform] duration-500 active:scale-[0.97] ${style}`}
    >
      {label}
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
  );
}
