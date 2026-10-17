import { useEffect, useId, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { uuid } from '../lib/uuid';
import {
  MAX_PHOTO_MB,
  MAX_PHOTOS_PER_BATCH,
  PhotoApiError,
  makeThumbnail,
  uploadPhoto,
} from '../services/photos';

type Status = 'pending' | 'uploading' | 'done' | 'error';

interface Item {
  id: string;
  file: File;
  preview: string;
  status: Status;
  progress: number;
  error?: string;
}

/** Envios simultâneos: rápido sem saturar a internet do celular. */
const CONCURRENCY = 2;

const isImage = (f: File) => f.type.startsWith('image/') || /\.(heic|heif|jpe?g|png|webp|gif|avif)$/i.test(f.name);

/** /momentos — os convidados enviam as fotos que tiraram dos noivos. */
export default function Momentos() {
  const nameId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState('');
  const [items, setItems] = useState<Item[]>([]);
  const [notice, setNotice] = useState('');
  const [sending, setSending] = useState(false);
  const [finished, setFinished] = useState(0);

  useEffect(() => {
    document.title = 'Compartilhe seus momentos — Ademilson & Regiane';
  }, []);

  // Libera as prévias da memória ao sair da página.
  const itemsRef = useRef(items);
  itemsRef.current = items;
  useEffect(() => () => itemsRef.current.forEach((i) => URL.revokeObjectURL(i.preview)), []);

  const update = (id: string, patch: Partial<Item>) =>
    setItems((list) => list.map((i) => (i.id === id ? { ...i, ...patch } : i)));

  const onPick = (e: ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    e.target.value = '';
    setFinished(0);

    const images = picked.filter(isImage);
    const fitting = images.filter((f) => f.size <= MAX_PHOTO_MB * 1024 * 1024);
    const room = MAX_PHOTOS_PER_BATCH - items.length;
    const accepted = fitting.slice(0, Math.max(0, room));

    const notes: string[] = [];
    if (images.length < picked.length) notes.push('Alguns arquivos não são fotos e foram ignorados.');
    if (fitting.length < images.length) notes.push(`Fotos acima de ${MAX_PHOTO_MB} MB foram ignoradas.`);
    if (accepted.length < fitting.length) notes.push(`Você pode enviar até ${MAX_PHOTOS_PER_BATCH} fotos de cada vez.`);
    setNotice(notes.join(' '));

    setItems((list) => [
      ...list,
      ...accepted.map((file) => ({
        id: uuid(),
        file,
        preview: URL.createObjectURL(file),
        status: 'pending' as Status,
        progress: 0,
      })),
    ]);
  };

  const remove = (id: string) =>
    setItems((list) => {
      const item = list.find((i) => i.id === id);
      if (item) URL.revokeObjectURL(item.preview);
      return list.filter((i) => i.id !== id);
    });

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (sending) return;
    const queue = items.filter((i) => i.status !== 'done');
    if (!queue.length) return inputRef.current?.click();

    setSending(true);
    setNotice('');
    const sender = name.replace(/\s+/g, ' ').trim();
    let ok = 0;

    const worker = async () => {
      for (let item = queue.shift(); item; item = queue.shift()) {
        update(item.id, { status: 'uploading', progress: 0, error: undefined });
        try {
          const thumb = await makeThumbnail(item.file);
          const id = item.id;
          await uploadPhoto(item.file, thumb, sender, (progress) => update(id, { progress }));
          update(item.id, { status: 'done', progress: 1 });
          ok++;
        } catch (err) {
          const message = err instanceof PhotoApiError ? err.message : 'Não conseguimos enviar esta foto.';
          update(item.id, { status: 'error', error: message });
        }
      }
    };
    await Promise.all(Array.from({ length: CONCURRENCY }, worker));

    setSending(false);
    setItems((list) => {
      const failed = list.filter((i) => i.status !== 'done');
      list.filter((i) => i.status === 'done').forEach((i) => URL.revokeObjectURL(i.preview));
      if (failed.length) setNotice('Algumas fotos não foram enviadas. Toque em “Tentar de novo”.');
      return failed;
    });
    setFinished((n) => n + ok);
  };

  const pending = items.filter((i) => i.status !== 'done').length;
  const hasErrors = items.some((i) => i.status === 'error');

  return (
    <main
      className="min-h-screen-s bg-ink px-6 text-paper"
      style={{ paddingBottom: 'max(4rem, calc(env(safe-area-inset-bottom) + 3rem))' }}
    >
      <div className="mx-auto w-full max-w-xl pt-16 text-center sm:pt-24">
        <p className="eyebrow text-gold-soft">A &amp; R · 28 · 11 · 2026</p>
        <h1 className="mt-6 font-serif text-[clamp(2.3rem,9vw,3.4rem)] font-light leading-[1.05]">
          Nossos momentos, <span className="block italic text-sand">pelo seu olhar.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-[38ch] text-[0.95rem] font-light leading-relaxed text-paper/70">
          Tirou alguma foto da gente? Envie aqui — até {MAX_PHOTOS_PER_BATCH} de cada vez, quantas vezes quiser. Cada
          clique vai fazer parte da nossa história.
        </p>
      </div>

      <form noValidate onSubmit={onSubmit} className="mx-auto mt-12 w-full max-w-xl">
        {/* Campo do nome em destaque: cartão claro com letras escuras */}
        <div className="bg-paper px-5 pt-5 pb-3 text-ink shadow-[0_12px_40px_rgb(0_0_0/0.35)]">
          <label htmlFor={nameId} className="text-[0.65rem] uppercase tracking-[0.24em] text-ink/70">
            Seu nome <span className="normal-case tracking-normal text-ink/45">(opcional)</span>
          </label>
          <input
            id={nameId}
            type="text"
            autoComplete="name"
            autoCapitalize="words"
            maxLength={60}
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={sending}
            placeholder="Para sabermos quem registrou"
            className="mt-2 block w-full border-0 border-b border-ink/25 bg-transparent px-0 py-3 font-serif text-xl text-ink placeholder:text-ink/35 focus:border-ink focus:outline-none disabled:opacity-60"
          />
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*,.heic,.heif"
          multiple
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={onPick}
        />

        {items.length > 0 && (
          <>
            <div className="mt-10 flex items-baseline justify-between">
              <p className="text-[0.65rem] uppercase tracking-[0.24em] text-paper/60">Fotos selecionadas</p>
              <p className="text-xs tabular-nums text-paper/45">
                {items.length} de {MAX_PHOTOS_PER_BATCH}
              </p>
            </div>
            <ul className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
              {items.map((item) => (
                <PreviewTile key={item.id} item={item} disabled={sending} onRemove={() => remove(item.id)} />
              ))}
            </ul>
          </>
        )}

        {items.length < MAX_PHOTOS_PER_BATCH && !sending && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="mt-8 flex min-h-36 w-full flex-col items-center justify-center gap-3 border border-dashed border-sand/30 px-6 py-8 text-sand transition-colors hover:border-sand/60 hover:bg-paper/[0.03]"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true">
              <rect x="3" y="5" width="18" height="15" rx="1.5" />
              <circle cx="12" cy="12.5" r="3.5" />
              <path d="M8.5 5 10 3h4l1.5 2" />
            </svg>
            <span className="text-[0.68rem] uppercase tracking-[0.3em]">
              {items.length ? 'Adicionar mais fotos' : 'Escolher fotos'}
            </span>
            <span className="text-xs text-paper/40">
              {items.length
                ? `Ainda cabem ${MAX_PHOTOS_PER_BATCH - items.length}`
                : `Até ${MAX_PHOTOS_PER_BATCH} fotos de uma vez`}
            </span>
          </button>
        )}

        {notice && (
          <p role="alert" className="mt-6 border-l-2 border-gold/60 bg-gold/[0.08] px-4 py-3 text-sm leading-relaxed text-sand">
            {notice}
          </p>
        )}

        {finished > 0 && !items.length && (
          <div role="status" className="mt-10 text-center">
            <span aria-hidden="true" className="mx-auto block h-10 w-px bg-gold/60" />
            <p className="mt-6 font-serif text-3xl font-light">Obrigado!</p>
            <p className="mx-auto mt-3 max-w-[32ch] font-serif text-lg italic leading-relaxed text-paper/70">
              {finished === 1 ? 'Sua foto chegou até nós.' : `Suas ${finished} fotos chegaram até nós.`} Vamos guardar
              cada uma com carinho.
            </p>
          </div>
        )}

        {pending > 0 && (
          <button
            type="submit"
            disabled={sending}
            aria-busy={sending}
            className="mt-8 flex min-h-13 w-full items-center justify-center gap-3 bg-paper px-6 py-4 text-[0.68rem] uppercase tracking-[0.32em] text-ink transition-[background-color,transform,opacity] duration-300 hover:bg-sand active:scale-[0.98] disabled:cursor-wait disabled:opacity-70"
          >
            {sending && (
              <span aria-hidden="true" className="size-3.5 animate-spin rounded-full border border-ink/30 border-t-ink" />
            )}
            {sending
              ? 'Enviando…'
              : hasErrors
                ? 'Tentar de novo'
                : `Enviar ${pending} ${pending === 1 ? 'foto' : 'fotos'}`}
          </button>
        )}

        {sending && (
          <p className="mt-4 text-center text-xs text-paper/45">Mantenha esta página aberta até terminar.</p>
        )}
      </form>
    </main>
  );
}

