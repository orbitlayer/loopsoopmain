-- ============================================================================
--  LOOPSOOP — rename 3 categories (live DB migration)
--  Run ONCE in Hostinger → phpMyAdmin, database `u456518304_loopsoop_db`.
--  (Select the database, open the SQL tab, paste this, click Go.)
--
--  Only the display NAME (and its card description) changes. The slug and id
--  stay the same, so every existing portfolio video keeps its category, all
--  deep links (?category=...) keep working, and the card images keep loading.
--    Fast Pace  ->  Highlight Edit
--    Luxury     ->  Real Estate
--    Corporate  ->  Motion Graphics
-- ============================================================================

UPDATE categories
   SET name = 'Highlight Edit',
       description = 'The best moments cut into punchy, high-energy highlight reels.'
 WHERE slug = 'fast-pace';

UPDATE categories
   SET name = 'Real Estate',
       description = 'Cinematic property tours and walkthroughs that sell every space.'
 WHERE slug = 'luxury';

UPDATE categories
   SET name = 'Motion Graphics',
       description = 'Animated graphics, kinetic typography and motion design that bring ideas to life.'
 WHERE slug = 'corporate';
