import { mkdir, readFile, appendFile } from 'node:fs/promises';
import path from 'node:path';
import mysql, { type Pool, type ResultSetHeader } from 'mysql2/promise';
import { env } from '../config/env.js';

export interface RsvpRecord {
  requestId: string;
  fullName: string;
  /** Segunda pessoa da mesma confirmação (opcional). */
  secondName: string | null;
  /** Participação em cada um dos três momentos. */
  civil: boolean;
  photos: boolean;
  dinner: boolean;
  companions: number;
  createdAt: Date;
}

export interface SaveResult {
  /** true quando o mesmo requestId já havia sido registrado. */
  duplicate: boolean;
}

interface RsvpStore {
  readonly name: string;
  save(record: RsvpRecord): Promise<SaveResult>;
}

type MysqlConfig = typeof env.storage.mysql;

/** Grava no MySQL (banco de dados da Hostinger) com consultas parametrizadas. */
class MysqlStore implements RsvpStore {
  readonly name = 'mysql';
  private pool: Pool | null = null;
  private ready: Promise<void> | null = null;

  constructor(private readonly cfg: MysqlConfig) {}

  private getPool(): Pool {
    if (!this.pool) {
      this.pool = mysql.createPool({
        host: this.cfg.host,
        port: this.cfg.port,
        user: this.cfg.user,
        password: this.cfg.password,
        database: this.cfg.database,
        ssl: this.cfg.ssl ? {} : undefined,
        connectionLimit: 5,
        connectTimeout: 10_000,
        timezone: 'Z', // datas gravadas em UTC
        charset: 'utf8mb4',
      });
    }
    return this.pool;
  }

  /** Cria a tabela na primeira utilização (mesma estrutura de database/schema.sql). */
  ensureTable(): Promise<void> {
    if (!this.ready) {
      this.ready = this.getPool()
        .query(
          `CREATE TABLE IF NOT EXISTS \`${this.cfg.table}\` (
            id           BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT PRIMARY KEY,
            request_id   CHAR(36)         NOT NULL,
            full_name    VARCHAR(120)     NOT NULL,
            second_name  VARCHAR(120)     NULL,
            civil        TINYINT(1)       NOT NULL,
            photos       TINYINT(1)       NOT NULL,
            dinner       TINYINT(1)       NOT NULL,
            companions   TINYINT UNSIGNED NOT NULL DEFAULT 0,
            created_at   DATETIME(3)      NOT NULL,
            UNIQUE KEY uq_rsvps_request_id (request_id),
            KEY idx_rsvps_created_at (created_at)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
        )
        // Tabelas criadas antes do campo da segunda pessoa: adiciona a coluna.
        .then(() =>
          this.getPool()
            .query(`ALTER TABLE \`${this.cfg.table}\` ADD COLUMN second_name VARCHAR(120) NULL AFTER full_name`)
            .catch((err) => {
              if ((err as { errno?: number }).errno !== 1060) throw err; // 1060: coluna já existe
            }),
        )
        .then(() => undefined)
        .catch((err) => {
          this.ready = null; // tenta de novo na próxima requisição
          throw err;
        });
    }
    return this.ready;
  }

  async save(record: RsvpRecord): Promise<SaveResult> {
    await this.ensureTable();
    // INSERT IGNORE + chave única em request_id: reenvios não duplicam.
    const [result] = await this.getPool().execute<ResultSetHeader>(
      `INSERT IGNORE INTO \`${this.cfg.table}\`
         (request_id, full_name, second_name, civil, photos, dinner, companions, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        record.requestId,
        record.fullName,
        record.secondName,
        record.civil ? 1 : 0,
        record.photos ? 1 : 0,
        record.dinner ? 1 : 0,
        record.companions,
        record.createdAt,
      ],
    );
    return { duplicate: result.affectedRows === 0 };
  }
}

/**
 * Grava em um arquivo JSON Lines local. Ideal para desenvolvimento ou para
 * servidores com disco persistente. Em produção, prefira o MySQL.
 */
class FileStore implements RsvpStore {
  readonly name = 'file';
  private readonly file: string;
  private seen: Set<string> | null = null;
  private queue: Promise<unknown> = Promise.resolve();

  constructor(dir: string) {
    this.file = path.join(dir, 'rsvps.jsonl');
  }

  private async load(): Promise<Set<string>> {
    if (this.seen) return this.seen;
    await mkdir(path.dirname(this.file), { recursive: true });
    const seen = new Set<string>();
    try {
      const content = await readFile(this.file, 'utf8');
      for (const line of content.split('\n')) {
        if (!line.trim()) continue;
        try {
          seen.add((JSON.parse(line) as { requestId: string }).requestId);
        } catch {
          /* linha corrompida: ignora */
        }
      }
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
    }
    this.seen = seen;
    return seen;
  }

  save(record: RsvpRecord): Promise<SaveResult> {
    // Serializa gravações para não intercalar linhas.
    const task = this.queue.then(async () => {
      const seen = await this.load();
      if (seen.has(record.requestId)) return { duplicate: true };
      const line = JSON.stringify({ ...record, createdAt: record.createdAt.toISOString() }) + '\n';
      await appendFile(this.file, line, 'utf8');
      seen.add(record.requestId);
      return { duplicate: false };
    });
    this.queue = task.catch(() => undefined);
    return task;
  }
}

export const mysqlStore = env.storage.driver === 'mysql' ? new MysqlStore(env.storage.mysql) : null;

export const store: RsvpStore = mysqlStore ?? new FileStore(env.storage.dataDir);
