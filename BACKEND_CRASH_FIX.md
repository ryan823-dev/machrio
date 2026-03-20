# 后台崩溃事故复盘与规避指南

## 🚨 事故概述

**时间**: 2026-03-18  
**影响**: 后台管理系统无法访问（HTTP 500 错误）  
**持续时间**: 约 30 分钟  
**原因**: 在 `Products.ts` 中添加了不兼容的 `indexes` 配置

---

## 🔍 根本原因分析

### 问题代码

```typescript
// ❌ 错误：Payload CMS 3.0 不支持此配置
export const Products: CollectionConfig = {
  slug: 'products',
  // ... 其他配置
  indexes: [  // ← 这个配置导致运行时错误
    {
      fields: ['-updatedAt'],
    },
    {
      fields: ['slug'],
      unique: true,
    },
  ],
}
```

### 为什么会崩溃？

1. **配置不兼容**: Payload CMS 3.0 的 `CollectionConfig` 类型定义中**不包含** `indexes` 属性
2. **运行时错误**: 无效的配置导致 Payload CMS 初始化失败
3. **无构建时错误**: TypeScript 编译时未报错（因为使用了 `any` 类型或类型推断），但在运行时抛出异常

### 错误表现

```
HTTP 500 Internal Server Error
- /admin 页面返回 500
- Payload CMS 无法启动
- API 端点无法访问
```

---

## ✅ 解决方案

### 立即修复

移除了无效的 `indexes` 配置：

```typescript
// ✅ 正确：使用 Payload CMS 支持的配置
export const Products: CollectionConfig = {
  slug: 'products',
  defaultSort: '-updatedAt',  // ← 使用内置的排序配置
  // ... 其他有效配置
  // 移除了 indexes 配置
}
```

### 分页问题的正确处理方案

如果需要优化分页查询性能，应该：

#### 方案 1: 使用 MongoDB 原生索引（推荐）

直接在 MongoDB Atlas 控制台创建索引：

```javascript
// 在 MongoDB Atlas 中执行
db.products.createIndex({ updatedAt: -1 })
db.products.createIndex({ slug: 1 }, { unique: true })
```

**优点**:
- 不影响代码
- 数据库级别的优化
- 所有查询都受益

#### 方案 2: 使用 Payload CMS 的 hooks

在 `beforeFind` hook 中添加排序保证：

```typescript
hooks: {
  beforeFind: [
    ({ query }) => {
      // 确保查询包含排序
      if (!query.sort) {
        query.sort = '-updatedAt'
      }
      return query
    },
  ],
}
```

---

## 🛡️ 如何规避类似问题（重要！）

### 1. 修改前必须验证配置兼容性

**✅ 正确的检查流程**:

```markdown
1. 查阅官方文档确认配置是否支持
   → https://payloadcms.com/docs/configuration/collections
   
2. 检查 TypeScript 类型定义
   → 查看 `CollectionConfig` 接口允许的字段
   
3. 在开发环境测试
   → 先在本地运行 `npm run dev` 验证
   
4. 小范围部署测试
   → 先部署到 Preview URL，不要直接 --prod
```

### 2. 使用 Preview 部署进行验证

**❌ 错误的做法**:
```bash
# 直接部署到生产环境
vercel --prod --yes
```

**✅ 正确的做法**:
```bash
# 1. 先创建预览部署
vercel

# 2. 在浏览器中测试预览 URL
open https://your-preview-url.vercel.app/admin

# 3. 确认无误后再部署到生产环境
vercel --prod
```

### 3. 添加自动化检查

#### 创建预部署检查脚本

```bash
#!/bin/bash
# scripts/pre-deploy-check.sh

echo "🔍 运行部署前检查..."

# 1. TypeScript 类型检查
echo "✓ 检查 TypeScript 类型..."
npx tsc --noEmit

if [ $? -ne 0 ]; then
  echo "❌ TypeScript 检查失败，中止部署"
  exit 1
fi

# 2. ESLint 检查
echo "✓ 运行 ESLint..."
npm run lint

if [ $? -ne 0 ]; then
  echo "❌ ESLint 检查失败，中止部署"
  exit 1
fi

# 3. 构建测试
echo "✓ 测试构建..."
npm run build

if [ $? -ne 0 ]; then
  echo "❌ 构建失败，中止部署"
  exit 1
fi

echo "✅ 所有检查通过，可以部署"
```

#### 在 package.json 中添加检查命令

