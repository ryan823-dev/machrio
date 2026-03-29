# 检查分类是否存在

## 问题
访问 `https://machrio.com/category/cleaning-janitorial` 返回 404

## 可能的原因

1. **数据库中不存在这个 slug**
   - 需要检查 `categories` 表中是否有 `slug = 'cleaning-janitorial'`

2. **数据库连接问题**
   - 但 sitemap 能正常生成，说明连接正常

3. **分类被禁用或未发布**
   - 检查 `is_published` 或类似字段

## 解决方案

### 方法 1：在 Railway Dashboard 中检查数据库

1. 访问 Railway Dashboard
2. 进入 PostgreSQL 服务
3. 使用 SQL 查询：

```sql
-- 检查 cleaning-janitorial 分类是否存在
SELECT id, name, slug, is_published, display_order
FROM categories
WHERE slug = 'cleaning-janitorial';

-- 查看所有分类
SELECT id, name, slug, is_published, parent_id, display_order
FROM categories
ORDER BY display_order;

-- 检查是否有 cleaning 相关的分类
SELECT id, name, slug, is_published
FROM categories
WHERE name ILIKE '%cleaning%' OR slug ILIKE '%cleaning%';
```

### 方法 2：使用 DBeaver 连接数据库检查

1. 从 Railway 获取 DATABASE_URL
2. 在 DBeaver 中创建连接
3. 执行上述 SQL 查询

### 方法 3：在前台添加调试日志

在 `src/app/(frontend)/category/[slug]/page.tsx` 中添加：

```typescript
// 在 getCategoryData 函数中
console.log('[Category Page] Looking for slug:', slug)
console.log('[Category Page] Query result:', catResult.rows)
```

然后查看 Railway 日志。
