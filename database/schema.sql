-- =====================================================================
--  Our Forever — Ademilson & Regiane
--  Tabela de confirmações de presença (RSVP) — MySQL / MariaDB (Hostinger)
--
--  O backend cria esta tabela automaticamente na primeira execução.
--  Se preferir criar manualmente: hPanel → Bancos de dados → phpMyAdmin →
--  selecione o banco → aba SQL → cole e execute.
-- =====================================================================

CREATE TABLE IF NOT EXISTS rsvps (
  id           BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT PRIMARY KEY,
  -- Gerado pelo navegador a cada preenchimento: evita registros duplicados
  -- quando o convidado reenvia após uma falha de conexão.
  request_id   CHAR(36)         NOT NULL,
  full_name    VARCHAR(120)     NOT NULL,
  attending    TINYINT(1)       NOT NULL,              -- 1 = vai, 0 = não vai
  companions   TINYINT UNSIGNED NOT NULL DEFAULT 0,
  created_at   DATETIME(3)      NOT NULL,              -- em UTC
  UNIQUE KEY uq_rsvps_request_id (request_id),
  KEY idx_rsvps_attending (attending),
  KEY idx_rsvps_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
--  Segurança
--  Use um usuário de banco exclusivo para o convite, com permissões só
--  neste banco. As credenciais ficam apenas no .env do servidor.
-- ---------------------------------------------------------------------

-- ---------------------------------------------------------------------
--  Consultas úteis (horário de Brasília = UTC−3)
-- ---------------------------------------------------------------------
-- Totais:
--   SELECT
--     SUM(attending = 1)                        AS confirmaram,
--     SUM(attending = 0)                        AS nao_poderao_ir,
--     COALESCE(SUM(IF(attending, 1 + companions, 0)), 0) AS total_de_pessoas
--   FROM rsvps;
--
-- Quem confirmou:
--   SELECT full_name, companions, DATE_SUB(created_at, INTERVAL 3 HOUR) AS enviado_em
--   FROM rsvps WHERE attending = 1 ORDER BY full_name;
--
-- Quem não poderá comparecer:
--   SELECT full_name, DATE_SUB(created_at, INTERVAL 3 HOUR) AS enviado_em
--   FROM rsvps WHERE attending = 0 ORDER BY full_name;
