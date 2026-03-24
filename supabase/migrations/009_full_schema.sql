-- =============================================
-- Machrio B2B E-commerce - Full Database Schema
-- PostgreSQL (Supabase)
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- Users & Authentication
-- =============================================

CREATE TABLE IF NOT EXISTS "users" (
  "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  "email" text UNIQUE NOT NULL,
  "password" text,
  "salt" text,
  "name" text,
  "role" text DEFAULT 'customer', -- customer, admin
  "email_verified" boolean DEFAULT false,
  "reset_password_token" text,
  "reset_password_expiration" timestamptz,
  "created_at" timestamptz DEFAULT now(),
  "updated_at" timestamptz DEFAULT now()
);

CREATE INDEX ON "users" ("email");
CREATE INDEX ON "users" ("role");

-- =============================================
-- Categories (Hierarchical)
-- =============================================

CREATE TABLE IF NOT EXISTS "categories" (
  "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  "name" text NOT NULL,
  "slug" text UNIQUE NOT NULL,
  "description" text,
  "parent_id" uuid REFERENCES "categories"("id") ON DELETE CASCADE,
  "level" integer DEFAULT 1, -- 1=L1, 2=L2, 3=L3
  "display_order" integer DEFAULT 0,
  "image" text,
  "icon" text,
  "meta_title" text,
  "meta_description" text,
  "buying_guide" jsonb,
  "created_at" timestamptz DEFAULT now(),
  "updated_at" timestamptz DEFAULT now()
);

CREATE INDEX ON "categories" ("slug");
CREATE INDEX ON "categories" ("parent_id");
CREATE INDEX ON "categories" ("level");

-- =============================================
-- Products
-- =============================================

CREATE TABLE IF NOT EXISTS "products" (
  "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  "sku" text UNIQUE NOT NULL,
  "name" text NOT NULL,
  "short_description" text,
  "full_description" jsonb, -- Lexical rich text
  "primary_category_id" uuid REFERENCES "categories"("id"),
  "brand_id" uuid,
  "status" text DEFAULT 'draft', -- draft, published, discontinued
  "availability" text DEFAULT 'contact', -- in_stock, made_to_order, contact
  "purchase_mode" text DEFAULT 'both', -- both, buy_online, rfq_only
  "lead_time" text,
  "min_order_quantity" integer DEFAULT 1,
  "package_qty" integer,
  "package_unit" text,
  "weight" numeric,
  "pricing" jsonb, -- { currency, priceUnit, basePrice, costPrice }
  "specifications" jsonb DEFAULT '[]', -- [{ label, value }]
  "faq" jsonb DEFAULT '[]', -- [{ question, answer }]
  "images" jsonb DEFAULT '[]', -- legacy
  "external_image_url" text,
  "additional_image_urls" jsonb DEFAULT '[]',
  "categories" jsonb DEFAULT '[]', -- category IDs array
  "tags" jsonb DEFAULT '[]',
  "meta_title" text,
  "meta_description" text,
  "focus_keyword" text,
  "source_url" text,
  "shipping_info" jsonb,
  "created_at" timestamptz DEFAULT now(),
  "updated_at" timestamptz DEFAULT now()
);

CREATE INDEX ON "products" ("sku");
CREATE INDEX ON "products" ("slug");
CREATE INDEX ON "products" ("status");
CREATE INDEX ON "products" ("primary_category_id");
CREATE INDEX ON "products" USING GIN ("categories");

-- =============================================
-- Product-Category Many-to-Many
-- =============================================

CREATE TABLE IF NOT EXISTS "product_categories" (
  "product_id" uuid REFERENCES "products"("id") ON DELETE CASCADE,
  "category_id" uuid REFERENCES "categories"("id") ON DELETE CASCADE,
  "is_primary" boolean DEFAULT false,
  PRIMARY KEY ("product_id", "category_id")
);

CREATE INDEX ON "product_categories" ("product_id");
CREATE INDEX ON "product_categories" ("category_id");

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

CREATE INDEX ON "brands" ("slug");

-- =============================================
-- Orders
-- =============================================

