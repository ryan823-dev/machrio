-- =============================================
-- Machrio B2B E-commerce - Database Schema
-- Supabase PostgreSQL
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- Categories
-- =============================================
CREATE TABLE IF NOT EXISTS "categories" (
  "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  "name" text NOT NULL,
  "slug" text UNIQUE NOT NULL,
  "description" text,
  "parent_id" uuid REFERENCES categories(id),
  "level" integer DEFAULT 1,
  "display_order" integer DEFAULT 0,
  "image" text,
  "icon" text,
  "meta_title" text,
  "meta_description" text,
  "buying_guide" jsonb,
  "created_at" timestamptz DEFAULT now(),
  "updated_at" timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "categories_slug_idx" ON "categories" ("slug");
CREATE INDEX IF NOT EXISTS "categories_parent_idx" ON "categories" ("parent_id");

-- =============================================
-- Products
-- =============================================
CREATE TABLE IF NOT EXISTS "products" (
  "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  "sku" text UNIQUE NOT NULL,
  "name" text NOT NULL,
  "short_description" text,
  "full_description" jsonb,
  "primary_category_id" uuid,
  "status" text DEFAULT 'draft',
  "availability" text DEFAULT 'contact',
  "purchase_mode" text DEFAULT 'both',
  "lead_time" text,
  "min_order_quantity" integer DEFAULT 1,
  "package_qty" integer,
  "package_unit" text,
  "weight" numeric,
  "pricing" jsonb,
  "specifications" jsonb DEFAULT '[]'::jsonb,
  "faq" jsonb DEFAULT '[]'::jsonb,
  "images" jsonb DEFAULT '[]'::jsonb,
  "external_image_url" text,
  "additional_image_urls" jsonb DEFAULT '[]'::jsonb,
  "categories" jsonb DEFAULT '[]'::jsonb,
  "tags" jsonb DEFAULT '[]'::jsonb,
  "meta_title" text,
  "meta_description" text,
  "focus_keyword" text,
  "source_url" text,
  "shipping_info" jsonb,
  "created_at" timestamptz DEFAULT now(),
  "updated_at" timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "products_sku_idx" ON "products" ("sku");
CREATE INDEX IF NOT EXISTS "products_status_idx" ON "products" ("status");

-- =============================================
-- Articles
-- =============================================
CREATE TABLE IF NOT EXISTS "articles" (
  "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  "title" text NOT NULL,
  "slug" text UNIQUE NOT NULL,
  "description" text,
  "content" jsonb,
  "category" text,
  "tags" jsonb DEFAULT '[]'::jsonb,
  "featured_image" text,
  "author" text,
  "status" text DEFAULT 'draft',
  "published_at" timestamptz,
  "meta_title" text,
  "meta_description" text,
  "created_at" timestamptz DEFAULT now(),
  "updated_at" timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "articles_slug_idx" ON "articles" ("slug");
CREATE INDEX IF NOT EXISTS "articles_status_idx" ON "articles" ("status");

-- =============================================
-- Brands
-- =============================================
CREATE TABLE IF NOT EXISTS "brands" (
  "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  "name" text UNIQUE NOT NULL,
  "slug" text UNIQUE,
  "description" text,
  "logo" text,
  "website" text,
  "created_at" timestamptz DEFAULT now(),
  "updated_at" timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "brands_slug_idx" ON "brands" ("slug");

-- =============================================
-- Comments
-- =============================================
COMMENT ON TABLE "categories" IS 'Product categories (L1/L2/L3 hierarchy)';
COMMENT ON TABLE "products" IS 'Product catalog';
COMMENT ON TABLE "articles" IS 'Knowledge center articles';
COMMENT ON TABLE "brands" IS 'Product brands';
