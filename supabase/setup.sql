-- ============================================================================
--  LOOPSOOP Portfolio CMS — Supabase setup
--  Run this ONCE in the Supabase SQL Editor (Dashboard → SQL Editor → New query).
--  Safe to re-run: it uses IF NOT EXISTS / ON CONFLICT guards.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. TABLES
-- ---------------------------------------------------------------------------

-- Admin roles. Being logged in is NOT enough — only role='admin' may write.
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  role       text not null default 'viewer' check (role in ('viewer', 'admin')),
  created_at timestamptz not null default now()
);

-- Category taxonomy (mirrors the site's editingCategories — the join target).
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  description text,
  image       text,
  sort_order  int  not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Portfolio videos. category_id references categories — no duplicated category text.
create table if not exists public.portfolio_items (
  id           uuid primary key default gen_random_uuid(),
  category_id  uuid not null references public.categories(id) on delete cascade,
  title        text not null,
  subtitle     text,                                       -- small label under the title (optional)
  youtube_id   text not null,                              -- normalized 11-char ID (source of truth)
  youtube_url  text,                                       -- original pasted URL, for reference
  video_type   text not null check (video_type in ('long', 'short')),
  thumbnail_url text,                                      -- optional override; else derived from youtube_id
  sort_order   int  not null default 0,
  is_active    boolean not null default true,             -- published vs draft/hidden
  is_featured  boolean not null default false,            -- powers Home "Featured Projects"
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists portfolio_items_category_idx on public.portfolio_items (category_id);
create index if not exists portfolio_items_active_idx   on public.portfolio_items (is_active);

-- ---------------------------------------------------------------------------
-- 2. updated_at auto-touch
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

drop trigger if exists categories_touch on public.categories;
create trigger categories_touch before update on public.categories
  for each row execute function public.touch_updated_at();

drop trigger if exists portfolio_items_touch on public.portfolio_items;
create trigger portfolio_items_touch before update on public.portfolio_items
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- 3. Auto-create a profile row for every new auth user (role starts as 'viewer')
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, role) values (new.id, 'viewer')
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 4. is_admin() — SECURITY DEFINER so it can read profiles without RLS recursion
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ---------------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY
-- ---------------------------------------------------------------------------
alter table public.profiles        enable row level security;
alter table public.categories      enable row level security;
alter table public.portfolio_items enable row level security;

-- profiles: a user may read their own row; admins may read all.
drop policy if exists "read own profile"  on public.profiles;
create policy "read own profile"  on public.profiles for select using (id = auth.uid());
drop policy if exists "admins read profiles" on public.profiles;
create policy "admins read profiles" on public.profiles for select using (public.is_admin());

-- categories: anyone may read; only admins may write.
drop policy if exists "public read categories" on public.categories;
create policy "public read categories" on public.categories for select using (true);
drop policy if exists "admins write categories" on public.categories;
create policy "admins write categories" on public.categories for all
  using (public.is_admin()) with check (public.is_admin());

-- portfolio_items: public reads ONLY published items; admins read all + full CRUD.
drop policy if exists "public read active items" on public.portfolio_items;
create policy "public read active items" on public.portfolio_items for select using (is_active = true);
drop policy if exists "admins read all items" on public.portfolio_items;
create policy "admins read all items" on public.portfolio_items for select using (public.is_admin());
drop policy if exists "admins write items" on public.portfolio_items;
create policy "admins write items" on public.portfolio_items for all
  using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- 6. SEED — categories (mirrors src/lib/data.ts editingCategories)
-- ---------------------------------------------------------------------------
insert into public.categories (name, slug, description, image, sort_order) values
  ('Documentary',  'documentary',  'Natural, raw and real edits that keep the story authentic.',                       '/categories/documentary.webp',  0),
  ('Commercial',   'commercial',   'Punchy, high-converting ads and brand films that sell.',                            '/categories/commercial.webp',   1),
  ('Corporate',    'corporate',    'Polished, professional edits for brands and businesses.',                           '/categories/corporate.webp',    2),
  ('Gaming',       'gaming',       'High-energy gaming edits — montages, highlights and stream moments that hit hard.', '/categories/gaming.webp',       3),
  ('Fast Pace',    'fast-pace',    'High-energy cuts, quick transitions and impactful beats.',                          '/categories/fast-pace.webp',    4),
  ('Luxury',       'luxury',       'Elegant, refined edits with a premium, high-end feel.',                             '/categories/luxury.webp',       5),
  ('Educational',  'educational',  'Clear, engaging edits that make complex ideas easy to follow.',                     '/categories/educational.webp',  6),
  ('Social Media', 'social-media', 'Scroll-stopping edits optimised for reach and engagement.',                         '/categories/social-media.webp', 7)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- 7. SEED — portfolio_items (migrates the current hardcoded projects[])
--    Preserves title, subtitle, category, long/short type, order and featured.
--    (All currently use the same placeholder video ID — swap them in the admin panel.)
-- ---------------------------------------------------------------------------
insert into public.portfolio_items
  (category_id, title, subtitle, youtube_id, youtube_url, video_type, is_featured, sort_order)
values
  ((select id from public.categories where slug='commercial'),  'boAt Airdopes 141',   'Product Ad',        'aqz-KE-bpKQ', 'https://www.youtube.com/watch?v=aqz-KE-bpKQ', 'long',  true,  0),
  ((select id from public.categories where slug='educational'), 'Finance Simplified',  'YouTube Video',     'aqz-KE-bpKQ', 'https://www.youtube.com/watch?v=aqz-KE-bpKQ', 'long',  true,  1),
  ((select id from public.categories where slug='commercial'),  'PUMA Ignite Campaign','Commercial',        'aqz-KE-bpKQ', 'https://www.youtube.com/watch?v=aqz-KE-bpKQ', 'long',  true,  2),
  ((select id from public.categories where slug='gaming'),      'Clutch Moments',      'Gaming Montage',    'aqz-KE-bpKQ', 'https://www.youtube.com/watch?v=aqz-KE-bpKQ', 'long',  true,  3),
  ((select id from public.categories where slug='luxury'),      'Luxury Redefined',    'Real Estate Video', 'aqz-KE-bpKQ', 'https://www.youtube.com/watch?v=aqz-KE-bpKQ', 'long',  true,  4),
  ((select id from public.categories where slug='documentary'), 'True North',          'Travel Documentary','aqz-KE-bpKQ', 'https://www.youtube.com/watch?v=aqz-KE-bpKQ', 'long',  true,  5),
  ((select id from public.categories where slug='corporate'),   'NexGen App Launch',   'Product Video',     'aqz-KE-bpKQ', 'https://www.youtube.com/watch?v=aqz-KE-bpKQ', 'long',  false, 6),
  ((select id from public.categories where slug='fast-pace'),   'Ride Beyond',         'Brand Film',        'aqz-KE-bpKQ', 'https://www.youtube.com/watch?v=aqz-KE-bpKQ', 'long',  false, 7),
  ((select id from public.categories where slug='commercial'),  'Coca-Cola Zero',      'Commercial Reel',   'aqz-KE-bpKQ', 'https://www.youtube.com/watch?v=aqz-KE-bpKQ', 'short', false, 8),
  ((select id from public.categories where slug='documentary'), 'Urban Frames',        'Cinematic Reel',    'aqz-KE-bpKQ', 'https://www.youtube.com/watch?v=aqz-KE-bpKQ', 'short', false, 9),
  ((select id from public.categories where slug='social-media'),'Minimalist Skincare', 'Product Reel',      'aqz-KE-bpKQ', 'https://www.youtube.com/watch?v=aqz-KE-bpKQ', 'short', false, 10),
  ((select id from public.categories where slug='social-media'),'No Limits',           'Fitness Reel',      'aqz-KE-bpKQ', 'https://www.youtube.com/watch?v=aqz-KE-bpKQ', 'short', false, 11)
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- 8. GRANT ADMIN — run AFTER you create your admin user in Authentication → Users.
--    Replace the email, then run just this statement.
-- ---------------------------------------------------------------------------
-- update public.profiles set role = 'admin'
-- where id = (select id from auth.users where email = 'you@example.com');