CREATE TABLE IF NOT EXISTS "orders" (
  "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  "order_number" text UNIQUE NOT NULL,
  "customer_id" uuid REFERENCES "users"("id"),
  "customer_email" text NOT NULL,
  "status" text DEFAULT 'pending', -- pending, confirmed, processing, shipped, completed, cancelled
  "items" jsonb DEFAULT '[]',
  "subtotal" numeric DEFAULT 0,
  "shipping_cost" numeric DEFAULT 0,
  "tax" numeric DEFAULT 0,
  "total" numeric DEFAULT 0,
  "currency" text DEFAULT 'USD',
  "shipping_address" jsonb,
  "billing_address" jsonb,
  "payment_method" text,
  "payment_status" text DEFAULT 'pending',
  "tracking_number" text,
  "notes" text,
  "created_at" timestamptz DEFAULT now(),
  "updated_at" timestamptz DEFAULT now()
);

CREATE INDEX ON "orders" ("order_number");
CREATE INDEX ON "orders" ("customer_id");
CREATE INDEX ON "orders" ("status");
CREATE INDEX ON "orders" ("created_at");

-- =============================================
-- Quotes (RFQ)
-- =============================================

CREATE TABLE IF NOT EXISTS "quotes" (
  "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  "quote_number" text UNIQUE NOT NULL,
  "customer_id" uuid REFERENCES "users"("id"),
  "customer_email" text NOT NULL,
  "company_name" text,
  "status" text DEFAULT 'pending', -- pending, sent, negotiated, accepted, rejected
  "items" jsonb DEFAULT '[]',
  "subtotal" numeric DEFAULT 0,
  "total" numeric DEFAULT 0,
  "currency" text DEFAULT 'USD',
  "notes" text,
  "valid_until" timestamptz,
  "created_at" timestamptz DEFAULT now(),
  "updated_at" timestamptz DEFAULT now()
);

CREATE INDEX ON "quotes" ("quote_number");
CREATE INDEX ON "quotes" ("customer_id");
CREATE INDEX ON "quotes" ("status");

-- =============================================
-- Customers
-- =============================================

CREATE TABLE IF NOT EXISTS "customers" (
  "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  "user_id" uuid REFERENCES "users"("id"),
  "company_name" text,
  "contact_person" text,
  "phone" text,
  "country" text,
  "city" text,
  "address" text,
  "postal_code" text,
  "tax_id" text,
  "created_at" timestamptz DEFAULT now(),
  "updated_at" timestamptz DEFAULT now()
);

CREATE INDEX ON "customers" ("user_id");
CREATE INDEX ON "customers" ("company_name");

-- =============================================
-- Articles (Knowledge Center)
-- =============================================

CREATE TABLE IF NOT EXISTS "articles" (
  "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  "title" text NOT NULL,
  "slug" text UNIQUE NOT NULL,
  "description" text,
  "content" jsonb, -- Lexical rich text
  "category" text,
  "tags" jsonb DEFAULT '[]',
  "featured_image" text,
  "author" text,
  "status" text DEFAULT 'draft', -- draft, published
  "published_at" timestamptz,
  "meta_title" text,
  "meta_description" text,
  "created_at" timestamptz DEFAULT now(),
  "updated_at" timestamptz DEFAULT now()
);

CREATE INDEX ON "articles" ("slug");
CREATE INDEX ON "articles" ("status");
CREATE INDEX ON "articles" ("published_at");

-- =============================================
-- Pages (Static Pages)
-- =============================================

CREATE TABLE IF NOT EXISTS "pages" (
  "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  "title" text NOT NULL,
  "slug" text UNIQUE NOT NULL,
  "content" jsonb, -- Lexical rich text
  "meta_title" text,
  "meta_description" text,
  "status" text DEFAULT 'draft',
  "created_at" timestamptz DEFAULT now(),
  "updated_at" timestamptz DEFAULT now()
);

CREATE INDEX ON "pages" ("slug");
CREATE INDEX ON "pages" ("status");

-- =============================================
-- Industries
-- =============================================

CREATE TABLE IF NOT EXISTS "industries" (
  "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  "name" text NOT NULL,
  "slug" text UNIQUE NOT NULL,
  "description" text,
  "icon" text,
  "featured_image" text,
  "created_at" timestamptz DEFAULT now(),
  "updated_at" timestamptz DEFAULT now()
);

CREATE INDEX ON "industries" ("slug");

-- =============================================
-- Redirects (301/302)
-- =============================================

CREATE TABLE IF NOT EXISTS "redirects" (
  "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  "from" text UNIQUE NOT NULL,
  "to" text NOT NULL,
  "type" integer DEFAULT 301, -- 301 or 302
  "created_at" timestamptz DEFAULT now()
);

