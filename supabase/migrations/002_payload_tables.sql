-- Payload CMS 基础表结构

-- users 表
CREATE TABLE IF NOT EXISTS "users" (
  "id" serial PRIMARY KEY,
  "email" text UNIQUE NOT NULL,
  "email_verified" boolean DEFAULT false,
  "name" text,
  "password" text,
  "salt" text,
  "reset_password_token" text,
  "reset_password_expiration" timestamptz,
  "lock_until" timestamptz,
  "login_attempts" integer DEFAULT 0,
  "created_at" timestamptz DEFAULT now(),
  "updated_at" timestamptz DEFAULT now()
);

-- create index
CREATE INDEX IF NOT EXISTS "users_email_idx" ON "users" ("email");
CREATE INDEX IF NOT EXISTS "users_reset_token_idx" ON "users" ("reset_password_token");

-- categories 表
CREATE TABLE IF NOT EXISTS "categories" (
  "id" serial PRIMARY KEY,
  "name" text,
  "slug" text,
  "description" text,
  "parent_id" integer,
  "display_order" integer DEFAULT 0,
  "image_url" text,
  "meta_title" text,
  "meta_description" text,
  "created_at" timestamptz DEFAULT now(),
  "updated_at" timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "categories_slug_idx" ON "categories" ("slug");

-- products 表
CREATE TABLE IF NOT EXISTS "products" (
  "id" serial PRIMARY KEY,
  "name" text,
  "slug" text,
  "description" text,
  "price" numeric,
  "category_id" integer,
  "images" jsonb DEFAULT '[]',
  "specifications" jsonb DEFAULT '{}',
  "status" text DEFAULT 'draft',
  "created_at" timestamptz DEFAULT now(),
  "updated_at" timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "products_slug_idx" ON "products" ("slug");
CREATE INDEX IF NOT EXISTS "products_category_idx" ON "products" ("category_id");
CREATE INDEX IF NOT EXISTS "products_status_idx" ON "products" ("status");

-- articles 表
CREATE TABLE IF NOT EXISTS "articles" (
  "id" serial PRIMARY KEY,
  "title" text,
  "slug" text,
  "content" jsonb,
  "status" text DEFAULT 'draft',
  "published_at" timestamptz,
  "created_at" timestamptz DEFAULT now(),
  "updated_at" timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "articles_slug_idx" ON "articles" ("slug");
CREATE INDEX IF NOT EXISTS "articles_status_idx" ON "articles" ("status");

-- orders 表
CREATE TABLE IF NOT EXISTS "orders" (
  "id" serial PRIMARY KEY,
  "order_number" text UNIQUE,
  "customer_email" text,
  "status" text DEFAULT 'pending',
  "total" numeric,
  "items" jsonb DEFAULT '[]',
  "created_at" timestamptz DEFAULT now(),
  "updated_at" timestamptz DEFAULT now()
);

-- quotes 表
CREATE TABLE IF NOT EXISTS "quotes" (
  "id" serial PRIMARY KEY,
  "quote_number" text UNIQUE,
  "customer_email" text,
  "status" text DEFAULT 'pending',
  "items" jsonb DEFAULT '[]',
  "notes" text,
  "created_at" timestamptz DEFAULT now(),
  "updated_at" timestamptz DEFAULT now()
);

-- payload_locked_documents 表 (Payload CMS 系统表)
CREATE TABLE IF NOT EXISTS "payload_locked_documents" (
  "id" serial PRIMARY KEY,
  "document_id" integer,
  "table_name" text,
  "lock_status" text DEFAULT 'locked',
  "created_at" timestamptz DEFAULT now()
);

-- payload_preferences 表
CREATE TABLE IF NOT EXISTS "payload_preferences" (
  "id" serial PRIMARY KEY,
  "key" text,
  "value" jsonb,
  "user_id" integer,
  "created_at" timestamptz DEFAULT now(),
  "updated_at" timestamptz DEFAULT now()
);

-- payload_migrations 表
CREATE TABLE IF NOT EXISTS "payload_migrations" (
  "id" serial PRIMARY KEY,
  "name" text,
  "batch" integer,
  "migration_time" timestamptz DEFAULT now()
);

-- 插入测试数据验证
INSERT INTO categories (name, slug) VALUES ('Safety Equipment', 'safety'), ('Tools', 'tools');
INSERT INTO products (name, slug, status) VALUES ('Safety Helmet', 'safety-helmet', 'published'), ('Power Drill', 'power-drill', 'published');
