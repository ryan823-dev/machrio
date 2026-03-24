# 数据库迁移最终方案

## 技术分析

经过多次尝试，发现以下技术限制：

1. ✅ **Supabase REST API 可用** - 项目 `yderhgkjcsaqrsfntpqm` 存在且可访问
2. ❌ **直接 PostgreSQL 连接不可用** - DNS 无法解析 `db.yderhgkjcsaqrsfntpqm.supabase.co`
3. ❌ **REST API 不支持 DDL** - 无法通过 REST API 执行 CREATE TABLE
4. ❌ **连接池器认证失败** - 返回 "Tenant or user not found"

## 根本原因

DNS 无法解析 Supabase 数据库域名，这可能是：
- 项目已被删除或暂停
- 网络防火墙阻止了数据库连接
- Supabase 项目配置问题

## 可用方案

### 方案 A: 使用 Supabase Dashboard（推荐）

1. 访问：https://supabase.com/dashboard/project/yderhgkjcsaqrsfntpqm/sql/new
2. 执行 `supabase/quick-create.sql` 中的 SQL
3. 运行 `node scripts/rest-migrate.cjs` 迁移数据

### 方案 B: 创建新的 Supabase 项目

如果当前项目无法使用：

1. 在 https://supabase.com 创建新项目
2. 获取新的 DATABASE_URI
3. 更新 `.env.local`
4. 运行 `node scripts/direct-migrate.cjs`

### 方案 C: 使用 Supabase CLI（需要登录）

```bash
supabase login
supabase link --project-ref yderhgkjcsaqrsfntpqm
supabase db push
```

## 已创建的迁移工具

1. `scripts/rest-migrate.cjs` - 使用 REST API 迁移数据（需要表已存在）
2. `scripts/direct-migrate.cjs` - 使用直接连接迁移（需要数据库可访问）
3. `scripts/http-migrate.cjs` - 尝试所有连接方式
4. `supabase/quick-create.sql` - 简化的表创建 SQL

## 下一步

由于技术限制，需要用户手动在 Supabase Dashboard 执行一次 SQL 创建表结构。
这是 Supabase 的安全限制，无法通过 API 绕过。
