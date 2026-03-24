-- 删除旧表
DROP TABLE IF EXISTS "categories" CASCADE;
DROP TABLE IF EXISTS "products" CASCADE;
DROP TABLE IF EXISTS "articles" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;

-- categories 表 - 匹配 MongoDB 结构
CREATE TABLE "categories" (
  "_id" text PRIMARY KEY,
  "name" text,
  "slug" text UNIQUE,
  "description" jsonb,
  "shortDescription" text,
  "iconEmoji" text,
  "featured" boolean DEFAULT false,
  "displayOrder" integer DEFAULT 0,
  "faq" jsonb DEFAULT '[]',
  "facetGroups" jsonb DEFAULT '[]',
  "buyingGuide" jsonb,
  "introContent" jsonb,
  "seo" jsonb,
  "seoContent" jsonb,
  "parent_id" text,
  "image" jsonb,
  "createdAt" timestamptz DEFAULT now(),
  "updatedAt" timestamptz DEFAULT now()
);

CREATE INDEX ON "categories" ("slug");

-- articles 表 - 匹配 MongoDB 结构
CREATE TABLE "articles" (
  "_id" text PRIMARY KEY,
  "title" text,
  "slug" text UNIQUE,
  "description" text,
  "content" jsonb,
  "category" text,
  "tags" jsonb DEFAULT '[]',
  "featuredImage" jsonb,
  "author" text,
  "status" text DEFAULT 'draft',
  "publishedAt" timestamptz,
  "createdAt" timestamptz DEFAULT now(),
  "updatedAt" timestamptz DEFAULT now()
);

CREATE INDEX ON "articles" ("slug");

-- users 表
CREATE TABLE "users" (
  "_id" text PRIMARY KEY,
  "email" text UNIQUE NOT NULL,
  "email_verified" boolean DEFAULT false,
  "name" text,
  "password" text,
  "salt" text,
  "role" text DEFAULT 'customer',
  "reset_password_token" text,
  "reset_password_expiration" timestamptz,
  "createdAt" timestamptz DEFAULT now(),
  "updatedAt" timestamptz DEFAULT now()
);

CREATE INDEX ON "users" ("email");

-- products 表 - 匹配 MongoDB 结构
CREATE TABLE "products" (
  "_id" text PRIMARY KEY,
  "name" text,
  "slug" text UNIQUE,
  "description" jsonb,
  "shortDescription" text,
  "price" numeric,
  "prices" jsonb DEFAULT '[]',
  "tieredPricing" jsonb DEFAULT '[]',
  "category" text,
  "categories" jsonb DEFAULT '[]',
  "images" jsonb DEFAULT '[]',
  "specs" jsonb DEFAULT '{}',
  "specifications" jsonb DEFAULT '{}',
  "featuredImage" jsonb,
  "status" text DEFAULT 'draft',
  "tags" jsonb DEFAULT '[]',
  "moq" integer DEFAULT 1,
  "weight" numeric,
  "dimensions" jsonb,
  "meta_title" text,
  "meta_description" text,
  "createdAt" timestamptz DEFAULT now(),
  "updatedAt" timestamptz DEFAULT now()
);

CREATE INDEX ON "products" ("slug");

-- 启用 RLS
ALTER TABLE "categories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "articles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "products" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略
CREATE POLICY "service_all" ON "categories" FOR ALL USING (true);
CREATE POLICY "service_all" ON "articles" FOR ALL USING (true);
CREATE POLICY "service_all" ON "products" FOR ALL USING (true);
CREATE POLICY "service_all" ON "users" FOR ALL USING (true);