```json
{
  "scripts": {
    "pre-deploy": "./scripts/pre-deploy-check.sh",
    "deploy:preview": "vercel",
    "deploy:prod": "npm run pre-deploy && vercel --prod"
  }
}
```

### 4. 建立变更审查清单

在提交任何修改前，检查以下项目：

#### 前端/后台修改审查清单

- [ ] **配置变更**
  - [ ] 是否在 Payload CMS 官方文档中找到该配置？
  - [ ] TypeScript 类型定义是否允许？
  - [ ] 是否在其他项目中验证过？

- [ ] **数据库变更**
  - [ ] 是否需要迁移现有数据？
  - [ ] 索引变更是否向后兼容？
  - [ ] 是否会影响现有查询？

- [ ] **API 变更**
  - [ ] 是否破坏现有 API 接口？
  - [ ] 是否需要更新 API 文档？
  - [ ] 客户端是否需要适配？

- [ ] **测试验证**
  - [ ] 本地开发环境是否测试通过？
  - [ ] 是否有自动化测试覆盖？
  - [ ] 是否在 Preview 环境验证？

- [ ] **回滚方案**
  - [ ] 如果出现问题，如何快速回滚？
  - [ ] 回滚需要多长时间？
  - [ ] 回滚会影响哪些功能？

### 5. 建立监控和告警

#### 添加健康检查端点

```typescript
// src/app/api/health/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // 检查数据库连接
    // 检查 Payload CMS 状态
    return NextResponse.json({ 
      status: 'ok',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json(
      { status: 'error', message: error.message },
      { status: 500 }
    )
  }
}
```

#### 设置自动监控

使用 Vercel 的监控功能或第三方服务：

1. **Vercel Analytics**: 监控页面加载和错误
2. **Sentry**: 实时错误追踪
3. **Uptime Robot**: 网站可用性监控

---

## 📋 紧急响应流程

### 当后台无法访问时

#### 第 1 步：快速诊断（2 分钟内完成）

```bash
# 1. 检查 HTTP 状态码
curl -I https://machrio.com/admin

# 2. 查看最近的部署
vercel ls

# 3. 检查错误日志
curl https://machrio.com/admin | grep -i error
```

#### 第 2 步：定位问题（3 分钟内完成）

- 如果是 500 错误 → 代码/配置问题
- 如果是 404 错误 → 路由/部署问题
- 如果是超时 → 数据库/外部依赖问题

#### 第 3 步：紧急回滚（5 分钟内完成）

```bash
# 方法 1: 回滚到上一个正常版本
git revert HEAD
git push origin main

# 方法 2: 使用 Vercel 回滚
vercel rollback

# 方法 3: 手动恢复已知良好的代码
git checkout <last-good-commit>
git push origin main --force
```

#### 第 4 步：验证恢复（2 分钟内完成）

```bash
# 等待部署完成后验证
sleep 60
curl -I https://machrio.com/admin
# 应该返回 HTTP 200
```

---

## 🎯 最佳实践总结

### 开发阶段

1. **始终使用 TypeScript 严格模式**
   ```json
   {
     "compilerOptions": {
       "strict": true,
       "noImplicitAny": true,
       "noUnusedLocals": true
     }
   }
   ```

2. **在本地充分测试**
   ```bash
   npm run dev  # 开发服务器
   npm run lint  # 代码检查
   npm run type-check  # 类型检查
   ```

### 部署阶段

1. **Preview 优先原则**
   - 永远不要直接 `--prod`
   - 先在 Preview URL 验证所有功能
   - 特别是后台管理界面

2. **小步快跑**
   - 每次只修改一个功能
   - 修改后立即部署测试
   - 避免累积多个改动一起部署

3. **保留回滚路径**
   - 提交小的、可回滚的 commit
   - 使用 git tag 标记重要版本
   - 记录每个版本的变更内容

### 运维阶段

1. **持续监控**
   - 设置 uptime 监控
   - 配置错误告警
   - 定期检查日志

2. **备份策略**
   - 数据库定期备份
   - 代码版本管理
   - 配置文件版本化

---

## 📚 相关资源

- [Payload CMS 官方文档](https://payloadcms.com/docs)
- [Vercel 部署最佳实践](https://vercel.com/docs/deployments/best-practices)
- [Next.js 故障排查指南](https://nextjs.org/docs/messages)

---

**最后更新**: 2026-03-18  
**维护者**: Development Team
