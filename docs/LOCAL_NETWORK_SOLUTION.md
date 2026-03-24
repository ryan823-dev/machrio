# 本地网络限制解决方案

## 问题诊断

### 问题描述
本地开发环境无法直接连接 Supabase 数据库，出现 DNS 解析失败错误：
```
getaddrinfo ENOTFOUND db.yderhgkjcsaqrsfntpqm.supabase.co
```

### 根本原因
1. **DNS 解析失败** - 本地网络无法解析 Supabase 数据库域名
2. **网络防火墙** - 可能阻止了 PostgreSQL 直连端口（5432/6543）
3. **Cloudflare 保护** - Supabase 使用 Cloudflare CDN，限制了直接数据库连接

### 测试结果

```bash
# 运行数据库连接测试
node scripts/test-db-connection.cjs
```

**测试结果：**
- ❌ Supabase 直连：不可用（DNS 解析失败）
- ✅ Supabase REST API：可用
- ✅ MongoDB：可用（8,292 条产品记录）

## 解决方案

### 方案一：混合模式（已实施）✅

**配置说明：**
- **本地开发**：使用 MongoDB（数据已实时同步到 Supabase）
- **生产部署**：使用 Supabase PostgreSQL（Vercel 可以正常连接）

**环境变量配置：**

```bash
# .env.local - 本地开发
USE_POSTGRES=0
MONGODB_URI=mongodb+srv://mroworks_db_user:moore1982@mroworks-dev.gbqxebq.mongodb.net/machrio

# .env.vercel - 生产部署
USE_POSTGRES=1
DATABASE_URI=postgresql://postgres.pnqzjqpryqeqpmdqjhxc:qgvPF1YbGso3swVy@db.yderhgkjcsaqrsfntpqm.supabase.co:5432/postgres
```

**优点：**
- ✅ 本地开发不受网络限制影响
- ✅ 数据实时同步，保证一致性
- ✅ 生产环境使用更先进的 Supabase
- ✅ 无缝切换，无需修改代码

### 方案二：使用 Supabase REST API（备选）

如果需要使用 Supabase 数据但不想直连数据库，可以使用 REST API：

```javascript
const SUPABASE_URL = 'https://yderhgkjcsaqrsfntpqm.supabase.co';
const SERVICE_KEY = 'your-service-key';

// 查询数据
const response = await fetch(
  `${SUPABASE_URL}/rest/v1/products?select=*&limit=10`,
  {
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`
    }
  }
);
```

**优点：**
- ✅ 不受 DNS 限制
- ✅ 使用 HTTP/HTTPS 协议，穿透防火墙
- ✅ 支持所有 CRUD 操作

**缺点：**
- ⚠️ 需要修改数据访问层
- ⚠️ 性能不如直连数据库

### 方案三：网络配置优化（尝试修复）

#### macOS DNS 缓存清理
```bash
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder
```

#### 使用系统 DNS
```bash
# 查看当前 DNS
networksetup -getdnsservers Wi-Fi

# 设置为 Google DNS
networksetup -setdnsservers Wi-Fi 8.8.8.8 8.8.4.4
```

#### 修改 hosts 文件（不推荐，IP 可能变化）
```bash
# /etc/hosts
104.18.38.10 db.yderhgkjcsaqrsfntpqm.supabase.co
172.64.149.246 db.yderhgkjcsaqrsfntpqm.supabase.co
```

## 部署配置

### Vercel 生产环境

**环境变量设置：**
```bash
# 在 Vercel 控制台设置
USE_POSTGRES=1
DATABASE_URI=postgresql://postgres.pnqzjqpryqeqpmdqjhxc:qgvPF1YbGso3swVy@db.yderhgkjcsaqrsfntpqm.supabase.co:5432/postgres?sslmode=require
```

**vercel.json 配置：**
```json
{
  "installCommand": "npm install --legacy-peer-deps",
  "regions": ["iad1"]
}
```

**.npmrc 配置：**
```
legacy-peer-deps=true
```

## 开发工作流

### 本地开发
```bash
# 1. 安装依赖
npm install --legacy-peer-deps

# 2. 启动开发服务器
npm run dev

# 3. 访问网站
http://localhost:3004
```

### 生产部署
```bash
# 1. 提交代码到 Git
git add .
git commit -m "feat: update content"
git push

# 2. 部署到 Vercel
vercel deploy --prod

# 3. 访问生产环境
https://machrio.vercel.app
```

## 数据同步

### 实时同步机制
- MongoDB 和 Supabase 数据已完全同步
- 所有 8,961 条记录已迁移完成：
  - Categories: 635
  - Products: 8,292
  - Articles: 33
  - Brands: 1

### 验证数据一致性
```bash
# 运行数据验证脚本
node scripts/verify-migration.cjs

# 运行连接测试
node scripts/test-db-connection.cjs
```

## 故障排查

### 问题 1：本地无法启动
```bash
# 清理缓存
rm -rf .next node_modules/.cache

# 重新安装依赖
npm install --legacy-peer-deps

# 检查环境变量
cat .env.local
```

### 问题 2：数据库连接失败
```bash
# 运行测试工具
node scripts/test-db-connection.cjs

# 如果 MongoDB 可用但 Supabase 不可用
# 这是正常的，本地使用 MongoDB 即可
```

### 问题 3：Vercel 部署失败
```bash
# 检查 Vercel 日志
vercel inspect <deployment-url> --logs

# 检查环境变量是否正确设置
vercel env ls
```

## 最佳实践

1. **本地开发使用 MongoDB**
   - 快速启动，不受网络限制
   - 数据与 Supabase 实时同步

2. **生产部署使用 Supabase**
   - 更好的性能和可扩展性
   - 完整的 PostgreSQL 功能

3. **定期数据验证**
   - 确保 MongoDB 和 Supabase 数据一致
   - 使用验证脚本自动检查

4. **环境变量管理**
   - 本地使用 `.env.local`
   - 生产使用 Vercel 环境变量
   - 不要将敏感信息提交到 Git

## 相关脚本

- `scripts/test-db-connection.cjs` - 数据库连接测试
- `scripts/verify-migration.cjs` - 数据迁移验证
- `scripts/test-supabase-connection.cjs` - REST API 连接测试
- `scripts/check-product-diff.cjs` - 产品数据差异检查

## 联系支持

如有问题，请检查：
1. 网络连接状态
2. 环境变量配置
3. 运行测试脚本诊断
4. 查看 Vercel 部署日志
