-- ============================================================================
--  LOOPSOOP — inquiries inbox (Phase 5)
--  Run ONCE in Hostinger → phpMyAdmin, database `u456518304_loopsoop_db`.
--  (Select the database, open the SQL tab, paste this, click Go.)
--
--  Backs the new public contact form + the admin inbox. Purely additive; the
--  WhatsApp contact channel is unaffected. Until this is run, the form shows a
--  friendly "please use WhatsApp" error and nothing else changes.
-- ============================================================================
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS inquiries (
  id           CHAR(36)     NOT NULL PRIMARY KEY,
  name         VARCHAR(200) NOT NULL,
  email        VARCHAR(200) NOT NULL,
  phone        VARCHAR(40),
  project_type VARCHAR(80),
  message      TEXT         NOT NULL,
  status       ENUM('new','in_progress','contacted','qualified','converted','closed','archived')
                            NOT NULL DEFAULT 'new',
  notes        TEXT,                       -- internal admin notes
  is_read      TINYINT(1)   NOT NULL DEFAULT 0,
  ip           VARCHAR(64),
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status),
  INDEX idx_created (created_at),
  INDEX idx_read (is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
