-- 1. 检查 L1 分类（31个）
SELECT id, name, slug, display_order
FROM categories
WHERE parent_id IS NULL
ORDER BY display_order NULLS LAST, name;

-- 2. 检查 L2 分类数量
SELECT COUNT(*) as l2_count
FROM categories c1
WHERE parent_id IS NOT NULL
AND EXISTS (SELECT 1 FROM categories c2 WHERE c2.parent_id = c1.id);

-- 3. 检查 L3 分类数量（叶子分类）
SELECT COUNT(*) as l3_count
FROM categories c1
WHERE parent_id IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM categories c2 WHERE c2.parent_id = c1.id);

-- 4. 检查产品数量和分类关联
SELECT
  COUNT(*) as total_products,
  SUM(CASE WHEN primary_category_id IS NOT NULL THEN 1 ELSE 0 END) as with_category,
  SUM(CASE WHEN primary_category_id IS NULL THEN 1 ELSE 0 END) as without_category
FROM products;

-- 5. 检查示例 L2 分类（前10个）
SELECT c.id, c.name, c.slug, p.name as parent_name
FROM categories c
JOIN categories p ON c.parent_id = p.id
WHERE c.id IN (
  SELECT parent_id FROM categories WHERE parent_id IS NOT NULL GROUP BY parent_id
)
ORDER BY p.name, c.name
LIMIT 10;

-- 6. 检查示例 L3 分类（前20个，有产品的）
SELECT c.id, c.name, c.slug, p.name as parent_name,
       (SELECT COUNT(*) FROM products WHERE primary_category_id = c.id) as product_count
FROM categories c
JOIN categories p ON c.parent_id = p.id
WHERE c.id NOT IN (
  SELECT parent_id FROM categories WHERE parent_id IS NOT NULL
)
ORDER BY product_count DESC
LIMIT 20;

-- 7. 检查 products 表关键列
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'products'
AND column_name IN ('id', 'slug', 'name', 'sku', 'status', 'primary_category_id');
