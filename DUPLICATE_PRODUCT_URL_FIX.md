# 产品重复 URL 问题修复方案

## 📊 问题分析

### 当前状况

- **总产品数**: 9,146 个
- **无分类产品**: 274 个（旧版本）
- **有分类产品**: 8,872 个（新版本）

### 问题表现

**旧产品 URL（有问题）**:
```
/product/lab-brush-with-plastic-handle-h-8247
- 没有分类路径
- URL 结构不清晰
- 早期创建的产品
```

**新产品 URL（正确）**:
```
/product/lab-supplies/lab-brush-with-plastic-handle-h-8247
- 包含分类路径
- URL 规范清晰
- 后来重新上架的版本
```

### 根本原因

1. **历史遗留**: 早期产品没有强制要求关联分类
2. **重新上架流程**: 产品重新上架时创建了新的有分类版本，但旧版本未删除
3. **缺少重定向**: 旧 URL 没有 301 重定向到新 URL，导致 404 或内容重复

---

## ✅ 解决方案

### 阶段 1: 识别和映射（已完成 ✓）

已识别出 274 个无分类的旧产品。

**示例数据**:
```json
{
  "old_product": {
    "_id": "69a2f7388f9bd9b91fc93df1",
    "sku": "MACH-8247",
    "slug": "lab-brush-with-plastic-handle-bristle-material-for-cleaning-pkg-qty-24-h-8247",
    "name": "Lab Brush with Plastic Handle...",
    "primaryCategory": null
  }
}
```

### 阶段 2: 生成 301 重定向规则

#### 方案 A: 自动匹配分类（推荐）

根据产品名称自动匹配最相关的分类：

```typescript
// 关键词匹配逻辑
const categoryKeywords = {
  'brush': 'lab-supplies',
  'tube': 'lab-supplies',
  'cleaning': 'cleaning-and-janitorial',
  'test': 'lab-supplies',
  // ... 更多关键词
}
```

**优点**:
- 快速处理大量产品
- 一致性高

**缺点**:
- 可能需要人工审查匹配结果

#### 方案 B: 手动指定分类

对于无法自动匹配的产品，手动指定分类。

### 阶段 3: 实施步骤

#### 步骤 1: 创建分类映射表

创建文件 `scripts/category-mapping.json`:

```json
[
  {
    "oldProductId": "69a2f7388f9bd9b91fc93df1",
    "oldSlug": "lab-brush-with-plastic-handle-h-8247",
    "newCategoryId": "6123456789abcdef",
    "newCategorySlug": "lab-supplies",
    "action": "update_and_redirect"
  }
]
```

#### 步骤 2: 更新旧产品添加分类

MongoDB 脚本 `scripts/update-old-products.js`:

```javascript
// 为旧产品添加分类（不删除，先更新）
db.products.updateOne(
  { _id: "69a2f7388f9bd9b91fc93df1" },
  { 
    $set: { 
      primaryCategory: "6123456789abcdef",
      updatedAt: new Date(),
      _migrationStatus: 'category_added'
    } 
  }
)
```

#### 步骤 3: 生成 301 重定向规则

由于产品已经在数据库中，URL 会自动变为 `/product/{category}/{slug}`。

但是，为了处理可能的旧书签和搜索引擎索引，我们需要添加通配符重定向：

在 `next.config.mjs` 中添加：

```typescript
async redirects() {
  return [
    // 处理可能存在的旧 URL 格式
    {
      source: '/product/:slug(.*?)-h-:num(\\d+)',
      destination: '/product/lab-supplies/:slug-h-:num',
      permanent: true,
    },
    // 更多具体产品的重定向...
  ]
}
```

#### 步骤 4: 清理重复数据

**重要**: 只有在确认新 URL 正常工作后才能执行！

```javascript
// 删除标记为已迁移的旧版本
db.products.deleteMany({
  _migrationStatus: 'category_added',
  _status: 'published'
})
```

---

## 🛠️ 实施计划

### 第 1 步：自动分类匹配（1-2 小时）

运行自动匹配脚本：

```bash
cd machrio
npx tsx scripts/fix-no-category-products.ts
```

