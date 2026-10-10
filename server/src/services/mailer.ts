import nodemailer, { type Transporter } from 'nodemailer';
import { env } from '../config/env.js';
import { escapeHtml } from './sanitize.js';
import type { RsvpRecord } from './storage.js';

const SUBJECT = 'Confirmação de presença — Casamento Ademilson & Regiane';

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.secure,
      auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.pass } : undefined,
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 15_000,
    });
  }
  return transporter;
}

const formatDate = (d: Date) =>
  new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(d);

function buildContent(r: RsvpRecord) {
  const yesNo = (v: boolean) => (v ? 'Sim, participará' : 'Não participará');
  const attendsAny = r.civil || r.photos || r.dinner;
  const answer = attendsAny ? 'Confirmou presença' : 'Não poderá participar de nenhum momento';
  const rows: [string, string][] = [
    ['Convidado', r.fullName],
    ['Casamento civil', yesNo(r.civil)],
    ['Sessão de fotos', yesNo(r.photos)],
    ['Encontro noturno', yesNo(r.dinner)],
  ];
  if (env.rsvp.allowCompanions && attendsAny) rows.push(['Acompanhantes', String(r.companions)]);
  rows.push(['Enviado em', `${formatDate(r.createdAt)} (horário de Brasília)`]);

  const text = [`${SUBJECT}`, '', ...rows.map(([k, v]) => `${k}: ${v}`)].join('\n');

  const accent = attendsAny ? '#7a6340' : '#7d7368';
  const html = `<!doctype html>
<html lang="pt-BR"><body style="margin:0;padding:0;background:#f5f0e8;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0e8;padding:32px 16px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border:1px solid #e4d9ca;">
<tr><td style="padding:32px 32px 8px;font-family:Georgia,'Times New Roman',serif;color:#11100f;">
<p style="margin:0 0 6px;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#9a8a74;font-family:Arial,sans-serif;">Our Forever</p>
<h1 style="margin:0;font-size:24px;font-weight:normal;">Nova resposta de RSVP</h1>
<p style="margin:12px 0 0;font-size:16px;color:${accent};font-style:italic;">${escapeHtml(answer)}</p>
</td></tr>
<tr><td style="padding:16px 32px 32px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-family:Arial,sans-serif;font-size:14px;color:#11100f;">
${rows
  .map(
    ([k, v]) => `<tr>
<td style="padding:10px 0;border-top:1px solid #efe7db;color:#8b7d6b;width:40%;vertical-align:top;">${escapeHtml(k)}</td>
<td style="padding:10px 0;border-top:1px solid #efe7db;vertical-align:top;">${escapeHtml(v)}</td>
</tr>`,
  )
  .join('\n')}
</table>
</td></tr>
</table>
<p style="font-family:Arial,sans-serif;font-size:11px;color:#9a8a74;margin:16px 0 0;">Ademilson &amp; Regiane · 28.11.2026</p>
</td></tr></table>
</body></html>`;

  return { text, html };
}

export async function sendRsvpEmail(record: RsvpRecord): Promise<void> {
  const { text, html } = buildContent(record);
  // Destinatário, remetente e assunto vêm exclusivamente da configuração:
  // nada digitado pelo visitante entra em cabeçalhos do e-mail.
  await getTransporter().sendMail({
    from: { name: 'Convite Ademilson & Regiane', address: env.mail.sender! },
    to: env.mail.recipients,
    subject: SUBJECT,
    text,
    html,
  });
}

/** Verifica a conexão SMTP na inicialização (apenas registra no log). */
export async function verifySmtp(): Promise<boolean> {
  try {
    await getTransporter().verify();
    return true;
  } catch (err) {
    console.warn('[mail] Não foi possível validar o SMTP:', (err as Error).message);
    return false;
  }
}
