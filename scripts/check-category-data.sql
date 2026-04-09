-- 检查有问题的分类数据
SELECT 
    id,
    slug,
    name,
    parent_id,
    CASE WHEN description IS NULL THEN 'NULL' ELSE 'NOT NULL' END as desc_status,
    CASE WHEN short_description IS NULL THEN 'NULL' ELSE 'NOT NULL' END as short_desc_status,
    CASE WHEN intro_content IS NULL THEN 'NULL' ELSE 'NOT NULL' END as intro_status,
    CASE WHEN buying_guide IS NULL THEN 'NULL' ELSE 'NOT NULL' END as guide_status,
    CASE WHEN faq IS NULL THEN 'NULL' ELSE 'NOT NULL' END as faq_status,
    CASE WHEN seo_content IS NULL THEN 'NULL' ELSE 'NOT NULL' END as seo_status
FROM categories 
WHERE slug IN ('instant-adhesives', 'construction-adhesives', 'wood-glues', 'safety', 'tape')
ORDER BY slug;