输出：
- `output/no-category-products-report.json` - 详细报告
- `output/update-categories-mongo.js` - MongoDB 更新脚本

### 第 2 步：审查匹配结果（30 分钟）

检查生成的报告，确认：
- 自动匹配的分类是否正确
- 需要手动指定的产品列表

### 第 3 步：执行数据库更新（10 分钟）

**⚠️ 警告：务必备份数据库！**

```bash
# 备份数据库
mongodump --uri="你的 MongoDB URI" --out=./backup-$(date +%Y%m%d)

# 执行更新
mongo < output/update-categories-mongo.js
```

### 第 4 步：测试新 URL（1 小时）

1. 随机抽查 20-30 个产品
2. 访问新 URL 确认页面正常
3. 检查分类导航是否正确

### 第 5 步：添加 301 重定向（30 分钟）

将生成的重定向规则添加到 `next.config.mjs`

### 第 6 步：部署并监控（持续）

1. 部署到生产环境
2. 监控 Google Search Console 的 404 错误
3. 如有必要，补充遗漏的重定向规则

### 第 7 步：清理旧数据（可选）

确认所有重定向正常工作后（建议等待 1-2 周），可以删除旧产品数据。

---

## 📋 预防措施（防止未来再次出现）

### 1. 修改 Products 集合配置

确保分类字段为必填：

```typescript
// src/payload/collections/Products.ts
{
  name: 'primaryCategory',
  type: 'relationship',
  relationTo: 'categories',
  required: true,  // ← 改为必填
  admin: {
    position: 'sidebar',
  },
}
```

### 2. 添加 Before Change Hook

在产品保存前验证分类：

```typescript
hooks: {
  beforeChange: [
    ({ data, operation }) => {
      if (operation === 'create' && !data.primaryCategory) {
        throw new Error('必须选择产品分类')
      }
      
      // 如果分类变更，自动生成 301 重定向
      if (operation === 'update' && data.originalDoc) {
        const oldCategory = data.originalDoc.primaryCategory
        const newCategory = data.primaryCategory
        
        if (oldCategory !== newCategory) {
          // 记录到重定向表
          await createRedirect({
            from: `/product/${oldCategory}/${data.slug}`,
            to: `/product/${newCategory}/${data.slug}`,
            permanent: true,
          })
        }
      }
      
      return data
    },
  ],
}
```

### 3. 创建 Redirects 集合

自动管理重定向规则：

```typescript
// src/payload/collections/Redirects.ts
export const Redirects: CollectionConfig = {
  slug: 'redirects',
  fields: [
    {
      name: 'from',
      type: 'text',
      required: true,
      unique: true,
    },
    {
      name: 'to',
      type: 'text',
      required: true,
    },
    {
      name: 'permanent',
      type: 'checkbox',
      defaultValue: true,
    },
  ],
}
```

### 4. 在 next.config.mjs 中读取重定向

```typescript
async redirects() {
  // 从数据库或配置文件读取重定向规则
  const staticRedirects = [
    // 手动配置的规则
  ]
  
  return staticRedirects
}
```

---

## 📊 预期效果

### 修复前
- 274 个产品 URL 不规范
- 可能导致 404 错误
- SEO 权重分散

### 修复后
- 所有产品 URL 统一格式：`/product/{category}/{slug}`
- 旧 URL 自动 301 重定向到新 URL
- SEO 权重集中到新 URL
- 用户体验提升

---

## ⚠️ 注意事项

1. **务必备份数据库**再执行任何更新操作
2. **先在 Preview 环境测试**，确认无误后再部署到生产环境
3. **分批次执行**，不要一次性处理所有产品
4. **监控 Search Console**，及时发现和处理 404 错误
5. **保留重定向至少 6 个月**，确保搜索引擎完成索引更新

---

## 📚 相关资源

- [Next.js 重定向文档](https://nextjs.org/docs/app/api-reference/config/next-config-js/redirects)
- [Payload CMS Hooks](https://payloadcms.com/docs/hooks/overview)
- [Google Search Console](https://search.google.com/search-console)

---

**最后更新**: 2026-03-18  
**负责人**: Development Team
