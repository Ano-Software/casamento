import { AnimatePresence, m } from 'motion/react';
import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent, type Ref } from 'react';
import { ApiError, fetchRsvpConfig, submitRsvp, type RsvpConfig } from '../services/api';
import { uuid } from '../lib/uuid';
import { EASE_CINE } from '../lib/motion';
import { INVITE } from '../config/invite';

interface Props {
  open: boolean;
  onClose: () => void;
}

const NAME_PATTERN = /^[\p{L}\p{M}][\p{L}\p{M}'’. -]*$/u;

const SUCCESS = {
  yes: {
    title: 'Que alegria!',
    text: 'Sua presença foi confirmada. Estamos felizes em compartilhar esse momento com você.',
  },
  no: {
    title: 'Obrigado pelo carinho.',
    text: 'Agradecemos por nos avisar. Você continuará fazendo parte da nossa história.',
  },
};

/** Os três momentos do dia, perguntados de forma independente. */
const QUESTIONS = [
  { key: 'civil', title: 'Casamento civil', hint: `I · ${INVITE.civil.time}` },
  { key: 'photos', title: 'Sessão de fotos', hint: 'II · Em seguida' },
  { key: 'dinner', title: 'Encontro noturno', hint: `III · ${INVITE.dinner.time ?? 'À noite'}` },
] as const;

type MomentKey = (typeof QUESTIONS)[number]['key'];
type Answers = Record<MomentKey, boolean | null>;
const EMPTY_ANSWERS: Answers = { civil: null, photos: null, dinner: null };

type Errors = Partial<Record<'fullName' | 'secondName' | MomentKey | 'companions', string>>;

const cleanName = (name: string) => name.replace(/\s+/g, ' ').trim();

function nameError(name: string): string | undefined {
  const clean = cleanName(name);
  if (clean.length < 3 || (clean.match(/\p{L}/gu) ?? []).length < 3) return 'Informe o nome completo.';
  if (clean.length > 120) return 'Use no máximo 120 caracteres.';
  if (!NAME_PATTERN.test(clean)) return 'Use apenas letras, espaços, hífen ou apóstrofo.';
}

function validate(name: string, second: string, answers: Answers, companions: number, cfg: RsvpConfig): Errors {
  const errors: Errors = {};
  errors.fullName = nameError(name);
  if (cleanName(second)) errors.secondName = nameError(second);
  if (!errors.fullName) delete errors.fullName;
  if (!errors.secondName) delete errors.secondName;
  for (const q of QUESTIONS) if (answers[q.key] === null) errors[q.key] = 'Escolha sim ou não.';
  const attendsAny = QUESTIONS.some((q) => answers[q.key]);
  if (cfg.allowCompanions && attendsAny && (companions < 0 || companions > cfg.maxCompanions)) {
    errors.companions = `O limite é de ${cfg.maxCompanions} acompanhante(s).`;
  }
  return errors;
}

export function RsvpModal({ open, onClose }: Props) {
  const titleId = useId();
  const nameId = useId();
  const secondId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const secondRef = useRef<HTMLInputElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);

  const [config, setConfig] = useState<RsvpConfig>({ allowCompanions: false, maxCompanions: 0 });
  const [fullName, setFullName] = useState('');
  const [secondName, setSecondName] = useState('');
  const [answers, setAnswers] = useState<Answers>(EMPTY_ANSWERS);
  const attendsAny = QUESTIONS.some((q) => answers[q.key]);
  const [companions, setCompanions] = useState(0);
  const [website, setWebsite] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState('');
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState<null | 'yes' | 'no'>(null);

  // Um identificador por preenchimento: reenvios após falha não duplicam o registro.
  const requestId = useRef(uuid());
  const openedAt = useRef(0);

  useEffect(() => {
    if (!open) return;
    returnFocus.current = document.activeElement as HTMLElement | null;
    openedAt.current = Date.now();
    if (done) {
      // Nova resposta (ex.: outra pessoa da família) após um envio concluído.
      setDone(null);
      setFullName('');
      setSecondName('');
      setAnswers(EMPTY_ANSWERS);
      setCompanions(0);
      requestId.current = uuid();
    }
    setErrors({});
    setFormError('');
    const t = window.setTimeout(() => nameRef.current?.focus({ preventScroll: true }), 350);
    let alive = true;
    fetchRsvpConfig()
      .then((cfg) => alive && setConfig(cfg))
      .catch(() => {
        /* sem config: campo de acompanhantes fica oculto; o servidor valida */
      });
    return () => {
      alive = false;
      window.clearTimeout(t);
      returnFocus.current?.focus?.({ preventScroll: true });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const close = () => {
    if (!sending) onClose();
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') return close();
    if (e.key !== 'Tab' || !panelRef.current) return;
    // Mantém o foco dentro da modal.
    const focusables = panelRef.current.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]):not([tabindex="-1"]), a[href]',
    );
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (sending) return;
    const found = validate(fullName, secondName, answers, companions, config);
    setErrors(found);
    setFormError('');
    if (Object.keys(found).length) {
      if (found.fullName) nameRef.current?.focus();
      else if (found.secondName) secondRef.current?.focus();
      return;
    }

    setSending(true);
    try {
      await submitRsvp({
        fullName: cleanName(fullName),
        secondName: cleanName(secondName) || null,
        civil: answers.civil!,
        photos: answers.photos!,
        dinner: answers.dinner!,
        companions: config.allowCompanions && attendsAny ? companions : 0,
        requestId: requestId.current,
        elapsedMs: Date.now() - openedAt.current,
        website,
      });
      setDone(attendsAny ? 'yes' : 'no');
    } catch (err) {
      if (err instanceof ApiError) {
        setFormError(err.message);
        setErrors(err.fields as Errors);
      } else {
        setFormError('Não conseguimos registrar sua resposta agora. Tente novamente em alguns minutos.');
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <m.div
          key="rsvp"
          className="h-screen-d fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.4 } }}
          onKeyDown={onKeyDown}
        >
          <div aria-hidden="true" className="absolute inset-0 bg-ink/75 backdrop-blur-sm" onClick={close} />

          <m.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="max-h-screen-d relative w-full overflow-y-auto overscroll-contain bg-paper text-ink shadow-2xl sm:max-w-md"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ duration: 0.7, ease: EASE_CINE }}
          >
            <button
              type="button"
              onClick={close}
              disabled={sending}
              aria-label="Fechar"
              className="absolute top-3 right-3 grid size-11 place-items-center text-ink/50 transition-colors hover:text-ink disabled:opacity-30"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>

            <div className="px-7 pt-12 pb-9 sm:px-10">
              <AnimatePresence mode="wait" initial={false}>
                {done ? (
                  <m.div
                    key="done"
                    className="py-10 text-center"
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.9, ease: EASE_CINE }}
                    role="status"
                  >
                    <span aria-hidden="true" className="mx-auto block h-12 w-px bg-gold/60" />
                    <h2 id={titleId} className="mt-8 font-serif text-4xl font-light">
                      {SUCCESS[done].title}
                    </h2>
                    <p className="mx-auto mt-5 max-w-[30ch] font-serif text-lg italic leading-relaxed text-ink/75">
                      {SUCCESS[done].text}
                    </p>
                    <p className="mt-8 font-serif text-sm text-taupe">Ademilson &amp; Regiane</p>
                    <button
                      type="button"
                      onClick={close}
                      className="mt-10 min-h-12 border border-ink/30 px-8 py-3.5 text-[0.65rem] uppercase tracking-[0.32em] transition-colors hover:border-ink"
                    >
                      Fechar
                    </button>
                  </m.div>
                ) : (
                  <m.form
                    key="form"
                    noValidate
                    onSubmit={onSubmit}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: 0.3 } }}
                  >
                    <p className="eyebrow text-center text-taupe">Confirmação de presença</p>
                    <h2 id={titleId} className="mt-3 text-center font-serif text-[2rem] font-light leading-tight text-balance">
                      Você vem celebrar com a gente?
                    </h2>

                    {/* Nomes: até duas pessoas por confirmação */}
                    <NameField
                      ref={nameRef}
                      id={nameId}
                      name="fullName"
                      label="1ª pessoa · Nome completo"
                      placeholder="Seu nome completo"
                      autoComplete="name"
                      required
                      value={fullName}
                      error={errors.fullName}
                      onChange={(v) => {
                        setFullName(v);
                        if (errors.fullName) setErrors((x) => ({ ...x, fullName: undefined }));
                      }}
                      className="mt-9"
                    />
                    <NameField
                      ref={secondRef}
                      id={secondId}
                      name="secondName"
                      label="2ª pessoa · Nome completo"
                      optional
                      placeholder="Quem vem com você"
                      autoComplete="off"
                      value={secondName}
                      error={errors.secondName}
                      onChange={(v) => {
                        setSecondName(v);
                        if (errors.secondName) setErrors((x) => ({ ...x, secondName: undefined }));
                      }}
                      className="mt-6"
                    />

                    {/* Três momentos, respondidos de forma independente */}
                    <p className="mt-8 text-[0.65rem] uppercase tracking-[0.24em] text-ink/70">
                      De quais momentos você vai participar?
                    </p>
                    <div className="mt-2">
                      {QUESTIONS.map((q) => (
                        <fieldset key={q.key} className="border-b border-ink/12 py-4">
                          <div className="flex items-center justify-between gap-3">
                            <legend className="float-left">
                              <span className="block text-[0.58rem] uppercase tracking-[0.22em] text-gold">{q.hint}</span>
                              <span className="mt-0.5 block font-serif text-[1.15rem] leading-tight">{q.title}</span>
                            </legend>
                            <div className="flex shrink-0 gap-2">
                              {[
                                { value: true, label: 'Sim' },
                                { value: false, label: 'Não' },
                              ].map((opt) => {
                                const checked = answers[q.key] === opt.value;
                                return (
                                  <label
                                    key={opt.label}
                                    className={`grid h-11 w-[3.6rem] cursor-pointer place-items-center border text-[0.68rem] uppercase tracking-[0.18em] transition-colors duration-300 has-[:focus-visible]:outline has-[:focus-visible]:outline-1 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-gold ${
                                      checked ? 'border-ink bg-ink text-paper' : 'border-ink/20 hover:border-ink/50'
                                    }`}
                                  >
                                    <input
                                      type="radio"
                                      name={q.key}
                                      className="sr-only"
                                      checked={checked}
                                      onChange={() => {
                                        setAnswers((a) => ({ ...a, [q.key]: opt.value }));
                                        setErrors((x) => ({ ...x, [q.key]: undefined }));
                                      }}
                                    />
                                    {opt.label}
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                          {errors[q.key] && <p className="mt-2 clear-both text-xs text-[#9b3b2f]">{errors[q.key]}</p>}
                          {q.key === 'dinner' && (
                            <AnimatePresence initial={false}>
                              {answers.dinner === true && (
                                <m.p
                                  key="dinner-note"
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.45, ease: EASE_CINE }}
                                  className="clear-both overflow-hidden"
                                >
                                  <span className="mt-3 block border-l-2 border-gold/60 bg-gold/[0.07] px-3 py-2.5 font-serif text-[0.98rem] italic leading-snug text-ink/75">
                                    {INVITE.dinner.venue && INVITE.dinner.time
                                      ? `Nos vemos no ${INVITE.dinner.venue} (${INVITE.dinner.space}), às ${INVITE.dinner.time}. Cada convidado fica responsável pelo próprio consumo.`
                                      : 'O restaurante e o horário serão divulgados em breve. Cada convidado fica responsável pelo próprio consumo.'}
                                  </span>
                                </m.p>
                              )}
                            </AnimatePresence>
                          )}
                        </fieldset>
                      ))}
                    </div>

                    {/* Acompanhantes (somente se os noivos permitirem) */}
                    <AnimatePresence initial={false}>
                      {config.allowCompanions && attendsAny && (
                        <m.div
                          key="companions"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.5, ease: EASE_CINE }}
                          className="overflow-hidden"
                        >
                          <div className="mt-8 flex items-center justify-between gap-4">
                            <div>
                              <p className="text-[0.65rem] uppercase tracking-[0.24em] text-ink/70" id="companions-label">
                                Acompanhantes
                              </p>
                              <p className="mt-1 text-xs text-taupe">Até {config.maxCompanions}</p>
                            </div>
                            <div className="flex items-center" role="group" aria-labelledby="companions-label">
                              <StepButton
                                label="Diminuir acompanhantes"
                                disabled={companions <= 0}
                                onClick={() => setCompanions((n) => Math.max(0, n - 1))}
                              >
                                −
                              </StepButton>
                              <output aria-live="polite" className="w-12 text-center font-serif text-2xl tabular-nums">
                                {companions}
                              </output>
                              <StepButton
                                label="Aumentar acompanhantes"
                                disabled={companions >= config.maxCompanions}
                                onClick={() => setCompanions((n) => Math.min(config.maxCompanions, n + 1))}
                              >
                                +
                              </StepButton>
                            </div>
                          </div>
                          {errors.companions && <p className="mt-2 text-xs text-[#9b3b2f]">{errors.companions}</p>}
                        </m.div>
                      )}
                    </AnimatePresence>

                    {/* Honeypot — invisível para pessoas */}
                    <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
                      <label>
                        Site
                        <input
                          type="text"
                          name="website"
                          tabIndex={-1}
                          autoComplete="off"
                          value={website}
                          onChange={(e) => setWebsite(e.target.value)}
                        />
                      </label>
                    </div>

                    {formError && (
                      <p role="alert" className="mt-8 border-l-2 border-[#9b3b2f] bg-[#9b3b2f]/5 px-4 py-3 text-sm leading-relaxed text-[#7d2f25]">
                        {formError}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={sending}
                      aria-busy={sending}
                      className="mt-9 flex min-h-13 w-full items-center justify-center gap-3 bg-ink px-6 py-4 text-[0.68rem] uppercase tracking-[0.32em] text-paper transition-[background-color,transform,opacity] duration-300 hover:bg-ink-soft active:scale-[0.98] disabled:cursor-wait disabled:opacity-70"
                    >
                      {sending && (
                        <span aria-hidden="true" className="size-3.5 animate-spin rounded-full border border-paper/30 border-t-paper" />
                      )}
                      {sending ? 'Enviando…' : 'Enviar confirmação'}
                    </button>
                  </m.form>
                )}
              </AnimatePresence>
            </div>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  );
}

