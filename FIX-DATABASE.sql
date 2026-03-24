-- 修复 Payload CMS 数据库 schema
-- 在 Supabase Dashboard → SQL Editor 中执行此脚本

-- 1. 修复 users 表（添加缺失的列）
ALTER TABLE users ADD COLUMN IF NOT EXISTS role text DEFAULT 'editor';
ALTER TABLE users ADD COLUMN IF NOT EXISTS name text;

-- 2. 确保 Global 表有初始数据
INSERT INTO homepage (id, _created_at, _updated_at) 
SELECT gen_random_uuid(), NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM homepage);

INSERT INTO site_settings (id, _created_at, _updated_at) 
SELECT gen_random_uuid(), NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM site_settings);

INSERT INTO navigation (id, _created_at, _updated_at) 
SELECT gen_random_uuid(), NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM navigation);

-- 3. 确保 categories 表有 display_order 列
ALTER TABLE categories ADD COLUMN IF NOT EXISTS display_order integer DEFAULT 0;

-- 执行后请验证：
-- SELECT COUNT(*) FROM users;
-- SELECT COUNT(*) FROM homepage;
-- SELECT COUNT(*) FROM site_settings;
-- SELECT COUNT(*) FROM navigation;
