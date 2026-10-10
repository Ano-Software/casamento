import { env } from './config/env.js';
import { createApp } from './app.js';
import { verifySmtp } from './services/mailer.js';
import { mysqlStore } from './services/storage.js';

const app = createApp();

const server = app.listen(env.port, env.host, () => {
  console.info(`[server] Ouvindo em http://localhost:${env.port}`);
  console.info(`[server] Armazenamento: ${env.storage.driver}${env.storage.driver === 'file' ? ` (${env.storage.dataDir})` : ''}`);
  console.info(
    `[server] Acompanhantes: ${env.rsvp.allowCompanions ? `permitidos (máx. ${env.rsvp.maxCompanions})` : 'desabilitados'}`,
  );

  if (mysqlStore) {
    void mysqlStore
      .ensureTable()
      .then(() => console.info('[db] MySQL conectado; tabela pronta.'))
      .catch((err: Error) => console.error('[db] Não foi possível conectar ao MySQL:', err.message));
  }
  if (env.mailEnabled) {
    void verifySmtp().then((ok) => ok && console.info('[mail] SMTP verificado.'));
  } else {
    console.warn('[mail] SMTP não configurado: as respostas serão apenas armazenadas, sem e-mail.');
  }
  if (env.isProduction && env.storage.driver === 'file') {
    console.warn('[server] Usando armazenamento em arquivo em produção. Garanta disco persistente ou configure o MySQL.');
  }
});

function shutdown(signal: string) {
  console.info(`[server] ${signal} recebido, encerrando...`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