interface NameFieldProps {
  ref: Ref<HTMLInputElement>;
  id: string;
  name: string;
  label: string;
  placeholder: string;
  autoComplete: string;
  value: string;
  error?: string;
  required?: boolean;
  optional?: boolean;
  className?: string;
  onChange: (value: string) => void;
}

function NameField({ ref, id, name, label, placeholder, autoComplete, value, error, required, optional, className, onChange }: NameFieldProps) {
  return (
    <div className={className}>
      <label htmlFor={id} className="text-[0.65rem] uppercase tracking-[0.24em] text-ink/70">
        {label}
        {optional && <span className="normal-case tracking-normal text-ink/45"> (opcional)</span>}
      </label>
      <input
        ref={ref}
        id={id}
        name={name}
        type="text"
        autoComplete={autoComplete}
        autoCapitalize="words"
        enterKeyHint="next"
        maxLength={120}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-err` : undefined}
        className="mt-2 block w-full border-0 border-b border-ink/25 bg-transparent px-0 py-3 font-serif text-xl text-ink placeholder:text-ink/30 focus:border-ink focus:outline-none aria-[invalid=true]:border-[#9b3b2f]"
        placeholder={placeholder}
      />
      {error && (
        <p id={`${id}-err`} className="mt-2 text-xs text-[#9b3b2f]">
          {error}
        </p>
      )}
    </div>
  );
}

function StepButton(props: { label: string; disabled: boolean; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      aria-label={props.label}
      disabled={props.disabled}
      onClick={props.onClick}
      className="grid size-11 place-items-center border border-ink/25 font-serif text-xl transition-colors hover:border-ink disabled:opacity-30"
    >
      {props.children}
    </button>
  );
}
