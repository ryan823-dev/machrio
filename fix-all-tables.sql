-- 修复所有缺失的 Payload CMS array 字段表
-- 使用 Payload CMS 命名约定：{collection}_{field}，外键为 _parent_id

-- 1. categories_faq (已存在，但重新创建以确保结构正确)
DROP TABLE IF EXISTS categories_faq CASCADE;
CREATE TABLE categories_faq (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  _parent_id uuid REFERENCES categories(id) ON DELETE CASCADE,
  question text NOT NULL,
  answer text NOT NULL,
  _order integer,
  _created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  _updated_at timestamptz DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX categories_faq_parent_id_idx ON categories_faq(_parent_id);
CREATE INDEX categories_faq_order_idx ON categories_faq(_order);

-- 2. categories_facet_groups
DROP TABLE IF EXISTS categories_facet_groups CASCADE;
CREATE TABLE categories_facet_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  _parent_id uuid REFERENCES categories(id) ON DELETE CASCADE,
  facet_name text NOT NULL,
  expanded boolean DEFAULT false,
  _order integer,
  _created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  _updated_at timestamptz DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX categories_facet_groups_parent_id_idx ON categories_facet_groups(_parent_id);
CREATE INDEX categories_facet_groups_order_idx ON categories_facet_groups(_order);

-- 3. categories_custom_filter_attributes
DROP TABLE IF EXISTS categories_custom_filter_attributes CASCADE;
CREATE TABLE categories_custom_filter_attributes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  _parent_id uuid REFERENCES categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  key text NOT NULL,
  display_order integer DEFAULT 0,
  _order integer,
  _created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  _updated_at timestamptz DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX categories_custom_filter_attributes_parent_id_idx ON categories_custom_filter_attributes(_parent_id);
CREATE INDEX categories_custom_filter_attributes_order_idx ON categories_custom_filter_attributes(_order);

-- 4. products_specifications
DROP TABLE IF EXISTS products_specifications CASCADE;
CREATE TABLE products_specifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  _parent_id uuid REFERENCES products(id) ON DELETE CASCADE,
  label text NOT NULL,
  value text NOT NULL,
  _order integer,
  _created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  _updated_at timestamptz DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX products_specifications_parent_id_idx ON products_specifications(_parent_id);
CREATE INDEX products_specifications_order_idx ON products_specifications(_order);

-- 5. products_faq
DROP TABLE IF EXISTS products_faq CASCADE;
CREATE TABLE products_faq (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  _parent_id uuid REFERENCES products(id) ON DELETE CASCADE,
  question text NOT NULL,
  answer text NOT NULL,
  _order integer,
  _created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  _updated_at timestamptz DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX products_faq_parent_id_idx ON products_faq(_parent_id);
CREATE INDEX products_faq_order_idx ON products_faq(_order);

-- 6. products_tiered_pricing
DROP TABLE IF EXISTS products_tiered_pricing CASCADE;
CREATE TABLE products_tiered_pricing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  _parent_id uuid REFERENCES products(id) ON DELETE CASCADE,
  min_qty integer,
  max_qty integer,
  unit_price numeric,
  _order integer,
  _created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  _updated_at timestamptz DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX products_tiered_pricing_parent_id_idx ON products_tiered_pricing(_parent_id);
CREATE INDEX products_tiered_pricing_order_idx ON products_tiered_pricing(_order);
