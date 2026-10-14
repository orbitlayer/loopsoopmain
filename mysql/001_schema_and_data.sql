-- ============================================================================
--  LOOPSOOP — MySQL schema + data (migration off Supabase/Postgres)
--  Run ONCE in Hostinger → phpMyAdmin, database `u456518304_loopsoop_db`.
--  (Select the database first, then paste this into the SQL tab and Go.)
-- ============================================================================
SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- ---------------------------------------------------------------------------
-- 1. TABLES
-- ---------------------------------------------------------------------------

-- Admin users (replaces Supabase Auth). password_hash is a bcrypt hash — never
-- a plaintext password. Seed your admin row separately (see step 4 below).
CREATE TABLE IF NOT EXISTS users (
  id            CHAR(36)      NOT NULL PRIMARY KEY,
  email         VARCHAR(255)  NOT NULL UNIQUE,
  password_hash VARCHAR(255)  NOT NULL,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS categories (
  id          CHAR(36)     NOT NULL PRIMARY KEY,
  name        VARCHAR(255) NOT NULL,
  slug        VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  image       VARCHAR(255),
  sort_order  INT          NOT NULL DEFAULT 0,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS portfolio_items (
  id             CHAR(36)                     NOT NULL PRIMARY KEY,
  category_id    CHAR(36)                     NOT NULL,
  title          VARCHAR(255)                 NOT NULL,
  subtitle       VARCHAR(255),
  video_provider ENUM('youtube','google_drive') NOT NULL DEFAULT 'youtube',
  video_url      TEXT                         NOT NULL,
  youtube_id     VARCHAR(32),
  youtube_url    TEXT,
  thumbnail_url  TEXT,
  video_type     ENUM('long','short')         NOT NULL,
  sort_order     INT                          NOT NULL DEFAULT 0,
  is_active      TINYINT(1)                   NOT NULL DEFAULT 1,
  is_featured    TINYINT(1)                   NOT NULL DEFAULT 0,
  created_at     DATETIME                     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME                     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_portfolio_category FOREIGN KEY (category_id)
    REFERENCES categories(id) ON DELETE CASCADE,
  INDEX idx_category (category_id),
  INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- 2. CATEGORIES (migrated from Supabase, same IDs)
-- ---------------------------------------------------------------------------
INSERT INTO categories (id, name, slug, description, image, sort_order) VALUES
('cbfb785a-2a8b-48c3-af98-6bb827523c3f','Documentary','documentary','Natural, raw and real edits that keep the story authentic.','/categories/documentary.webp',0),
('008cec5a-e449-4061-95dc-a7a80b5325f3','Commercial','commercial','Punchy, high-converting ads and brand films that sell.','/categories/commercial.webp',1),
('488e80ef-bcf1-48bb-8aeb-80709b9becb1','Motion Graphics','corporate','Animated graphics, kinetic typography and motion design that bring ideas to life.','/categories/corporate.webp',2),
('b537c675-2788-45bb-9271-d2b73582a04d','Gaming','gaming','High-energy gaming edits — montages, highlights and stream moments that hit hard.','/categories/gaming.webp',3),
('f849462f-a7d4-4ffb-a94e-daba8eda1559','Highlight Edit','fast-pace','The best moments cut into punchy, high-energy highlight reels.','/categories/fast-pace.webp',4),
('83cf97b2-4589-4c8e-aac4-7ebf0f6a3cad','Real Estate','luxury','Cinematic property tours and walkthroughs that sell every space.','/categories/luxury.webp',5),
('4800c0bb-70a3-4bb0-bfb7-f3ee13646b77','Educational','educational','Clear, engaging edits that make complex ideas easy to follow.','/categories/educational.webp',6),
('b82ae464-8f92-4ba9-ad8b-107013249580','Social Media','social-media','Scroll-stopping edits optimised for reach and engagement.','/categories/social-media.webp',7);

-- ---------------------------------------------------------------------------
-- 3. PORTFOLIO ITEMS (11 published items, migrated from Supabase, same IDs)
-- ---------------------------------------------------------------------------
INSERT INTO portfolio_items
  (id, category_id, title, subtitle, video_provider, video_url, youtube_id, youtube_url, thumbnail_url, video_type, sort_order, is_active, is_featured) VALUES
('29353efe-7530-474d-82de-aeb4ad33bcfa','4800c0bb-70a3-4bb0-bfb7-f3ee13646b77','Finance Simplified','YouTube Video','youtube','https://www.youtube.com/watch?v=aqz-KE-bpKQ','aqz-KE-bpKQ','https://www.youtube.com/watch?v=aqz-KE-bpKQ',NULL,'long',1,1,1),
('ecc6ca87-a439-48e7-a8bd-1e07a4ad81e4','008cec5a-e449-4061-95dc-a7a80b5325f3','boAt Airdopes 141','Product Ad','youtube','https://www.youtube.com/watch?v=aqz-KE-bpKQ','aqz-KE-bpKQ','https://www.youtube.com/watch?v=aqz-KE-bpKQ',NULL,'long',2,1,1),
('bcbb6c81-23c0-4ad8-bb34-21e636b049f1','008cec5a-e449-4061-95dc-a7a80b5325f3','PUMA Ignite Campaign','Commercial','youtube','https://www.youtube.com/watch?v=aqz-KE-bpKQ','aqz-KE-bpKQ','https://www.youtube.com/watch?v=aqz-KE-bpKQ',NULL,'long',2,1,1),
('e22afc28-74c4-4187-8596-9c282d0e3ca1','b537c675-2788-45bb-9271-d2b73582a04d','Clutch Moments','Gaming Montage','youtube','https://www.youtube.com/watch?v=aqz-KE-bpKQ','aqz-KE-bpKQ','https://www.youtube.com/watch?v=aqz-KE-bpKQ',NULL,'long',3,1,1),
('f4ecbbfe-eef2-4f18-965d-83b15bcd7050','83cf97b2-4589-4c8e-aac4-7ebf0f6a3cad','Luxury Redefined','Real Estate Video','youtube','https://www.youtube.com/watch?v=aqz-KE-bpKQ','aqz-KE-bpKQ','https://www.youtube.com/watch?v=aqz-KE-bpKQ',NULL,'long',4,1,1),
('f6c13159-c974-478b-ba60-ac6ff14ed0f1','488e80ef-bcf1-48bb-8aeb-80709b9becb1','NexGen App Launch','Product Video','youtube','https://www.youtube.com/watch?v=aqz-KE-bpKQ','aqz-KE-bpKQ','https://www.youtube.com/watch?v=aqz-KE-bpKQ',NULL,'long',6,1,0),
('f6df8179-a4cf-479e-b3cf-165795170ba4','f849462f-a7d4-4ffb-a94e-daba8eda1559','Ride Beyond','Brand Film','youtube','https://www.youtube.com/watch?v=aqz-KE-bpKQ','aqz-KE-bpKQ','https://www.youtube.com/watch?v=aqz-KE-bpKQ',NULL,'long',7,1,0),
('e3f5007d-86db-4e4f-8a6c-a33ffa6349b4','008cec5a-e449-4061-95dc-a7a80b5325f3','Coca-Cola Zero','Commercial Reel','youtube','https://www.youtube.com/watch?v=aqz-KE-bpKQ','aqz-KE-bpKQ','https://www.youtube.com/watch?v=aqz-KE-bpKQ',NULL,'short',8,1,0),
('4fa878f4-0a48-474f-9e39-dfce21703d35','cbfb785a-2a8b-48c3-af98-6bb827523c3f','Urban Frames','Cinematic Reel','youtube','https://www.youtube.com/watch?v=aqz-KE-bpKQ','aqz-KE-bpKQ','https://www.youtube.com/watch?v=aqz-KE-bpKQ',NULL,'short',9,1,0),
('1f67c34b-b648-4996-bb03-541d847a22b7','b82ae464-8f92-4ba9-ad8b-107013249580','Minimalist Skincare','Product Reel','youtube','https://www.youtube.com/watch?v=aqz-KE-bpKQ','aqz-KE-bpKQ','https://www.youtube.com/watch?v=aqz-KE-bpKQ',NULL,'short',10,1,0),
('8fe350e9-f184-4af1-bf18-62df5fe6e60a','b82ae464-8f92-4ba9-ad8b-107013249580','No Limits','Fitness Reel','youtube','https://www.youtube.com/watch?v=aqz-KE-bpKQ','aqz-KE-bpKQ','https://www.youtube.com/watch?v=aqz-KE-bpKQ',NULL,'short',11,1,0);

-- Optional: "True North" is currently a DRAFT in Supabase (not readable via the
-- public key). Uncomment to migrate it as a hidden draft, or just re-add it in
-- the new admin panel after cutover.
-- INSERT INTO portfolio_items
--   (id, category_id, title, subtitle, video_provider, video_url, youtube_id, youtube_url, thumbnail_url, video_type, sort_order, is_active, is_featured) VALUES
-- ('a1b2c3d4-0000-4000-8000-000000000001','cbfb785a-2a8b-48c3-af98-6bb827523c3f','True North','Travel Documentary','youtube','https://www.youtube.com/watch?v=aqz-KE-bpKQ','aqz-KE-bpKQ','https://www.youtube.com/watch?v=aqz-KE-bpKQ',NULL,'long',5,0,0);

-- ---------------------------------------------------------------------------
-- 4. ADMIN USER — do NOT paste a plaintext password here.
--    I'll give you a tiny local script to generate a bcrypt hash from your
--    chosen password; then run an INSERT like:
--    INSERT INTO users (id, email, password_hash) VALUES
--      (UUID(), 'you@example.com', '$2b$10$....the-generated-hash....');
-- ---------------------------------------------------------------------------
