-- ============================================================================
--  LOOPSOOP — audit log foundation (Phase 2)
--  Run ONCE in Hostinger → phpMyAdmin, database `u456518304_loopsoop_db`.
--  (Select the database, open the SQL tab, paste this, click Go.)
--
--  Purely additive: a new table that RECORDS administrative actions. Nothing
--  existing is touched. Audit writes are best-effort in the app, so the admin
--  keeps working normally whether or not this migration has been run yet —
--  running it simply makes the Activity page start showing entries.
-- ============================================================================
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS audit_logs (
  id            CHAR(36)      NOT NULL PRIMARY KEY,
  actor_id      CHAR(36),                 -- users.id of the admin who acted
  actor_email   VARCHAR(255),             -- denormalised for easy display
  action        VARCHAR(64)   NOT NULL,   -- e.g. login, item.create, item.delete
  resource_type VARCHAR(64),              -- e.g. portfolio_item
  resource_id   VARCHAR(64),              -- affected row id
  summary       VARCHAR(512),             -- human-readable one-liner
  meta          TEXT,                     -- optional JSON (before/after, extra)
  ip            VARCHAR(64),              -- request IP when available
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_created (created_at),
  INDEX idx_action (action)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