function PreviewTile({ item, disabled, onRemove }: { item: Item; disabled: boolean; onRemove: () => void }) {
  const [broken, setBroken] = useState(false);

  return (
    <li className="photo-fallback relative aspect-square overflow-hidden">
      {broken ? (
        // Formatos que o navegador não exibe (ex.: HEIC no Android/Windows) ainda são enviados.
        <div className="grid h-full place-items-center p-2 text-center text-[0.65rem] break-all text-paper/50">
          {item.file.name}
        </div>
      ) : (
        <img src={item.preview} alt="" className="h-full w-full object-cover" onError={() => setBroken(true)} />
      )}

      {item.status === 'uploading' && (
        <div className="absolute inset-0 flex items-end bg-ink/45">
          <div className="h-1 w-full bg-paper/20">
            <div className="h-full bg-gold-soft transition-[width] duration-200" style={{ width: `${item.progress * 100}%` }} />
          </div>
        </div>
      )}
      {item.status === 'done' && (
        <div className="absolute inset-0 grid place-items-center bg-ink/50" aria-label="Enviada">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="text-paper" aria-hidden="true">
            <path d="m5 12.5 4.5 4.5L19 7.5" />
          </svg>
        </div>
      )}
      {item.status === 'error' && (
        <div className="absolute inset-x-0 bottom-0 bg-[#7d2f25]/90 px-1.5 py-1 text-[0.6rem] leading-tight text-paper" title={item.error}>
          {item.error}
        </div>
      )}

      {!disabled && item.status !== 'done' && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remover ${item.file.name}`}
          className="absolute top-1 right-1 grid size-8 place-items-center rounded-full bg-ink/70 text-paper/80 transition-colors hover:text-paper"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      )}
    </li>
  );
}
