# 无分类产品修复 - 执行计划

## 📊 当前状态

- **总产品数**: 9,146 个
- **无分类产品**: 274 个（需要修复）
- **可自动匹配**: 260 个（已生成更新脚本）
- **需手动指定**: 14 个（已定义分类映射）

---

## ✅ 执行步骤

### 第 1 步：备份数据库（⚠️ 必须）

**重要**: 在执行任何更新操作前，务必备份数据库！

```bash
# 使用 mongodump 备份整个数据库
mongodump --uri="mongodb+srv://mroworks_db_user:moore1982@mroworks-dev.gbqxebq.mongodb.net/machrio" \
  --out=./backup-$(date +%Y%m%d-%H%M%S)
```

或者使用 MongoDB Compass 的导出功能。

---

### 第 2 步：执行自动分类更新

运行自动匹配脚本生成的 MongoDB 更新命令：

```bash
# 方式 A: 使用 MongoDB Shell
mongo < scripts/output/update-categories-mongo.js

# 方式 B: 使用 mongosh
mongosh "mongodb+srv://mroworks_db_user:moore1982@mroworks-dev.gbqxebq.mongodb.net/machrio" \
  < scripts/output/update-categories-mongo.js
```

**预期结果**: 260 个产品被成功更新

---

### 第 3 步：执行手动分类更新

为 14 个特殊产品添加分类：

```bash
cd machrio
npx tsx scripts/add-manual-categories.ts
```

**预期结果**: 14 个产品被成功更新

这 14 个产品的分类分配如下：

| 产品名称 | 分类 |
|---------|------|
| PVC Drainage Elbow (2 个) | plumbing-supplies |
| Extended sorghum broom | cleaning-supplies |
| VCI rust inhibitor PE bag | packaging-shipping |
| Anti static PE bag (2 个) | packaging-shipping |
| Platform Truck / Cart (5 个) | material-handling |

---

### 第 4 步：验证更新结果

随机抽查验证产品更新是否成功：

```bash
# 检查几个示例产品的 URL
curl -I https://machrio.com/product/lab-supplies/lab-brush-with-plastic-handle-h-8247
curl -I https://machrio.com/product/material-handling/platform-truck-csr-18
```

**预期行为**:
- 页面应该正常加载（HTTP 200）
- URL 应该包含分类路径
- 产品详情应该正确显示

---

### 第 5 步：生成 301 重定向规则

由于我们已经为产品添加了分类，系统会自动生成正确的 URL。但是为了处理可能存在的旧书签和搜索引擎索引，我们需要添加 301 重定向。

运行以下脚本生成重定向规则：

```bash
npx tsx scripts/generate-redirect-rules.ts
```

**输出文件**: `scripts/output/redirect-rules.json`

---

### 第 6 步：将重定向规则添加到 next.config.mjs

编辑 `/Users/oceanlink/Documents/Qoder-1/machrio/next.config.mjs`，在 `async redirects()` 函数中添加生成的重定向规则。

示例格式：

```typescript
async redirects() {
  return [
    // 自动生成的重定向规则
    {
      source: '/product/lab-brush-with-plastic-handle-h-8247',
      destination: '/product/lab-supplies/lab-brush-with-plastic-handle-h-8247',
      permanent: true,
    },
    // ... 更多规则
  ]
}
```

---

### 第 7 步：本地测试

```bash
# 启动本地开发服务器
npm run dev

# 测试几个重定向
curl -I http://localhost:3000/product/lab-brush-with-plastic-handle-h-8247
# 应该返回 301 重定向到 /product/lab-supplies/lab-brush-with-plastic-handle-h-8247
```

---

### 第 8 步：部署到 Preview 环境

```bash
# 提交更改
git add .
git commit -m "feat: add categories to 274 products and setup 301 redirects"

# 推送到 GitHub，Vercel 会自动创建 Preview 部署
git push origin main
```

然后在 Vercel Dashboard 中查看 Preview 部署。

---

### 第 9 步：在 Preview 环境中测试

访问 Vercel 提供的 Preview URL，测试以下内容：

1. **产品页面加载**: 随机访问 20-30 个更新后的产品页面
2. **重定向测试**: 访问旧 URL，确认 301 重定向到新 URL
3. **导航测试**: 从分类页面访问产品，确保面包屑导航正确
4. **搜索测试**: 使用站内搜索查找产品，确认链接正确

---

### 第 10 步：部署到生产环境

确认 Preview 环境测试无误后：

```bash
# 如果使用 Vercel CLI
vercel --prod

# 或者在 Vercel Dashboard 中点击 "Promote to Production"
```

---

### 第 11 步：监控和验证

部署后持续监控：

1. **Google Search Console**: 监控 404 错误和索引状态
2. **网站分析**: 检查流量是否有异常
3. **用户反馈**: 留意可能的 broken links 报告

---

## 🔄 回滚方案

如果出现问题，使用以下步骤回滚：

### 回滚手动分类更新

```bash
# 使用生成的回滚脚本
mongosh "mongodb+srv://mroworks_db_user:moore1982@mroworks-dev.gbqxebq.mongodb.net/machrio" \
  < scripts/output/rollback-manual-categories.js
```

### 回滚自动分类更新

```bash
# 使用 MongoDB 备份恢复
mongorestore --uri="你的 MongoDB URI" ./backup-YYYYMMDD-HHMMSS
```

### 回滚代码更改

```bash
# Git 回滚
git revert HEAD
git push origin main
```

---

## 📋 检查清单

执行前请逐项确认：

- [ ] 已完成数据库备份
- [ ] 已审查自动匹配的分类结果（260 个）
- [ ] 已确认手动分类分配方案（14 个）
- [ ] 已生成本地测试报告
- [ ] 已准备回滚脚本
- [ ] 已通知相关人员（如需要）
- [ ] 已安排执行时间（建议低峰期）

---

## ⚠️ 注意事项

1. **数据库备份是必须的**：在执行任何写操作前务必备份
2. **分批次执行**：可以先更新一小部分产品进行测试
3. **监控 Search Console**：部署后持续关注 404 错误
4. **保留重定向至少 6 个月**：确保搜索引擎完成索引更新
5. **避免在高峰期执行**：选择网站流量较低的时段

---

## 📞 联系方式

如有问题，请联系开发团队或参考以下文档：

- [DUPLICATE_PRODUCT_URL_FIX.md](../DUPLICATE_PRODUCT_URL_FIX.md) - 详细解决方案
- [BACKEND_CRASH_FIX.md](../BACKEND_CRASH_FIX.md) - 后端崩溃预防措施

---

**最后更新**: 2026-03-18  
**执行负责人**: Development Team
