# Database Query Guide

## 方法 1: 使用 Admin Query 页面（推荐 - 最简单）

我已经创建了一个数据库查询页面，可以直接在浏览器中执行 SQL 查询。

### 部署步骤：

1. **部署到 Railway**（代码已提交后）：
   ```bash
   git add .
   git commit -m "Add admin database query tool"
   git push
   ```

2. **访问查询页面**：
   - 生产环境：`https://machrio.com/admin/query`
   - 本地开发：`http://localhost:3000/admin/query`

3. **执行查询**：
   
   点击页面上的快速查询按钮，或手动输入 SQL：
   
   ```sql
   -- 查看所有已发布的分类
   SELECT slug, name, is_published, display_order 
   FROM categories 
   WHERE is_published = true 
   ORDER BY display_order;
   
   -- 查看所有分类（包括未发布的）
   SELECT id, slug, name, is_published 
   FROM categories 
   ORDER BY id;
   
   -- 查看 scenario_categories 表中的所有 slug
   SELECT DISTINCT category_slug 
   FROM scenario_categories 
   ORDER BY category_slug;
   ```

## 方法 2: 使用 DBeaver（需要正确配置）

### DBeaver 连接配置：

1. **获取 Railway 数据库连接信息**：
   - 登录 Railway Dashboard
   - 选择你的 PostgreSQL 服务
   - 点击 "Connect" 标签
   - 复制 "External" 连接字符串

2. **Railway 连接字符串格式**：
   ```
   postgresql://postgres:PASSWORD@postgres.railway.internal:5432/railway
   ```

3. **DBeaver 连接步骤**：
   - 打开 DBeaver
   - 点击 "New Database Connection"
   - 选择 PostgreSQL
   - 填写连接信息：
     - **Host**: `postgres.railway.internal`
     - **Port**: `5432`
     - **Database**: `railway`
     - **Username**: `postgres`
     - **Password**: (从 Railway Dashboard 获取)
   - 点击 "Test Connection"
   - 如果失败，点击 "Edit Driver Settings" 并确保 PostgreSQL JDBC 驱动已下载

4. **如果连接仍然失败**：
   - Railway 的 `postgres.railway.internal` 是内部 DNS，只能从 Railway 内部访问
   - 需要使用 **Railway CLI** 或 **pgAdmin** 通过 SSH 隧道连接
   - 或者使用方法 1（Admin Query 页面）

## 方法 3: 使用 psql 命令行

```bash
# 安装 psql (如果未安装)
# Windows: 下载 PostgreSQL 安装包或使用 Chocolatey
# macOS: brew install postgresql

# 连接数据库
psql "postgresql://postgres:PASSWORD@postgres.railway.internal:5432/railway"

# 执行查询
SELECT slug, name FROM categories WHERE is_published = true ORDER BY display_order;
```

## 方法 4: 使用 Railway CLI

```bash
# 安装 Railway CLI
npm install -g @railway/cli

# 登录
railway login

# 选择项目
railway project

# 执行 SQL 查询
railway run psql -c "SELECT slug, name FROM categories WHERE is_published = true;"
```

## 快速诊断查询

执行以下查询来获取修复 Industry 页面所需的信息：

```sql
-- 1. 列出所有已发布的分类及其 slug
SELECT slug, name, display_order 
FROM categories 
WHERE is_published = true 
ORDER BY display_order;

-- 2. 检查是否有与 Industry 页面相关的分类
SELECT slug, name 
FROM categories 
WHERE name ILIKE '%safety%' 
   OR name ILIKE '%cleaning%' 
   OR name ILIKE '%material%' 
   OR name ILIKE '%adhesive%' 
   OR name ILIKE '%packaging%' 
   OR name ILIKE '%lighting%' 
   OR name ILIKE '%tool%' 
   OR name ILIKE '%power%';

-- 3. 统计分类总数
SELECT COUNT(*) as total_categories,
       SUM(CASE WHEN is_published THEN 1 ELSE 0 END) as published_count
FROM categories;
```

## Industry 页面中的分类链接

当前 Industry 页面包含以下分类链接（需要验证是否存在）：

| 分类名称 | Slug | 状态 |
|----------|------|------|
| Safety & PPE | `safety` | ❓ 待验证 |
| Cleaning & Janitorial | `cleaning-janitorial` | ❓ 待验证 |
| Adhesives & Sealants | `adhesives-sealants-tape` | ❓ 待验证 |
| Power Transmission | `power-transmission` | ❓ 待验证 |
| Material Handling | `material-handling` | ❓ 待验证 |
| Tool Storage | `tool-storage-workbenches` | ❓ 待验证 |
| Packaging & Shipping | `packaging-shipping` | ❓ 待验证 |
| Lighting | `lighting` | ❓ 待验证 |

执行上述查询后，我们可以确定哪些 slug 实际存在，然后：
- ✅ 存在的分类：保留链接
- ❌ 不存在的分类：移除或映射到类似的现有分类
