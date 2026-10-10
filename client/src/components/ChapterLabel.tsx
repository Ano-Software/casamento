interface Props {
  index: string;
  title: string;
  className?: string;
}

/** Rótulo editorial de capítulo — o fio narrativo do "filme". */
export function ChapterLabel({ index, title, className = '' }: Props) {
  return (
    <p className={`eyebrow flex items-center justify-center gap-3 ${className}`}>
      <span className="font-serif text-[0.85rem] tracking-[0.12em] opacity-80">{index}</span>
      <span aria-hidden="true" className="h-px w-6 bg-current opacity-40" />
      <span>{title}</span>
    </p>
  );
}