CREATE INDEX ON "redirects" ("from");

-- =============================================
-- Glossary Terms
-- =============================================

CREATE TABLE IF NOT EXISTS "glossary_terms" (
  "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  "term" text NOT NULL,
  "slug" text UNIQUE NOT NULL,
  "definition" text NOT NULL,
  "related_terms" jsonb DEFAULT '[]',
  "created_at" timestamptz DEFAULT now(),
  "updated_at" timestamptz DEFAULT now()
);

CREATE INDEX ON "glossary_terms" ("slug");
CREATE INDEX ON "glossary_terms" ("term");

-- =============================================
-- RFQ Submissions
-- =============================================

CREATE TABLE IF NOT EXISTS "rfq_submissions" (
  "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  "name" text NOT NULL,
  "email" text NOT NULL,
  "company" text,
  "phone" text,
  "country" text,
  "message" text,
  "product_interest" jsonb,
  "created_at" timestamptz DEFAULT now()
);

CREATE INDEX ON "rfq_submissions" ("email");
CREATE INDEX ON "rfq_submissions" ("created_at");

-- =============================================
-- Contact Submissions
-- =============================================

CREATE TABLE IF NOT EXISTS "contact_submissions" (
  "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  "name" text NOT NULL,
  "email" text NOT NULL,
  "company" text,
  "subject" text,
  "message" text NOT NULL,
  "created_at" timestamptz DEFAULT now()
);

CREATE INDEX ON "contact_submissions" ("email");
CREATE INDEX ON "contact_submissions" ("created_at");

-- =============================================
-- Shipping Methods
-- =============================================

CREATE TABLE IF NOT EXISTS "shipping_methods" (
  "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  "name" text NOT NULL,
  "code" text UNIQUE NOT NULL,
  "description" text,
  "icon" text,
  "is_active" boolean DEFAULT true,
  "created_at" timestamptz DEFAULT now(),
  "updated_at" timestamptz DEFAULT now()
);

CREATE INDEX ON "shipping_methods" ("code");

-- =============================================
-- Shipping Rates
-- =============================================

CREATE TABLE IF NOT EXISTS "shipping_rates" (
  "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  "method_id" uuid REFERENCES "shipping_methods"("id"),
  "country" text NOT NULL,
  "region" text,
  "min_weight" numeric DEFAULT 0,
  "max_weight" numeric,
  "min_volume" numeric DEFAULT 0,
  "max_volume" numeric,
  "base_rate" numeric DEFAULT 0,
  "rate_per_kg" numeric DEFAULT 0,
  "currency" text DEFAULT 'USD',
  "created_at" timestamptz DEFAULT now(),
  "updated_at" timestamptz DEFAULT now()
);

CREATE INDEX ON "shipping_rates" ("method_id");
CREATE INDEX ON "shipping_rates" ("country");

-- =============================================
-- Free Shipping Rules
-- =============================================

CREATE TABLE IF NOT EXISTS "free_shipping_rules" (
  "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  "country" text NOT NULL,
  "min_order_amount" numeric NOT NULL,
  "currency" text DEFAULT 'USD',
  "method_id" uuid REFERENCES "shipping_methods"("id"),
  "is_active" boolean DEFAULT true,
  "created_at" timestamptz DEFAULT now(),
  "updated_at" timestamptz DEFAULT now()
);

CREATE INDEX ON "free_shipping_rules" ("country");

-- =============================================
-- Bank Accounts
-- =============================================

CREATE TABLE IF NOT EXISTS "bank_accounts" (
  "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  "country" text NOT NULL, -- US, HK, DE, AE
  "bank_name" text NOT NULL,
  "account_name" text NOT NULL,
  "account_number" text,
  "swift_code" text,
  "routing_number" text, -- US only
  "iban" text, -- EU only
  "sort_code" text, -- UK only
  "bank_address" text,
  "created_at" timestamptz DEFAULT now(),
  "updated_at" timestamptz DEFAULT now()
);

CREATE INDEX ON "bank_accounts" ("country");

-- =============================================
-- Verification Codes
-- =============================================

CREATE TABLE IF NOT EXISTS "verification_codes" (
  "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  "email" text NOT NULL,
  "code" text NOT NULL,
  "type" text NOT NULL, -- email_verification, password_reset
  "expires_at" timestamptz NOT NULL,
  "used" boolean DEFAULT false,
  "created_at" timestamptz DEFAULT now()
);

