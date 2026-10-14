-- ============================================================================
--  LOOPSOOP CMS — migration 002: add Google Drive as a second video source
--  Run ONCE in the Supabase SQL Editor. Safe to re-run (guards included).
--  Backward-compatible: existing YouTube rows keep working unchanged.
-- ============================================================================

-- 1. Provider column — existing rows default to 'youtube'.
alter table public.portfolio_items
  add column if not exists video_provider text not null default 'youtube';

alter table public.portfolio_items
  drop constraint if exists portfolio_items_video_provider_check;
alter table public.portfolio_items
  add constraint portfolio_items_video_provider_check
  check (video_provider in ('youtube', 'google_drive'));

-- 2. Generic source URL (canonical link for either provider).
alter table public.portfolio_items
  add column if not exists video_url text;

-- 3. youtube_id is no longer required (Google Drive items have none).
alter table public.portfolio_items
  alter column youtube_id drop not null;

-- 4. Backfill video_url for existing YouTube rows so every row has a source URL.
update public.portfolio_items
  set video_url = coalesce(video_url, youtube_url, 'https://www.youtube.com/watch?v=' || youtube_id)
  where video_provider = 'youtube' and video_url is null;
