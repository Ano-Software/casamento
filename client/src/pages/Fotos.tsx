import { useCallback, useEffect, useId, useState, type FormEvent } from 'react';
import { listPhotos, login, logout, PhotoApiError, type GuestPhoto } from '../services/photos';

type State = { kind: 'loading' } | { kind: 'login' } | { kind: 'ready'; photos: GuestPhoto[] } | { kind: 'error'; message: string };

const dateFmt = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'America/Sao_Paulo',
});

/** /fotos — galeria privada dos noivos com as fotos enviadas pelos convidados. */
export default function Fotos() {
  const [state, setState] = useState<State>({ kind: 'loading' });

  const load = useCallback(async () => {
    setState((s) => (s.kind === 'ready' ? s : { kind: 'loading' }));
    try {
      setState({ kind: 'ready', photos: await listPhotos() });
    } catch (err) {
      if (err instanceof PhotoApiError && err.status === 401) setState({ kind: 'login' });
      else setState({ kind: 'error', message: (err as Error).message });
    }
  }, []);

  useEffect(() => {
    document.title = 'Fotos dos convidados — Ademilson & Regiane';
    const robots = document.createElement('meta');
    robots.name = 'robots';
    robots.content = 'noindex, nofollow';
    document.head.append(robots);
    void load();
    return () => robots.remove();
  }, [load]);

  return (
    <main
      className="min-h-screen-s bg-ink px-4 text-paper sm:px-8"
      style={{ paddingBottom: 'max(4rem, calc(env(safe-area-inset-bottom) + 3rem))' }}
    >
      {state.kind === 'login' && <LoginForm onDone={load} />}

      {state.kind === 'loading' && (
        <div className="grid min-h-[60vh] place-items-center">
          <span aria-label="Carregando" className="size-6 animate-spin rounded-full border border-paper/20 border-t-paper/70" />
        </div>
      )}

      {state.kind === 'error' && (
        <div className="mx-auto max-w-md pt-32 text-center">
          <p className="font-serif text-xl text-paper/80">{state.message}</p>
          <button
            type="button"
            onClick={load}
            className="mt-8 min-h-12 border border-paper/30 px-8 py-3.5 text-[0.65rem] uppercase tracking-[0.32em] transition-colors hover:border-paper"
          >
            Tentar de novo
          </button>
        </div>
      )}

      {state.kind === 'ready' && (
        <Gallery
          photos={state.photos}
          onRefresh={load}
          onLogout={async () => {
            await logout();
            setState({ kind: 'login' });
          }}
        />
      )}
    </main>
  );
}

function LoginForm({ onDone }: { onDone: () => void }) {
  const id = useId();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy || !password) return;
    setBusy(true);
    setError('');
    try {
      await login(password);
      onDone();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="mx-auto w-full max-w-sm pt-28 text-center sm:pt-36">
      <p className="eyebrow text-gold-soft">A &amp; R · Área dos noivos</p>
      <h1 className="mt-5 font-serif text-4xl font-light">Fotos dos convidados</h1>
      <label htmlFor={id} className="mt-10 block text-left text-[0.65rem] uppercase tracking-[0.24em] text-paper/60">
        Senha
      </label>
      <input
        id={id}
        type="password"
        autoComplete="current-password"
        autoFocus
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="mt-2 block w-full border-0 border-b border-paper/20 bg-transparent px-0 py-3 font-serif text-xl text-paper focus:border-paper/70 focus:outline-none"
      />
      {error && (
        <p role="alert" className="mt-3 text-left text-sm text-[#e0a093]">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={busy || !password}
        className="mt-8 min-h-13 w-full bg-paper px-6 py-4 text-[0.68rem] uppercase tracking-[0.32em] text-ink transition-colors hover:bg-sand disabled:opacity-60"
      >
        {busy ? 'Entrando…' : 'Entrar'}
      </button>
    </form>
  );
}

function Gallery({
  photos,
  onRefresh,
  onLogout,
}: {
  photos: GuestPhoto[];
  onRefresh: () => void;
  onLogout: () => void;
}) {
  return (
    <div className="mx-auto w-full max-w-6xl">
      <header className="flex flex-wrap items-end justify-between gap-4 pt-12 pb-8 sm:pt-16">
        <div>
          <p className="eyebrow text-gold-soft">A &amp; R · 28 · 11 · 2026</p>
          <h1 className="mt-3 font-serif text-[clamp(2rem,6vw,3rem)] font-light leading-tight">Fotos dos convidados</h1>
          <p className="mt-1 text-sm text-paper/50">
            {photos.length === 0 ? 'Nenhuma foto ainda' : `${photos.length} ${photos.length === 1 ? 'foto' : 'fotos'}`}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onRefresh}
            className="min-h-11 border border-paper/25 px-5 text-[0.62rem] uppercase tracking-[0.28em] transition-colors hover:border-paper/70"
          >
            Atualizar
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="min-h-11 px-4 text-[0.62rem] uppercase tracking-[0.28em] text-paper/50 transition-colors hover:text-paper"
          >
            Sair
          </button>
        </div>
      </header>

      {photos.length === 0 ? (
        <p className="py-24 text-center font-serif text-lg italic text-paper/50">
          Quando os convidados enviarem fotos em /momentos, elas aparecem aqui.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4">
          {photos.map((p) => (
            <PhotoCard key={p.file} photo={p} />
          ))}
        </ul>
      )}
    </div>
  );
}

function PhotoCard({ photo }: { photo: GuestPhoto }) {
  const [src, setSrc] = useState(photo.thumbUrl ?? photo.url);
  const [broken, setBroken] = useState(false);
  const mb = (photo.size / 1024 / 1024).toFixed(1);

  return (
    <li className="group flex flex-col bg-ink-soft">
      <a
        href={photo.url}
        target="_blank"
        rel="noopener"
        className="photo-fallback relative block aspect-[4/5] overflow-hidden"
        aria-label="Abrir foto em tamanho original"
      >
        {broken ? (
          <span className="grid h-full place-items-center p-3 text-center text-xs break-all text-paper/45">
            Pré-visualização indisponível
            <br />
            {photo.file.split('.').pop()?.toUpperCase()}
          </span>
        ) : (
          <img
            src={src}
            alt={photo.sender ? `Foto enviada por ${photo.sender}` : 'Foto enviada por um convidado'}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
            onError={() => (src !== photo.url ? setSrc(photo.url) : setBroken(true))}
          />
        )}
      </a>
      <div className="flex items-center justify-between gap-2 px-3 py-2.5">
        <div className="min-w-0">
          <p className="truncate font-serif text-[0.95rem] leading-tight text-paper/85">{photo.sender ?? 'Convidado'}</p>
          <p className="mt-0.5 text-[0.65rem] tabular-nums text-paper/40">
            {dateFmt.format(new Date(photo.createdAt))} · {mb} MB
          </p>
        </div>
        <a
          href={photo.downloadUrl}
          download={photo.file}
          aria-label={`Baixar ${photo.file}`}
          title="Baixar foto original"
          className="grid size-10 shrink-0 place-items-center border border-paper/20 text-paper/80 transition-colors hover:border-gold-soft hover:text-gold-soft"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
            <path d="M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M5 19.5h14" />
          </svg>
        </a>
      </div>
    </li>
  );
}