CREATE INDEX ON "verification_codes" ("email");
CREATE INDEX ON "verification_codes" ("code");
CREATE INDEX ON "verification_codes" ("expires_at");

-- =============================================
-- Account Sessions
-- =============================================

CREATE TABLE IF NOT EXISTS "account_sessions" (
  "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  "user_id" uuid REFERENCES "users"("id") ON DELETE CASCADE,
  "token" text UNIQUE NOT NULL,
  "ip_address" text,
  "user_agent" text,
  "expires_at" timestamptz NOT NULL,
  "created_at" timestamptz DEFAULT now()
);

CREATE INDEX ON "account_sessions" ("user_id");
CREATE INDEX ON "account_sessions" ("token");
CREATE INDEX ON "account_sessions" ("expires_at");

-- =============================================
-- Product Views (Analytics)
-- =============================================

CREATE TABLE IF NOT EXISTS "product_views" (
  "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  "product_id" uuid REFERENCES "products"("id") ON DELETE CASCADE,
  "session_id" text,
  "user_id" uuid,
  "viewed_at" timestamptz DEFAULT now(),
  "referrer" text,
  "country" text
);

CREATE INDEX ON "product_views" ("product_id");
CREATE INDEX ON "product_views" ("viewed_at");
CREATE INDEX ON "product_views" ("session_id");

-- =============================================
-- Payload Preferences (CMS internal)
-- =============================================

CREATE TABLE IF NOT EXISTS "payload_preferences" (
  "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  "key" text UNIQUE,
  "value" jsonb,
  "created_at" timestamptz DEFAULT now(),
  "updated_at" timestamptz DEFAULT now()
);

CREATE INDEX ON "payload_preferences" ("key");

-- =============================================
-- Navigation (Global)
-- =============================================

CREATE TABLE IF NOT EXISTS "navigations" (
  "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  "key" text UNIQUE NOT NULL, -- main_nav, footer_nav, etc.
  "items" jsonb DEFAULT '[]',
  "created_at" timestamptz DEFAULT now(),
  "updated_at" timestamptz DEFAULT now()
);

CREATE INDEX ON "navigations" ("key");

-- =============================================
-- Site Settings (Global)
-- =============================================

CREATE TABLE IF NOT EXISTS "site_settings" (
  "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  "site_name" text,
  "site_description" text,
  "logo" text,
  "favicon" text,
  "contact_email" text,
  "contact_phone" text,
  "address" text,
  "social_links" jsonb DEFAULT '{}',
  "seo_settings" jsonb DEFAULT '{}',
  "created_at" timestamptz DEFAULT now(),
  "updated_at" timestamptz DEFAULT now()
);

-- =============================================
-- Homepage (Global)
-- =============================================

CREATE TABLE IF NOT EXISTS "homepages" (
  "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  "hero_section" jsonb,
  "featured_categories" jsonb DEFAULT '[]',
  "featured_products" jsonb DEFAULT '[]',
  "industry_section" jsonb,
  "content_blocks" jsonb DEFAULT '[]',
  "created_at" timestamptz DEFAULT now(),
  "updated_at" timestamptz DEFAULT now()
);

-- =============================================
-- Insert Default Data
-- =============================================

-- Default site settings
INSERT INTO "site_settings" ("id", "site_name", "site_description", "contact_email")
VALUES (uuid_generate_v4(), 'Machrio', 'B2B Industrial Equipment & Supplies', 'sales@machrio.com')
ON CONFLICT DO NOTHING;

-- Default navigation
INSERT INTO "navigations" ("id", "key", "items")
VALUES (
  uuid_generate_v4(),
  'main_nav',
  '[{"label": "Products", "type": "link", "href": "/products"}, {"label": "Industries", "type": "link", "href": "/industries"}, {"label": "Knowledge Center", "type": "link", "href": "/knowledge-center"}]'
)
ON CONFLICT DO NOTHING;

-- =============================================
-- Comments
-- =============================================

COMMENT ON TABLE "products" IS 'Product catalog with hierarchical categories';
COMMENT ON TABLE "categories" IS 'Hierarchical product categories (L1/L2/L3)';
COMMENT ON TABLE "orders" IS 'Customer orders with payment and shipping info';
COMMENT ON TABLE "quotes" IS 'Request for Quote (RFQ) submissions';
COMMENT ON TABLE "articles" IS 'Knowledge center articles and guides';
