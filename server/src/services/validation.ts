import { z } from 'zod';
import { NAME_PATTERN, sanitizeName } from './sanitize.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const nameField = z
  .string()
  .min(3, 'Informe o nome completo.')
  .max(120, 'Use no máximo 120 caracteres.')
  .regex(NAME_PATTERN, 'Use apenas letras, espaços, hífen ou apóstrofo.')
  .refine((v) => (v.match(/\p{L}/gu) ?? []).length >= 3, 'Informe o nome completo.');

export const rsvpSchema = z
  .object({
    fullName: z.string('Informe seu nome completo.').max(300, 'Nome muito longo.').transform(sanitizeName).pipe(nameField),
    /** Segunda pessoa (opcional): vazio vira null. */
    secondName: z
      .string()
      .max(300, 'Nome muito longo.')
      .transform(sanitizeName)
      .pipe(z.union([z.literal('').transform(() => null), nameField]))
      .nullish()
      .transform((v) => v ?? null),
    // Três momentos independentes: o convidado responde sim ou não para cada um.
    civil: z.boolean('Responda sobre o casamento civil.'),
    photos: z.boolean('Responda sobre a sessão de fotos.'),
    dinner: z.boolean('Responda sobre o encontro noturno.'),
    companions: z.number().int().min(0).max(20).default(0),
    requestId: z.string().regex(UUID, 'Requisição inválida.'),
    elapsedMs: z.number().min(0).max(1e9),
    /** Honeypot: campo invisível para pessoas; robôs costumam preenchê-lo. */
    website: z.string().max(500).optional(),
  })
  .strict();

export type RsvpInput = z.infer<typeof rsvpSchema>;

/** Converte erros do zod em mensagens por campo, seguras para o visitante. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? 'form');
    if (!out[key]) out[key] = ['fullName', 'secondName', 'civil', 'photos', 'dinner'].includes(key) ? issue.message : 'Valor inválido.';
  }
  return out;
}
