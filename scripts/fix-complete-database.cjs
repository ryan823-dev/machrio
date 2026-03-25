-- =============================================
-- Machrio 数据库修复 SQL - 执行前请备份数据
-- 在 Supabase Dashboard → SQL Editor 中执行
-- =============================================

-- 1. 修复 categories 表 - 添加缺失的列
ALTER TABLE categories ADD COLUMN IF NOT EXISTS short_description text;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS intro_content text;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS faq jsonb DEFAULT '[]';
ALTER TABLE categories ADD COLUMN IF NOT EXISTS facet_groups jsonb DEFAULT '[]';
ALTER TABLE categories ADD COLUMN IF NOT EXISTS icon_emoji text;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS featured boolean DEFAULT false;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS level integer DEFAULT 1;

-- 确保 display_order 存在
ALTER TABLE categories ADD COLUMN IF NOT EXISTS display_order integer DEFAULT 0;

-- 2. 修复 products 表 - 添加缺失的列
ALTER TABLE products ADD COLUMN IF NOT EXISTS slug text;

-- 确保 primary_category_id 存在
-- (如果已存在不同的列名，可能需要调整)

-- 3. 修复 users 表
ALTER TABLE users ADD COLUMN IF NOT EXISTS role text DEFAULT 'editor';
ALTER TABLE users ADD COLUMN IF NOT EXISTS name text;

-- 4. 确保 Global 表有初始数据
INSERT INTO homepage (id, _created_at, _updated_at)
SELECT gen_random_uuid(), NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM homepage LIMIT 1);

INSERT INTO site_settings (id, _created_at, _updated_at)
SELECT gen_random_uuid(), NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM site_settings LIMIT 1);

INSERT INTO navigation (id, _created_at, _updated_at)
SELECT gen_random_uuid(), NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM navigation LIMIT 1);

-- 5. 验证表结构
SELECT 'Categories 表列:' as info;
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'categories' ORDER BY ordinal_position;

SELECT 'Products 表列:' as info;
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'products' ORDER BY ordinal_position;

-- 6. 统计记录数
SELECT 'categories count:' as info, COUNT(*) as count FROM categories;
SELECT 'products count:' as info, COUNT(*) as count FROM products;
SELECT 'products with primary_category_id:' as info, COUNT(*) as count FROM products WHERE primary_category_id IS NOT NULL;

-- 7. 检查分类层级
SELECT 'L1 categories (no parent):' as info, COUNT(*) as count
FROM categories WHERE parent_id IS NULL;

SELECT 'L2 categories (has parent, has children):' as info, COUNT(*) as count
FROM categories c1
WHERE parent_id IS NOT NULL
AND EXISTS (SELECT 1 FROM categories c2 WHERE c2.parent_id = c1.id);

SELECT 'L3 categories (has parent, no children):' as info, COUNT(*) as count
FROM categories c1
WHERE parent_id IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM categories c2 WHERE c2.parent_id = c1.id);
