-- 创建缺失的 Payload CMS 表

-- 1. users_sessions (Account Sessions 已存在，跳过)
-- 实际上 account_sessions 已经存在，不需要创建 users_sessions

-- 2. categories_hero_image (upload 字段表)
CREATE TABLE IF NOT EXISTS categories_hero_image (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  _parent_id uuid REFERENCES categories(id) ON DELETE CASCADE,
  _order integer,
  _created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  _updated_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  url text,
  alt text,
  mimeType text,
  filesize numeric,
  width numeric,
  height numeric,
  filename text,
  sizes jsonb,
  _uuid text
);

CREATE INDEX IF NOT EXISTS categories_hero_image_parent_idx ON categories_hero_image(_parent_id);

-- 3. homepage (Global)
CREATE TABLE IF NOT EXISTS homepage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  _created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  _updated_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  hero_heading text,
  hero_subheading text,
  hero_cta_link text,
  hero_cta_text text,
  featured_categories jsonb,
  seo_meta_title text,
  seo_meta_description text
);

-- 4. site_settings (Global)
CREATE TABLE IF NOT EXISTS site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  _created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  _updated_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  site_name text,
  site_logo jsonb,
  default_seo_title text,
  default_seo_description text,
  contact_email text,
  contact_phone text,
  social_links jsonb
);

-- 5. navigation (Global)
CREATE TABLE IF NOT EXISTS navigation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  _created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  _updated_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  main_navigation jsonb,
  footer_navigation jsonb,
  mobile_navigation jsonb
);

-- 插入默认 Global 记录
INSERT INTO homepage (id, _created_at, _updated_at) 
SELECT gen_random_uuid(), NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM homepage);

INSERT INTO site_settings (id, _created_at, _updated_at) 
SELECT gen_random_uuid(), NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM site_settings);

INSERT INTO navigation (id, _created_at, _updated_at) 
SELECT gen_random_uuid(), NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM navigation);
