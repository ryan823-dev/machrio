# Railway 部署配置指南

## ⚠️ 重要：环境变量配置

Railway 部署**必须**配置以下环境变量，否则分类页面和产品页面将无法正常工作。

### 必需的环境变量

在 Railway 控制台中配置以下环境变量：

```bash
# 数据库连接（必需）
DATABASE_URI=postgresql://postgres:sGmPTCagRVFtHszbygRzSvYTdUXgCFfH@crossover.proxy.rlwy.net:38475/railway

# 启用 PostgreSQL 模式（必需）
USE_POSTGRES=1

# 网站 URL（必需）
NEXT_PUBLIC_SERVER_URL=https://machrio.com
```

### 如何配置 Railway 环境变量

1. 登录 Railway 控制台
2. 选择你的项目
3. 点击 "Variables" 标签
4. 添加上述环境变量
5. 保存后重新部署

### 验证配置

部署后，访问网站首页验证是否正常：
- 首页：`https://machrio.com/` (应返回 200)
- 分类页面：`https://machrio.com/category/surface-protection-tape` (应返回 200)
- 分类列表：`https://machrio.com/category` (应返回 200)

## 🔄 回退机制

当前代码已实现数据库连接失败的回退机制：

1. **优先使用数据库**：如果配置了 `DATABASE_URI`，分类页面会从数据库动态获取数据
2. **静态数据回退**：如果数据库连接失败，会自动使用 `src/data/nav-categories.json` 静态数据

### 回退机制的限制

- 静态数据只包含分类层级结构（L1/L2/L3）
- 不包含产品列表、SEO 内容、FAQ 等动态数据
- 适用于临时应急，不建议长期使用

## 📊 构建过程

Railway 部署时的构建流程：

```bash
# 1. 安装依赖
npm install

# 2. 运行 prebuild（生成导航数据）
npm run prebuild
# → 使用 DATABASE_URI 连接 PostgreSQL
# → 生成 src/data/nav-categories.json

# 3. 构建 Next.js
npm run build

# 4. 启动应用
npm start
```

## 🐛 故障排查

### 分类页面 404 错误

**原因**：`DATABASE_URI` 未配置或数据库连接失败

**解决方法**：
1. 检查 Railway 环境变量是否正确配置
2. 查看 Railway 部署日志，确认 `prebuild` 脚本成功运行
3. 验证数据库连接字符串是否正确

### 构建失败

**原因**：`prebuild` 脚本无法连接数据库

**解决方法**：
1. 检查 `DATABASE_URI` 格式是否正确
2. 确认 Railway 可以访问数据库（网络可达）
3. 查看 Railway 部署日志中的错误信息

### 静态数据过时

**原因**：数据库内容更新后，静态数据未同步

**解决方法**：
1. 重新触发 Railway 部署（git push）
2. 或本地运行 `npm run generate:nav` 生成新数据并提交

## 📝 本地开发配置

本地开发时，复制 `.env.local.example` 为 `.env.local`：

```bash
cp .env.local.example .env.local
```

确保 `.env.local` 包含：

```bash
DATABASE_URI=postgresql://postgres:sGmPTCagRVFtHszbygRzSvYTdUXgCFfH@crossover.proxy.rlwy.net:38475/railway
USE_POSTGRES=1
NEXT_PUBLIC_SERVER_URL=http://localhost:3000
```
