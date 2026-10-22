-- ============================================================================
--  LOOPSOOP - real portfolio content (from the shared portfolio Google Doc)
--  Replaces the placeholder demo videos with the real YouTube portfolio.
--  Run ONCE against the `loopsoop` database, AFTER 001-008:
--    docker exec -i loopsoop-db mysql -uroot -p"$MYSQL_ROOT_PASSWORD" loopsoop < mysql/009_real_portfolio.sql
--
--  - PORTFOLIO (all rows, is_active = 1) -> the /portfolio gallery.
--  - WORKS (is_featured = 1)             -> the home + /our-work "Work in motion".
--  - youtube.com/shorts links are stored as 9:16 (video_type = 'short').
--  Titles were pulled from the videos themselves; rename any in the admin later.
-- ============================================================================
SET NAMES utf8mb4;

-- 1. Categories that aren't in the seed (Real Estate + Motion Graphics already
--    exist by name). Idempotent: only added if missing.
INSERT INTO categories (id, name, slug, description, image, sort_order)
SELECT UUID(), '2D Animation', '2d-animation',
       'Custom 2D animation and illustrated explainers that turn complex ideas into simple, scroll-stopping stories.',
       '', 8
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = '2D Animation');

INSERT INTO categories (id, name, slug, description, image, sort_order)
SELECT UUID(), 'Talking Head', 'talking-head',
       'Crisp talking-head edits for creators, founders and brands - tight pacing, clean captions and retention built in.',
       '', 9
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Talking Head');

-- 2. Resolve category ids into variables (avoids subqueries in VALUES).
SET @cat_2d := (SELECT id FROM categories WHERE name = '2D Animation'    LIMIT 1);
SET @cat_re := (SELECT id FROM categories WHERE name = 'Real Estate'     LIMIT 1);
SET @cat_mg := (SELECT id FROM categories WHERE name = 'Motion Graphics' LIMIT 1);
SET @cat_th := (SELECT id FROM categories WHERE name = 'Talking Head'    LIMIT 1);

-- 3. Clear the placeholder demo portfolio, then load the real videos.
--    Wrapped in a transaction: if the INSERT fails (e.g. a category id did not
--    resolve), the DELETE rolls back and the old portfolio is left intact.
START TRANSACTION;

DELETE FROM portfolio_items;

INSERT INTO portfolio_items
  (id, category_id, title, subtitle, video_provider, video_url, youtube_id, youtube_url, thumbnail_url, video_type, sort_order, is_active, is_featured)
