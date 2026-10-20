import { useEffect, useRef, useState } from 'react';
import { REALIDADE } from '../config/realidade';
import { ArError, prepareVideos, startAr, type ArErrorCode, type ArHandle } from '../lib/arEngine';

type Phase = 'intro' | 'loading' | 'scanning' | 'tracking' | 'error';

const ERRORS: Record<ArErrorCode, string> = {
  insecure: 'A câmera só funciona em endereço seguro (https://). Abra o link oficial do convite.',
  unsupported: 'Este navegador não permite usar a câmera. Tente pelo Chrome (Android) ou Safari (iPhone).',
  denied: 'Precisamos da sua permissão para usar a câmera. Libere o acesso nas configurações do navegador e tente de novo.',
  nocamera: 'Não encontramos uma câmera neste aparelho.',
  missing: 'A surpresa ainda está sendo preparada. Volte um pouquinho mais perto do grande dia!',
  failed: 'Algo não saiu como esperado. Tente de novo — de preferência com boa iluminação.',
};

/** /realidade — aponte a câmera para o desenho impresso e veja os noivos ganharem vida. */
export default function Realidade() {
  const stageRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<ArHandle | null>(null);
  const runRef = useRef(0);
  const [phase, setPhase] = useState<Phase>('intro');
  const [error, setError] = useState<ArErrorCode>('failed');
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    document.title = 'Nossa história em movimento — Ademilson & Regiane';
    return () => handleRef.current?.stop();
  }, []);

  const start = async () => {
    const run = ++runRef.current;
    // Síncrono dentro do toque: libera o som dos vídeos no celular.
    const videos = prepareVideos(REALIDADE.videos);
    setMuted(false);
    setPhase('loading');
    try {
      const handle = await startAr({
        container: stageRef.current!,
        targetSrc: REALIDADE.target,
        videos,
        config: REALIDADE.videos,
        onTracking: (on) => setPhase(on ? 'tracking' : 'scanning'),
        onAutoMuted: () => setMuted(true),
      });
      if (run !== runRef.current) return handle.stop(); // fechou enquanto carregava
      handleRef.current = handle;
      setPhase('scanning');
    } catch (err) {
      if (run !== runRef.current) return;
      setError(err instanceof ArError ? err.code : 'failed');
      setPhase('error');
    }
  };

  const close = () => {
    runRef.current++;
    handleRef.current?.stop();
    handleRef.current = null;
    setPhase('intro');
  };

  const toggleSound = () => {
    handleRef.current?.setMuted(!muted);
    setMuted(!muted);
  };

  const running = phase === 'loading' || phase === 'scanning' || phase === 'tracking';

  return (
    <main className="h-screen-d relative overflow-hidden bg-ink text-paper">
      {/* Palco da câmera: o motor de AR insere aqui o vídeo da câmera e a cena 3D. */}
      <div ref={stageRef} className="absolute inset-0 overflow-hidden" hidden={!running} />

      {running && (
        <>
          <div
            className="absolute inset-x-0 top-0 flex items-center justify-between px-4"
            style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}
          >
            <button
              type="button"
              onClick={close}
              aria-label="Fechar câmera"
              className="grid size-11 place-items-center rounded-full bg-ink/55 text-xl backdrop-blur-sm"
            >
              ×
            </button>
            {phase !== 'loading' && (
              <button
                type="button"
                onClick={toggleSound}
                className="rounded-full bg-ink/55 px-4 py-2.5 text-[0.7rem] uppercase tracking-[0.2em] backdrop-blur-sm"
              >
                {muted ? 'Ativar som' : 'Som ligado'}
              </button>
            )}
          </div>

          {phase !== 'tracking' && (
            <div className="pointer-events-none absolute inset-0 grid place-items-center px-8">
              <div className="flex flex-col items-center">
                {phase === 'scanning' && (
                  <div className="relative size-[min(68vw,18rem)] animate-pulse">
                    {['top-0 left-0 border-t border-l', 'top-0 right-0 border-t border-r', 'bottom-0 left-0 border-b border-l', 'bottom-0 right-0 border-b border-r'].map(
                      (c) => (
                        <span key={c} className={`absolute size-10 border-gold-soft ${c}`} />
                      ),
                    )}
                  </div>
                )}
                <p className="mt-8 rounded-full bg-ink/60 px-5 py-2.5 text-center text-[0.85rem] font-light backdrop-blur-sm">
                  {phase === 'loading' ? 'Preparando a câmera…' : 'Aponte a câmera para o desenho'}
                </p>
              </div>
            </div>
          )}
        </>
      )}

      {!running && (
        <div
          className="mx-auto flex h-full w-full max-w-xl flex-col items-center justify-center px-6 text-center"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <p className="eyebrow text-gold-soft">A &amp; R · 28 · 11 · 2026</p>

          {phase === 'error' ? (
            <>
              <h1 className="mt-6 font-serif text-[clamp(2rem,8vw,2.8rem)] font-light leading-[1.1]">Ops…</h1>
              <p className="mx-auto mt-5 max-w-[34ch] text-[0.95rem] font-light leading-relaxed text-paper/75">
                {ERRORS[error]}
              </p>
              {error !== 'missing' && error !== 'insecure' && (
                <button
                  type="button"
                  onClick={start}
                  className="mt-10 bg-paper px-8 py-4 text-[0.7rem] uppercase tracking-[0.28em] text-ink"
                >
                  Tentar de novo
                </button>
              )}
              <a href="/" className="mt-6 text-[0.75rem] uppercase tracking-[0.2em] text-paper/60 underline-offset-4 hover:underline">
                Voltar ao convite
              </a>
            </>
          ) : (
            <>
              <h1 className="mt-6 font-serif text-[clamp(2.3rem,9vw,3.4rem)] font-light leading-[1.05]">
                Nossa história, <span className="block italic text-sand">em movimento.</span>
              </h1>
              <p className="mx-auto mt-6 max-w-[36ch] text-[0.95rem] font-light leading-relaxed text-paper/70">
                Aponte a câmera do celular para o desenho impresso e veja a gente ganhar vida. Aumente o volume!
              </p>
              <button
                type="button"
                onClick={start}
                className="mt-10 bg-paper px-8 py-4 text-[0.7rem] uppercase tracking-[0.28em] text-ink shadow-[0_12px_40px_rgb(0_0_0/0.35)]"
              >
                Abrir câmera
              </button>
              <p className="mt-6 max-w-[34ch] text-[0.75rem] font-light leading-relaxed text-paper/45">
                Permita o acesso à câmera quando o celular pedir. Funciona melhor em lugar bem iluminado.
              </p>
            </>
          )}
        </div>
      )}
    </main>
  );
}
