-- 检查 surface-protection-tape 分类的层级信息
SELECT 
  id,
  name,
  slug,
  level,
  parent_id,
  display_order
FROM categories 
WHERE slug IN ('surface-protection-tape', 'tape', 'adhesives-sealants-and-tape', 'electrical')
ORDER BY level, slug;
