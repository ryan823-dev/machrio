# Railway PostgreSQL SQL 操作指南

从 Supabase 迁移到 Railway 后，您可以通过以下几种方式执行 SQL 命令。

## 方法 1：Railway Dashboard SQL 编辑器（推荐）

Railway 提供了内置的 SQL 编辑器，可以直接在浏览器中执行 SQL。

### 步骤：

1. **打开 Railway Dashboard**
   - 访问：https://railway.app/dashboard
   - 选择您的项目（machrio）

2. **进入数据库服务**
   - 点击 PostgreSQL 数据库服务
   - 在左侧菜单选择 **"SQL"** 或 **"Data"** 标签

3. **执行 SQL 查询**
   ```sql
   -- 示例：查看所有银行帐户
   SELECT * FROM bank_accounts;
   
   -- 示例：查看未付款订单
   SELECT order_number, customer_email, total, currency, created_at 
   FROM orders 
   WHERE payment_status = 'unpaid' 
   ORDER BY created_at DESC;
   ```

4. **导出查询结果**
   - 查询结果可以导出为 CSV 或 JSON 格式
   - 点击 **"Export"** 按钮

## 方法 2：使用 psql 命令行

### 获取数据库连接字符串

1. 在 Railway Dashboard 中，进入 PostgreSQL 服务
2. 点击 **"Variables"** 标签
3. 复制 `DATABASE_URL` 环境变量

格式类似：
```bash
postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/[DATABASE]
```

### 连接到数据库

```bash
# 基本连接
psql "postgresql://postgres:your_password@railway-host.railway.internal:5432/your_database"

# 或者设置环境变量后连接
export DATABASE_URL="postgresql://postgres:your_password@host:port/database"
psql $DATABASE_URL
```

### 常用 SQL 操作

```sql
-- 查看所有表
\dt

-- 查看表结构
\d orders
\d bank_accounts

-- 查看未付款的银行转账订单（7-14 天前创建）
SELECT 
  order_number,
  customer_email,
  total,
  currency,
  created_at,
  payment_method
FROM orders
WHERE payment_method = 'bank-transfer'
  AND payment_status = 'unpaid'
  AND created_at >= NOW() - INTERVAL '14 days'
  AND created_at <= NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;

-- 更新订单支付状态
UPDATE orders
SET 
  payment_status = 'paid',
  status = 'confirmed',
  paid_at = NOW()
WHERE order_number = 'ORD-2026-001';

-- 查看银行帐户（按国家分组）
SELECT 
  country,
  currency,
  COUNT(*) as account_count,
  STRING_AGG(account_name, ', ') as account_names
FROM bank_accounts
GROUP BY country, currency
ORDER BY country;

-- 备份特定表的数据
COPY (SELECT * FROM orders WHERE created_at >= '2026-01-01') 
TO '/tmp/orders_backup.csv' 
WITH CSV HEADER;
```

## 方法 3：使用 Railway CLI

### 安装 Railway CLI

```bash
# npm
npm install -g @railway/cli

# 或者使用 Homebrew (macOS)
brew install railway-cli
```

### 登录 Railway

```bash
railway login
```

### 执行 SQL 命令

```bash
# 直接进入 psql 交互模式
railway run psql

# 执行单条 SQL 命令
railway run psql -c "SELECT COUNT(*) FROM orders;"

# 执行 SQL 文件
railway run psql -f script.sql

# 指定环境（production/development）
railway run psql --environment production
```

### 示例脚本

创建 `check-orders.sql`：
```sql
-- 检查最近订单
SELECT 
  order_number,
  customer_email,
  total,
  payment_status,
  status,
  created_at
FROM orders
WHERE created_at >= NOW() - INTERVAL '7 days'
ORDER BY created_at DESC
LIMIT 20;
```

执行：
```bash
railway run psql -f check-orders.sql
```

## 方法 4：使用第三方数据库工具

### DBeaver（跨平台，免费）

1. **下载安装**：https://dbeaver.io/download/
2. **创建新连接**
   - 数据库类型：PostgreSQL
   - 主机：从 Railway `DATABASE_URL` 获取
   - 端口：通常 5432
   - 数据库名：从 Railway `DATABASE_URL` 获取
   - 用户名：postgres
   - 密码：从 Railway `DATABASE_URL` 获取

3. **连接测试**
   - 点击 "Test Connection"
   - 成功后保存连接

4. **执行 SQL**
   - 右键点击连接 → SQL Editor
   - 编写并执行 SQL

### pgAdmin（PostgreSQL 官方工具）

1. **下载安装**：https://www.pgadmin.org/download/
2. **添加服务器**
   - 右键 Servers → Create → Server
   - 在 Connection 标签页填写 Railway 数据库信息
3. **使用 Query Tool**
   - 右键数据库 → Query Tool
   - 编写和执行 SQL

### VS Code 插件

安装 **"PostgreSQL Explorer"** 或 **"SQLTools"** 插件：

1. 在 VS Code 中打开 Command Palette (Ctrl+Shift+P)
2. 选择 "PostgreSQL: Attach Database"
3. 输入 Railway 的 `DATABASE_URL`
4. 直接在 VS Code 中执行 SQL

## 常见运维 SQL 查询

### 订单管理

