-- ============================================================================
--  LOOPSOOP — CMS content blocks (Phase 4)
--  Run ONCE in Hostinger → phpMyAdmin, database `u456518304_loopsoop_db`.
--  (Select the database, open the SQL tab, paste this, click Go.)
--
--  Purely additive. Each row is a named, editable piece of website content
--  stored as JSON, with a `draft` (work-in-progress) and a `published` (live)
--  value. The public site reads `published` and falls back to the built-in
--  code defaults when a block is missing — so the site behaves normally whether
--  or not this has been run, and can never break from empty/missing content.
-- ============================================================================
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS content_blocks (
  `key`        VARCHAR(191) NOT NULL PRIMARY KEY,  -- e.g. faqs
  draft        MEDIUMTEXT,                          -- JSON: work-in-progress
  published    MEDIUMTEXT,                          -- JSON: live value the site reads
  updated_by   VARCHAR(255),
  updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  published_at DATETIME
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
