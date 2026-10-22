-- ============================================================================
--  LOOPSOOP - allow self-hosted video uploads.
--  Adds 'upload' to the portfolio video_provider enum so items can play from
--  our own hosting (/media/<file>) in addition to YouTube / Google Drive.
--  Run ONCE against the `loopsoop` database, after 001-009:
--    docker exec -i loopsoop-db mysql -uroot -p"$MYSQL_ROOT_PASSWORD" loopsoop < mysql/010_portfolio_upload_provider.sql
-- ============================================================================
SET NAMES utf8mb4;

ALTER TABLE portfolio_items
  MODIFY video_provider ENUM('youtube','google_drive','upload') NOT NULL DEFAULT 'youtube';
