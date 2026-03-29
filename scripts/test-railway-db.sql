-- 在 Railway PostgreSQL 上运行这个 SQL 检查 orders 表

-- 1. 检查 orders 表是否存在
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'orders'
        ) 
        THEN '✅ orders table exists'
        ELSE '❌ orders table MISSING - needs to be created'
    END AS table_check;

-- 2. 如果表存在，检查结构
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'orders'
ORDER BY ordinal_position;

-- 3. 检查最近的订单
SELECT 
    order_number,
    customer_email,
    status,
    payment_status,
    total,
    created_at
FROM orders
ORDER BY created_at DESC
LIMIT 5;
