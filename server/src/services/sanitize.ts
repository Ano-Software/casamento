/**
 * Caracteres de controle (Cc), de formatação/largura zero/bidirecionais (Cf)
 * e separadores de linha/parágrafo Unicode (Zl, Zp). Removê-los impede
 * quebras de linha em e-mails, texto invisível e inversões de leitura.
 */
const INVISIBLE = /[\p{Cc}\p{Cf}\p{Zl}\p{Zp}]/gu;

/** Normaliza um nome digitado: NFC, sem invisíveis e com espaços simples. */
export function sanitizeName(input: string): string {
  return input.normalize('NFC').replace(INVISIBLE, '').replace(/\s+/g, ' ').trim();
}

/** Letras (inclusive acentuadas), espaço, apóstrofo, ponto e hífen. */
export const NAME_PATTERN = /^[\p{L}\p{M}][\p{L}\p{M}'’. -]*$/u;

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/** Escapa texto para inserção segura em HTML (corpo do e-mail). */
export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (ch) => HTML_ESCAPES[ch]);
}
