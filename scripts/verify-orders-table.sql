-- 检查 orders 表是否存在
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'orders'
) AS orders_table_exists;

-- 检查 orders 表结构
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'orders'
ORDER BY ordinal_position;

-- 检查最近的订单
SELECT order_number, customer_email, status, payment_status, total, created_at
FROM orders
ORDER BY created_at DESC
LIMIT 5;

-- 检查是否有测试订单需要清理
SELECT COUNT(*) as test_orders_count
FROM orders
WHERE order_number LIKE 'TEST-%';
