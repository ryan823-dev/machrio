-- 启用 RLS 并创建策略
ALTER TABLE "categories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "products" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "articles" ENABLE ROW LEVEL SECURITY;

-- 为 service_role 创建策略
CREATE POLICY "service_role_all" ON "categories" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON "products" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON "articles" FOR ALL USING (true) WITH CHECK (true);
