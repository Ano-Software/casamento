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
  second_name  VARCHAR(120)     NULL,                  -- segunda pessoa (opcional)
  civil        TINYINT(1)       NOT NULL,              -- I   casamento civil   (1 = sim)
  photos       TINYINT(1)       NOT NULL,              -- II  sessão de fotos   (1 = sim)
  dinner       TINYINT(1)       NOT NULL,              -- III encontro noturno  (1 = sim)
  companions   TINYINT UNSIGNED NOT NULL DEFAULT 0,
  created_at   DATETIME(3)      NOT NULL,              -- em UTC
  UNIQUE KEY uq_rsvps_request_id (request_id),
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
-- Totais por momento:
--   SELECT SUM(civil)  AS casamento_civil,
--          SUM(photos) AS sessao_de_fotos,
--          SUM(dinner) AS encontro_noturno,
--          SUM(civil = 0 AND photos = 0 AND dinner = 0) AS nao_poderao_ir
--   FROM rsvps;
--
-- Todas as respostas:
--   SELECT full_name,
--          IF(civil,  'Sim', 'Não') AS civil,
--          IF(photos, 'Sim', 'Não') AS fotos,
--          IF(dinner, 'Sim', 'Não') AS jantar,
--          DATE_SUB(created_at, INTERVAL 3 HOUR) AS enviado_em
--   FROM rsvps ORDER BY full_name;
--
-- Quem vai ao encontro noturno (para a reserva do restaurante):
--   SELECT full_name FROM rsvps WHERE dinner = 1 ORDER BY full_name;