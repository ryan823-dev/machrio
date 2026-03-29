-- Fix category slugs to match Industry page references
-- Run this on Railway PostgreSQL database

-- Update 'cleaning-and-janitorial' to 'cleaning-janitorial' if it exists
UPDATE categories 
SET slug = 'cleaning-janitorial' 
WHERE slug = 'cleaning-and-janitorial';

-- Verify the update
SELECT id, name, slug, is_published 
FROM categories 
WHERE slug IN ('cleaning-janitorial', 'cleaning-and-janitorial')
ORDER BY id;

-- List all categories to verify slugs
SELECT id, name, slug, is_published, display_order
FROM categories
ORDER BY display_order;
