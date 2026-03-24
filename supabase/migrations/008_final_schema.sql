-- 删除并重建表，包含所有字段
DROP TABLE IF EXISTS "categories" CASCADE;
DROP TABLE IF EXISTS "articles" CASCADE;

-- categories 表 - 完整结构
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
  "parent" text,
  "customFilterAttributes" jsonb DEFAULT '[]',
  "image" jsonb,
  "createdAt" timestamptz DEFAULT now(),
  "updatedAt" timestamptz DEFAULT now()
);

CREATE INDEX ON "categories" ("slug");

-- articles 表 - 完整结构
CREATE TABLE "articles" (
  "_id" text PRIMARY KEY,
  "title" text,
  "slug" text UNIQUE,
  "excerpt" text,
  "description" text,
  "content" jsonb,
  "category" text,
  "tags" jsonb DEFAULT '[]',
  "author" text,
  "status" text DEFAULT 'draft',
  "publishedAt" timestamptz,
  "relatedCategories" jsonb DEFAULT '[]',
  "seo" jsonb,
  "readingTime" integer,
  "quickAnswer" jsonb,
  "faq" jsonb DEFAULT '[]',
  "featuredImage" jsonb,
  "createdAt" timestamptz DEFAULT now(),
  "updatedAt" timestamptz DEFAULT now()
);

CREATE INDEX ON "articles" ("slug");

-- 启用 RLS
ALTER TABLE "categories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "articles" ENABLE ROW LEVEL SECURITY;

-- RLS 策略
CREATE POLICY "service_all" ON "categories" FOR ALL USING (true);
CREATE POLICY "service_all" ON "articles" FOR ALL USING (true);
