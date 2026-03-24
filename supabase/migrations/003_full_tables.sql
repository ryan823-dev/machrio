-- Machrio 表结构
DROP TABLE IF EXISTS "categories" CASCADE;
DROP TABLE IF EXISTS "products" CASCADE;
DROP TABLE IF EXISTS "articles" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;
DROP TABLE IF EXISTS "orders" CASCADE;
DROP TABLE IF EXISTS "quotes" CASCADE;

-- categories 表
CREATE TABLE "categories" (
  "id" serial PRIMARY KEY,
  "name" text,
  "slug" text UNIQUE,
  "description" text,
  "meta_title" text,
  "meta_description" text,
  "parent" integer,
  "displayOrder" integer DEFAULT 0,
  "image" text,
  "icon" text,
  "breadcrumbs" jsonb DEFAULT '[]',
  "BuyingGuide" text,
  "createdAt" timestamptz DEFAULT now(),
  "updatedAt" timestamptz DEFAULT now()
);

CREATE INDEX ON "categories" ("slug");
CREATE INDEX ON "categories" ("parent");

-- products 表
CREATE TABLE "products" (
  "id" serial PRIMARY KEY,
  "name" text,
  "slug" text UNIQUE,
  "description" jsonb,
  "content" jsonb,
  "meta_title" text,
  "meta_description" text,
  "price" numeric,
  "prices" jsonb DEFAULT '[]',
  "tieredPricing" jsonb DEFAULT '[]',
  "category" integer,
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
  "createdAt" timestamptz DEFAULT now(),
  "updatedAt" timestamptz DEFAULT now()
);

CREATE INDEX ON "products" ("slug");
CREATE INDEX ON "products" ("category");
CREATE INDEX ON "products" ("status");

-- articles 表
CREATE TABLE "articles" (
  "id" serial PRIMARY KEY,
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
CREATE INDEX ON "articles" ("status");

-- users 表
CREATE TABLE "users" (
  "id" serial PRIMARY KEY,
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

-- orders 表
CREATE TABLE "orders" (
  "id" serial PRIMARY KEY,
  "orderNumber" text,
  "customer" integer,
  "customerEmail" text,
  "status" text DEFAULT 'pending',
  "items" jsonb DEFAULT '[]',
  "total" numeric DEFAULT 0,
  "shippingAddress" jsonb,
  "billingAddress" jsonb,
  "paymentMethod" text,
  "paymentStatus" text DEFAULT 'pending',
  "createdAt" timestamptz DEFAULT now(),
  "updatedAt" timestamptz DEFAULT now()
);

CREATE INDEX ON "orders" ("orderNumber");
CREATE INDEX ON "orders" ("customer");

-- quotes 表
CREATE TABLE "quotes" (
  "id" serial PRIMARY KEY,
  "quoteNumber" text,
  "customer" integer,
  "customerEmail" text,
  "companyName" text,
  "status" text DEFAULT 'pending',
  "items" jsonb DEFAULT '[]',
  "notes" text,
  "validUntil" timestamptz,
  "createdAt" timestamptz DEFAULT now(),
  "updatedAt" timestamptz DEFAULT now()
);

CREATE INDEX ON "quotes" ("quoteNumber");
