# 网站修复总结

## 问题诊断

通过本地运行和测试，发现以下问题：

### 主要问题：数据库连接池管理错误

**根本原因**：多处代码调用 `pool.end()` 关闭了全局连接池，导致后续请求无法复用连接。

**错误表现**：
```
Error: Cannot use a pool after calling end on the pool
Error: Connection terminated unexpectedly
```

## 已完成的修复

### 1. 产品页面连接池关闭问题 (`src/app/(frontend)/product/[category]/[slug]/page.tsx`)

- **问题**: `getRelatedProductsFromDB()` 函数在 finally 块中调用了 `pool.end()`
- **修复**: 移除 `pool.end()` 调用，让连接池被复用

### 2. API Routes 修复 (移除所有 `pool.end()` 调用)

| 文件 | 状态 |
|------|------|
| `src/app/api/sitemap/route.ts` | ✅ 已修复 |
| `src/app/api/test-db/route.ts` | ✅ 已修复 |
| `src/app/api/merchant-feed/route.ts` | ✅ 已修复 |
| `src/app/api/check-tables/route.ts` | ✅ 已修复 |
| `src/app/api/internal/check-product/route.ts` | ✅ 已修复 |
| `src/app/(admin)/api/admin/query/route.ts` | ✅ 已修复 |

### 3. 核心模块修复

| 文件 | 状态 |
|------|------|
| `src/app/sitemap.ts` | ✅ 已修复 |
| `src/lib/init-database.ts` | ✅ 已修复 |
| `src/lib/db/articles.ts` | ✅ 已修复 |

### 4. 连接池配置优化 (`src/lib/db/index.ts`)

- 添加 `safeQuery()` 函数，支持自动重试
- 添加 `queryWithValidation()` 函数，验证连接有效性
- 优化连接池配置：
  - `max: 3` - 减少最大连接数
  - `min: 0` - 允许空闲时清空连接池
  - `idleTimeoutMillis: 5000` - 5秒空闲超时，短于 Railway 代理超时
- 添加错误处理监听器，避免进程崩溃

### 5. 统一使用全局连接池

所有模块现在都使用 `getPool()` 从 `@/lib/db` 获取共享连接池实例。

## 关于 "Connection terminated unexpectedly" 错误

这个错误来自 Railway 代理的超时机制：
- Railway 代理会在连接空闲一段时间后关闭连接
- 这是 Railway 的预期行为，不影响功能
- 新请求会自动建立新连接
- 所有页面请求仍然返回 200 成功

## 测试结果

### 本地测试 (使用 Railway 数据库)
- ✅ 产品页面: 200 OK (多次请求成功)
- ✅ 分类页面: 200 OK (多次请求成功)
- ✅ API endpoints: 正常工作
- ✅ 数据库连接: 6171 个产品, 635 个分类

### 线上测试
- ❓ 需要重新部署后测试

## 下一步

1. **重新部署到 Railway/Vercel**
   ```bash
   git add .
   git commit -m "fix: remove pool.end() calls to prevent connection pool issues in serverless"
   git push
   ```

2. **验证线上状态**
   - 测试 https://machrio.com/product/...
   - 测试 https://machrio.com/category/...
   - 检查 Railway 日志是否还有错误

## 技术要点

### Serverless 环境数据库连接最佳实践

1. **不要调用 `pool.end()`** - 在 Vercel/Railway serverless 环境中，连接池应该被跨请求复用

2. **使用 `globalThis` 持久化连接池**
   ```typescript
   if (!(globalThis as any).__dbPool) {
     (globalThis as any).__dbPool = createPool()
   }
   return (globalThis as any).__dbPool
   ```

3. **设置合理的超时时间** - `idleTimeoutMillis` 应该短于代理超时时间

4. **添加错误处理** - 监听 `pool.on('error')` 防止进程崩溃

## 相关文件

- `src/lib/db/index.ts` - 数据库连接池
- `src/lib/db-queries.ts` - 数据库查询函数
- `src/app/(frontend)/product/[category]/[slug]/page.tsx` - 产品页面
- `src/app/(frontend)/category/[slug]/page.tsx` - 分类页面