VALUES
-- 2D Animation
(UUID(), @cat_2d, 'Animation sample 1',                                           NULL, 'youtube', 'https://www.youtube.com/watch?v=0SkATTWx56o', '0SkATTWx56o', 'https://www.youtube.com/watch?v=0SkATTWx56o', NULL, 'long',   1, 1, 0),
(UUID(), @cat_2d, 'Animation sample 2',                                           NULL, 'youtube', 'https://www.youtube.com/watch?v=zVGMYDENAeI', 'zVGMYDENAeI', 'https://www.youtube.com/watch?v=zVGMYDENAeI', NULL, 'long',   2, 1, 0),
(UUID(), @cat_2d, '13 October 2026',                                              NULL, 'youtube', 'https://www.youtube.com/watch?v=hi1ZypGbChk', 'hi1ZypGbChk', 'https://www.youtube.com/watch?v=hi1ZypGbChk', NULL, 'long',   3, 1, 0),
(UUID(), @cat_2d, 'Animation showcase',                                           NULL, 'youtube', 'https://www.youtube.com/watch?v=nAlJJRSpCOY', 'nAlJJRSpCOY', 'https://www.youtube.com/watch?v=nAlJJRSpCOY', NULL, 'long',   4, 1, 0),
(UUID(), @cat_2d, 'Your Life at Every Rank in the Roman Army',                    NULL, 'youtube', 'https://www.youtube.com/watch?v=qhDTgCpBYiQ', 'qhDTgCpBYiQ', 'https://www.youtube.com/watch?v=qhDTgCpBYiQ', NULL, 'long',   5, 1, 1),
(UUID(), @cat_2d, 'Bermuda Ka Bhoot | Free Fire',                                 NULL, 'youtube', 'https://www.youtube.com/watch?v=c1r5MeZI7Mg', 'c1r5MeZI7Mg', 'https://www.youtube.com/watch?v=c1r5MeZI7Mg', NULL, 'long',   6, 1, 1),
(UUID(), @cat_2d, 'Bermuda ka Bhoot - Sakura ki Kahani',                          NULL, 'youtube', 'https://youtube.com/shorts/WVZy_T7VNJc',       'WVZy_T7VNJc', 'https://youtube.com/shorts/WVZy_T7VNJc',       NULL, 'short',  7, 1, 1),
(UUID(), @cat_2d, 'Free Fire 2D animation',                                       NULL, 'youtube', 'https://youtube.com/shorts/wEaHGeW_y_I',       'wEaHGeW_y_I', 'https://youtube.com/shorts/wEaHGeW_y_I',       NULL, 'short',  8, 1, 1),
(UUID(), @cat_2d, 'Diamond ka Bhoot - Adam ki Kahani',                            NULL, 'youtube', 'https://youtube.com/shorts/I4EPcNeLZII',       'I4EPcNeLZII', 'https://youtube.com/shorts/I4EPcNeLZII',       NULL, 'short',  9, 1, 1),
-- Real Estate
(UUID(), @cat_re, 'Sample showreel',                                             NULL, 'youtube', 'https://www.youtube.com/watch?v=HDasemUMeeA', 'HDasemUMeeA', 'https://www.youtube.com/watch?v=HDasemUMeeA', NULL, 'long',  10, 1, 0),
(UUID(), @cat_re, 'Sample showreel 2',                                           NULL, 'youtube', 'https://www.youtube.com/watch?v=F3ZrzjxNcB0', 'F3ZrzjxNcB0', 'https://www.youtube.com/watch?v=F3ZrzjxNcB0', NULL, 'long',  11, 1, 0),
(UUID(), @cat_re, 'Real Estate showreel',                                        NULL, 'youtube', 'https://www.youtube.com/watch?v=cFk_Y5nImM0', 'cFk_Y5nImM0', 'https://www.youtube.com/watch?v=cFk_Y5nImM0', NULL, 'long',  12, 1, 1),
-- Motion Graphics
(UUID(), @cat_mg, 'OrbitLayer Showreel',                                         NULL, 'youtube', 'https://www.youtube.com/watch?v=P_AW6wkXWRY', 'P_AW6wkXWRY', 'https://www.youtube.com/watch?v=P_AW6wkXWRY', NULL, 'long',  13, 1, 1),
(UUID(), @cat_mg, 'Nextline Showreel',                                           NULL, 'youtube', 'https://www.youtube.com/watch?v=z6NcFMqTGLQ', 'z6NcFMqTGLQ', 'https://www.youtube.com/watch?v=z6NcFMqTGLQ', NULL, 'long',  14, 1, 1),
(UUID(), @cat_mg, 'Hyperprice Showreel',                                         NULL, 'youtube', 'https://www.youtube.com/watch?v=OpKD_UHaSPA', 'OpKD_UHaSPA', 'https://www.youtube.com/watch?v=OpKD_UHaSPA', NULL, 'long',  15, 1, 1),
(UUID(), @cat_mg, 'Nextline Advertisement',                                      NULL, 'youtube', 'https://www.youtube.com/watch?v=N2Zf1bED4o4', 'N2Zf1bED4o4', 'https://www.youtube.com/watch?v=N2Zf1bED4o4', NULL, 'long',  16, 1, 1),
-- Talking Head
(UUID(), @cat_th, 'Talking Head Portfolio',                                      NULL, 'youtube', 'https://www.youtube.com/watch?v=Q2zc8LXbgbo', 'Q2zc8LXbgbo', 'https://www.youtube.com/watch?v=Q2zc8LXbgbo', NULL, 'long',  17, 1, 1);

COMMIT;