```sql
-- 1. 查看所有未付款订单
SELECT 
  order_number,
  customer_email,
  total,
  currency,
  payment_method,
  created_at
FROM orders
WHERE payment_status = 'unpaid'
ORDER BY created_at DESC;

-- 2. 查看银行转账未付款订单（超过 7 天）
SELECT 
  order_number,
  customer_email,
  total,
  currency,
  created_at,
  NOW() - created_at as days_pending
FROM orders
WHERE payment_method = 'bank-transfer'
  AND payment_status = 'unpaid'
  AND created_at <= NOW() - INTERVAL '7 days'
ORDER BY created_at;

-- 3. 批量更新订单状态
UPDATE orders
SET 
  payment_status = 'paid',
  status = 'confirmed',
  paid_at = NOW()
WHERE payment_method = 'bank-transfer'
  AND payment_status = 'unpaid'
  AND created_at <= NOW() - INTERVAL '10 days'
  AND customer_email = 'verified@example.com';

-- 4. 查看订单统计（按支付状态）
SELECT 
  payment_status,
  COUNT(*) as count,
  SUM(total) as total_amount
FROM orders
GROUP BY payment_status;
```

### 银行帐户管理

```sql
-- 1. 查看所有收款银行帐户
SELECT 
  id,
  country,
  currency,
  account_name,
  bank_name,
  account_number,
  swift_code,
  is_active,
  created_at
FROM bank_accounts
ORDER BY country, currency;

-- 2. 查看特定货币的银行帐户
SELECT * FROM bank_accounts
WHERE currency IN ('USD', 'EUR', 'GBP')
  AND is_active = true
ORDER BY currency;

-- 3. 检查银行帐户是否重复
SELECT 
  country,
  currency,
  account_number,
  COUNT(*) as duplicate_count
FROM bank_accounts
GROUP BY country, currency, account_number
HAVING COUNT(*) > 1;
```

### 数据备份

```sql
-- 1. 导出所有订单数据
COPY (
  SELECT * FROM orders 
  WHERE created_at >= '2026-01-01'
  ORDER BY created_at
) TO STDOUT WITH CSV HEADER;

-- 2. 导出银行帐户数据
COPY (
  SELECT * FROM bank_accounts
  WHERE is_active = true
) TO STDOUT WITH CSV HEADER;

-- 3. 创建数据快照表
CREATE TABLE orders_backup_2026_03 AS
SELECT * FROM orders
WHERE created_at >= '2026-01-01';
```

### 性能监控

```sql
-- 1. 查看表大小
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- 2. 查看慢查询（需要启用 pg_stat_statements）
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  rows
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- 3. 检查数据库连接
SELECT 
  pid,
  usename,
  application_name,
  client_addr,
  state,
  query_start,
  query
FROM pg_stat_activity
WHERE state != 'idle'
ORDER BY query_start;
```

## 安全注意事项

⚠️ **重要安全提示：**

1. **保护 DATABASE_URL**
   - 不要将完整的连接字符串提交到 Git
   - 不要在公共场合分享
   - 定期更换数据库密码

2. **权限管理**
   - 生产环境使用只读账号进行查询
   - 写操作通过应用程序 API 进行
   - 避免直接在生产数据库执行 UPDATE/DELETE

3. **备份优先**
   - 执行 UPDATE/DELETE 前先备份数据
   - 使用事务包装危险操作：
   ```sql
   BEGIN;
   -- 执行操作
   -- 确认无误后
   COMMIT;
   -- 如有问题
   ROLLBACK;
   ```

4. **审计日志**
   - 记录所有手动执行的 SQL 操作
   - 包括操作时间、操作人、执行的 SQL

## 故障排查

### 连接问题

```bash
# 测试数据库连接
psql "DATABASE_URL" -c "SELECT 1;"

# 如果连接超时，检查：
# 1. Railway 项目是否在线
# 2. 防火墙设置
# 3. 连接字符串格式是否正确
```

### 常见错误

1. **"connection refused"**
   - 检查 Railway 服务是否运行
   - 确认 DATABASE_URL 正确

2. **"authentication failed"**
   - 检查密码是否正确
   - 确认用户名是否为 postgres

3. **"database does not exist"**
   - 确认 DATABASE_URL 中的数据库名
   - 检查 Railway 环境变量

## 从 Supabase 迁移后的差异

| 功能 | Supabase | Railway |
|------|----------|---------|
| SQL 编辑器 | 内置，功能丰富 | 基础编辑器 |
| 数据库连接 | 直接连接 | 通过 Railway 变量 |
| 备份恢复 | 自动备份 | 需手动配置 |
| 监控 | 内置监控 | Railway 基础监控 |
| API 访问 | Supabase Client | 需自建 API |

## 推荐工作流程

1. **日常查询**：使用 Railway Dashboard SQL 编辑器
2. **复杂操作**：使用 DBeaver 或 pgAdmin
3. **自动化脚本**：使用 Railway CLI + SQL 文件
4. **数据导出**：使用 COPY 命令 + CSV
5. **紧急修复**：直接使用 psql，但先备份

## 相关文档

- [Railway PostgreSQL 文档](https://docs.railway.app/databases/postgresql)
- [PostgreSQL 官方文档](https://www.postgresql.org/docs/)
- [psql 命令参考](https://www.postgresql.org/docs/current/app-psql.html)

## 需要帮助？

如果遇到数据库相关问题：
1. 检查 Railway Dashboard 日志
2. 查看 Railway 状态页面
3. 联系 Railway 支持
