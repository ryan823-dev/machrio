-- 修复 categories_faq 表缺失问题
-- Payload CMS array 字段在 PostgreSQL 中创建单独的表
-- 使用 _parent_id 作为外键列名（Payload CMS 命名约定）

-- 删除旧表（如果存在）
DROP TABLE IF EXISTS categories_faq CASCADE;

-- 创建 categories_faq 表用于存储 array 字段
CREATE TABLE categories_faq (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  _parent_id uuid REFERENCES categories(id) ON DELETE CASCADE,
  question text NOT NULL,
  answer text NOT NULL,
  _order integer,
  _created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  _updated_at timestamptz DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引以提高查询性能
CREATE INDEX categories_faq_parent_id_idx ON categories_faq(_parent_id);
CREATE INDEX categories_faq_order_idx ON categories_faq(_order);
