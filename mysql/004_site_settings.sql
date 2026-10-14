-- ============================================================================
--  LOOPSOOP — site settings / control switches (Phase 3)
--  Run ONCE in Hostinger → phpMyAdmin, database `u456518304_loopsoop_db`.
--  (Select the database, open the SQL tab, paste this, click Go.)
--
--  Purely additive key/value store that powers Maintenance Mode and the kill
--  switches. The app reads it with fail-safe defaults (everything OFF), so the
--  public site behaves completely normally whether or not this has been run —
--  running it simply lets the admin Controls page start saving toggles.
-- ============================================================================
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS site_settings (
  `key`      VARCHAR(191) NOT NULL PRIMARY KEY,
  `value`    TEXT,
  updated_by VARCHAR(255),
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
