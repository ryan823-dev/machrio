-- 创建 exec 函数
CREATE OR REPLACE FUNCTION exec(query TEXT)
RETURNS TABLE(result TEXT) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
BEGIN
  RETURN QUERY EXECUTE query;
END;
$$;

-- 创建 machrio_users 表（测试用）
CREATE TABLE IF NOT EXISTS machrio_test (
  id SERIAL PRIMARY KEY,
  test_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 插入测试数据
INSERT INTO machrio_test (test_name) VALUES ('Machrio migration test');
