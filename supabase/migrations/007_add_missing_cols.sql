-- 添加缺失的列
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "parent" text;
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "image" jsonb;
ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "excerpt" text;
ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "publishedAt" timestamptz;
