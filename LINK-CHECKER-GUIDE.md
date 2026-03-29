# 🔗 网站链接检查工具使用指南

自动检查网站所有链接的可用性，找出 404 错误和失效链接。

## 📋 功能特性

- ✅ 从 sitemap.xml 自动获取所有 URL
- ✅ 批量并发检查（默认 5 个并发）
- ✅ 检测 404、500 错误和超时
- ✅ 生成详细报告（Markdown 格式）
- ✅ 显示加载时间
- ✅ 识别慢速链接（>3 秒）

## 🚀 使用方法

### 1. 安装依赖

```bash
cd d:\qoder\machrio
npm install
```

这会安装新添加的依赖：
- `xml2js` - 解析 sitemap XML
- `@types/xml2js` - TypeScript 类型定义

### 2. 运行检查

```bash
npm run check-links
```

### 3. 查看报告

运行完成后，会在项目根目录生成：
- **`LINK-CHECK-REPORT.md`** - 详细检查报告

报告包含：
- 统计摘要（总数、成功率等）
- 404 错误链接列表
- 500 服务器错误
- 超时链接
- 加载缓慢的链接（>3 秒）

## 📊 报告示例

```markdown
# 🔗 网站链接检查报告

**检查时间**: 2026-03-29 10:30:00
**基础 URL**: https://machrio.com

## 📊 统计摘要

- **总计**: 150 个链接
- **✅ 成功**: 145 个 (96.7%)
- **❌ 失败**: 5 个 (3.3%)
  - 404 Not Found: 3 个
  - 500 Server Error: 1 个
  - Timeout: 1 个

## ❌ 失败的链接

### 404 Not Found (3 个)

- https://machrio.com/category/cleaning-janitorial
- https://machrio.com/category/old-category
- https://machrio.com/discontinued-page

### 500 Server Error (1 个)

- https://machrio.com/api/some-endpoint - Internal Server Error

### 🐌 加载缓慢 (>3 秒) (2 个)

- https://machrio.com/category/heavy-category - 4500ms
- https://machrio.com/products/large-list - 3200ms
```

## ⚙️ 配置选项

在 `scripts/check-links.ts` 中可以调整：

```typescript
const BASE_URL = 'https://machrio.com'  // 基础 URL
const TIMEOUT = 10000                   // 超时时间（毫秒）
const CONCURRENT_LIMIT = 5             // 并发数量
```

## 🔧 自定义检查

### 检查特定页面类型

修改脚本，只检查特定类型的页面：

```typescript
// 只检查分类页面
const categoryUrls = urls.filter(url => url.includes('/category/'))
const results = await checkUrlsBatched(categoryUrls)
```

### 添加 POST 请求检查

对于 API 端点，可以添加 POST 请求测试：

```typescript
async function checkPostEndpoint(url: string) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ test: true }),
  })
  // ...
}
```

##  常见问题

### Q: 运行时报错 "Cannot find module 'xml2js'"

**解决**：
```bash
npm install xml2js @types/xml2js
```

### Q: 检查速度太慢

**解决**：增加并发数
```typescript
const CONCURRENT_LIMIT = 10  // 改为 10 个并发
```

### Q: 很多超时报错

**解决**：增加超时时间
```typescript
const TIMEOUT = 30000  // 改为 30 秒
```

### Q: 只想检查部分页面

**解决**：修改 `fetchUrlsFromSitemap` 函数，添加过滤逻辑：

```typescript
const filteredUrls = urls.filter(url => 
  url.includes('/category/') || url.includes('/products/')
)
```

## 📈 持续集成

可以添加到 GitHub Actions，定期检查：

```yaml
name: Link Checker

on:
  schedule:
    - cron: '0 9 * * *'  # 每天 9 AM UTC

jobs:
  check-links:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm install
      - run: npm run check-links
      - uses: actions/upload-artifact@v3
        with:
          name: link-check-report
          path: LINK-CHECK-REPORT.md
```

## 🎯 修复 404 链接

发现 404 后，有几种修复方法：

### 1. 创建缺失的页面

如果分类/页面不存在，在后台创建：
- 访问：https://machrio.com/admin
- 添加缺失的 Categories 或 Pages

### 2. 更新内部链接

如果页面已删除，更新所有指向它的链接：
- 使用全局搜索找到引用
- 更新为正确的新链接

### 3. 添加 301 重定向

如果页面已移动，在 `next.config.mjs` 中添加：

```javascript
async redirects() {
  return [
    {
      source: '/old-path',
      destination: '/new-path',
      permanent: true,
    },
  ]
}
```

### 4. 创建 redirect 文件

对于简单重定向，在 `public` 目录创建 `_redirects` 文件：

```
/old-category/new-category    /category/new-category    301
```

## 📝 最佳实践

1. **定期检查**：每周或每月运行一次
2. **部署前检查**：每次大更新后运行
3. **监控变化**：对比历史报告，发现新问题
4. **优先修复**：先修复 404，再优化慢速链接
5. **更新 sitemap**：确保 sitemap 是最新的

##  需要帮助？

如果发现问题但不知道如何修复：
1. 查看报告中的具体 URL
2. 在数据库中查询相关内容是否存在
3. 检查代码中的路由配置
4. 查看 Railway 日志是否有错误

---

**最后更新**: 2026-03-29  
**版本**: 1.0.0
