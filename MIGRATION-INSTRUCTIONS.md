# MongoDB → Supabase 数据库迁移说明

## 当前状态

✅ **已完成**:
- 批量上传错误已修复
- 迁移脚本已创建
- Supabase REST API 连接正常

⚠️ **需要手动操作**:
- 在 Supabase Dashboard 执行一次 SQL 创建表结构

## 为什么需要手动创建表？

Supabase 的 REST API 不支持直接执行 CREATE TABLE 语句。这是 Supabase 的安全限制。
直接 PostgreSQL 连接在当前网络环境下不可用。

## 迁移步骤

### 步骤 1: 创建数据库表（手动，仅需一次）

1. 打开 Supabase Dashboard:
   https://supabase.com/dashboard/project/yderhgkjcsaqrsfntpqm/sql/new

2. 复制并执行以下 SQL（或者使用文件 `supabase/quick-create.sql`）:

```sql
-- 启用 UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 分类表
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  parent_id uuid REFERENCES categories(id),
  level integer DEFAULT 1,
  display_order integer DEFAULT 0,
  image text,
  icon text,
  meta_title text,
  meta_description text,
  buying_guide jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 产品表
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  sku text UNIQUE NOT NULL,
  name text NOT NULL,
  short_description text,
  full_description jsonb,
  primary_category_id uuid,
  status text DEFAULT 'draft',
  availability text DEFAULT 'contact',
  purchase_mode text DEFAULT 'both',
  lead_time text,
  min_order_quantity integer DEFAULT 1,
  package_qty integer,
  package_unit text,
  weight numeric,
  pricing jsonb,
  specifications jsonb DEFAULT '[]'::jsonb,
  faq jsonb DEFAULT '[]'::jsonb,
  images jsonb DEFAULT '[]'::jsonb,
  external_image_url text,
  additional_image_urls jsonb DEFAULT '[]'::jsonb,
  categories jsonb DEFAULT '[]'::jsonb,
  tags jsonb DEFAULT '[]'::jsonb,
  meta_title text,
  meta_description text,
  focus_keyword text,
  source_url text,
  shipping_info jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 文章表
CREATE TABLE IF NOT EXISTS articles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  content jsonb,
  category text,
  tags jsonb DEFAULT '[]'::jsonb,
  featured_image text,
  author text,
  status text DEFAULT 'draft',
  published_at timestamptz,
  meta_title text,
  meta_description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 品牌表
CREATE TABLE IF NOT EXISTS brands (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text UNIQUE NOT NULL,
  slug text UNIQUE,
  description text,
  logo text,
  website text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS categories_slug_idx ON categories (slug);
CREATE INDEX IF NOT EXISTS categories_parent_idx ON categories (parent_id);
CREATE INDEX IF NOT EXISTS products_sku_idx ON products (sku);
CREATE INDEX IF NOT EXISTS products_status_idx ON products (status);
CREATE INDEX IF NOT EXISTS articles_slug_idx ON articles (slug);
CREATE INDEX IF NOT EXISTS articles_status_idx ON articles (status);
CREATE INDEX IF NOT EXISTS brands_slug_idx ON brands (slug);
```

3. 点击 "Run" 执行 SQL

### 步骤 2: 执行数据迁移（自动）

在终端执行:

```bash
cd machrio
node scripts/rest-migrate.cjs
```

迁移脚本会:
- 连接 MongoDB 读取数据 (635 个分类，9221 个产品，33 个文章，1 个品牌)
- 转换数据格式 (ObjectId→UUID, camelCase→snake_case)
- 批量插入 Supabase
- 显示迁移进度和结果

### 步骤 3: 验证和切换

1. 验证数据：https://supabase.com/dashboard/project/yderhgkjcsaqrsfntpqm/editor

2. 确保 `.env.local` 配置正确:
   ```
   USE_POSTGRES=1
   DATABASE_URI=postgresql://postgres:qgvPF1YbGso3swVy@db.uvbzobhfpjbcggspassa.supabase.co:5432/postgres
   ```

3. 重启开发服务器并测试网站功能

## 预期结果

- ✅ categories: 635 条记录
- ✅ products: 9221 条记录
- ✅ articles: 33 条记录
- ✅ brands: 1 条记录

## 故障排除

### 问题：迁移脚本报错 "table does not exist"
**解决**: 先执行步骤 1 创建表

### 问题：数据插入失败
**解决**: 检查 Supabase Dashboard 中的表结构是否正确创建

### 问题：连接超时
**解决**: 检查网络连接，确保可以访问 Supabase

## 完成后的下一步

迁移完成后:
1. 测试网站的所有功能
2. 确认产品列表、分类浏览正常
3. 测试批量上传功能
4. 验证订单和报价功能
