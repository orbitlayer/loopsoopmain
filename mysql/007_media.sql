-- ============================================================================
--  LOOPSOOP — media library (Phase 7)
--  Run ONCE in Hostinger → phpMyAdmin, database `u456518304_loopsoop_db`.
--
--  Stores metadata for uploaded images. The files themselves live on disk in
--  UPLOADS_DIR (see the env var) and are served via /media/<filename>.
--  Additive; nothing else is affected.
-- ============================================================================
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS media (
  id            CHAR(36)     NOT NULL PRIMARY KEY,
  filename      VARCHAR(255) NOT NULL UNIQUE,  -- stored name: <uuid>.<ext>
  original_name VARCHAR(255) NOT NULL,
  mime          VARCHAR(100) NOT NULL,
  size          INT          NOT NULL,
  uploaded_by   VARCHAR(255),
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
