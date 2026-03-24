-- Add missing columns to categories table
-- 执行这个 SQL 添加缺失的列

ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS short_description text,
ADD COLUMN IF NOT EXISTS icon_emoji text,
ADD COLUMN IF NOT EXISTS featured boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS faq jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS facet_groups jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS intro_content text,
ADD COLUMN IF NOT EXISTS seo jsonb,
ADD COLUMN IF NOT EXISTS seo_content jsonb;

-- Add missing columns to products table (if needed)
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS short_description text,
ADD COLUMN IF NOT EXISTS faq jsonb DEFAULT '[]'::jsonb;

-- Add missing columns to articles table (if needed)
ALTER TABLE articles 
ADD COLUMN IF NOT EXISTS content jsonb;

COMMENT ON COLUMN categories.short_description IS 'Short description for listing pages';
COMMENT ON COLUMN categories.icon_emoji IS 'Emoji icon for the category';
COMMENT ON COLUMN categories.featured IS 'Whether this category is featured';
COMMENT ON COLUMN categories.faq IS 'Frequently asked questions';
COMMENT ON COLUMN categories.facet_groups IS 'Facet group configuration';
COMMENT ON COLUMN categories.intro_content IS 'Introductory content';
COMMENT ON COLUMN categories.seo IS 'SEO metadata';
COMMENT ON COLUMN categories.seo_content IS 'SEO content section';
