# Railway 快速配置指南

## 📋 部署后必须完成的 3 个配置

### 1️⃣ 设置数据库连接（如果还没设置）

1. 访问：https://railway.app/dashboard
2. 选择 **machrio** 项目
3. 点击 **PostgreSQL** 数据库服务
4. 点击 **"Variables"** 标签
5. 找到 `DATABASE_URL`，复制这个值
6. 在 **machrio** 服务（不是数据库）的 Variables 中添加：
   - Key: `DATABASE_URI`
   - Value: 粘贴刚才复制的 `DATABASE_URL` 值

### 2️⃣ 生成并设置 CRON_SECRET

**生成随机密钥（3 选 1）：**

✅ **最简单：使用在线工具**
- 访问：https://generate-secret.vercel.app/32
- 复制生成的字符串（64 个字符）

✅ **使用 Git Bash（Windows）**
```bash
openssl rand -hex 32
```

✅ **使用 Node.js**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**在 Railway 中设置：**
1. Railway Dashboard → 选择 machrio 项目
2. 点击 **"Variables"** 标签
3. 点击 **"New Variable"**
4. Key: `CRON_SECRET`
5. Value: 粘贴生成的随机密钥
6. 点击 **"Add"**

### 3️⃣ 验证 Cron Jobs 配置

**已经自动配置完成！** 

项目根目录的 `railway.json` 文件已包含 Cron Job 配置：

```json
{
  "crons": [
    {
      "name": "remind-unpaid-orders",
      "schedule": "0 9 * * *",
      "command": "curl -H \"Authorization: Bearer $CRON_SECRET\" https://machrio.com/api/cron/remind-unpaid"
    }
  ]
}
```

**验证方法：**
1. Railway Dashboard → 选择 machrio 项目
2. 查看服务列表，应该能看到：
   - `machrio` (主应用)
   - `machrio-cron-remind-unpaid-orders` (定时任务)
3. 两个服务都应该显示 "Deployed"

---

## 🔍 完整的环境变量列表

在 Railway Dashboard → Variables 中应该有以下变量：

### 必需变量
```bash
# Payload CMS
PAYLOAD_SECRET=your-secret-key-32-chars-minimum

# 数据库
USE_POSTGRES=1
DATABASE_URI=postgresql://...（从数据库服务复制）

# 网站
NEXT_PUBLIC_SERVER_URL=https://machrio.com

# Cron Jobs
CRON_SECRET=生成的 64 位随机密钥
```

### 可选变量
```bash
# Email
RESEND_API_KEY=your-resend-api-key
EMAIL_FROM="Machrio <support@machrio.com>"
ADMIN_EMAIL=support@machrio.com

# AI
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=your-api-key

# 图片存储
ALIYUN_OSS_REGION=oss-us-west-1
ALIYUN_OSS_ENDPOINT=https://oss-us-west-1.aliyuncs.com
ALIYUN_OSS_BUCKET=machrio
ALIYUN_OSS_ACCESS_KEY_ID=your-key
ALIYUN_OSS_ACCESS_KEY_SECRET=your-secret
```

---

## ✅ 验证部署成功

### 1. 检查 Railway 状态

访问：https://railway.app/dashboard

应该看到：
- ✅ machrio 服务：Deployed
- ✅ PostgreSQL 数据库：Provisioned
- ✅ machrio-cron-remind-unpaid-orders: Deployed

### 2. 测试网站

```bash
# 访问首页
https://machrio.com

# 访问 Sitemap
https://machrio.com/sitemap.xml

# 应该能看到 XML 内容
```

### 3. 测试 Cron Job

**手动触发测试：**
```bash
curl -H "Authorization: Bearer 你的 CRON_SECRET" \
     https://machrio.com/api/cron/remind-unpaid
```

**预期响应：**
```json
{
  "success": true,
  "message": "Sent 0 reminders",
  "results": {
    "total": 0,
    "reminded": 0,
    "errors": []
  }
}
```

---

## 🛠️ 常见问题

### Q1: DATABASE_URL 和 DATABASE_URI 有什么区别？

- `DATABASE_URL`: Railway 数据库服务自动生成的环境变量
- `DATABASE_URI`: 您的应用需要连接数据库时使用的变量名

**设置步骤：**
1. 从数据库服务复制 `DATABASE_URL`
2. 在应用服务的 Variables 中添加 `DATABASE_URI`，值为刚才复制的 URL

### Q2: Cron Job 没有运行？

检查：
1. ✅ `CRON_SECRET` 环境变量已设置
2. ✅ `railway.json` 文件已推送到 GitHub
3. ✅ Railway 已重新部署
4. 查看 Cron 服务的 Logs 是否有错误

### Q3: 如何查看 Cron Job 执行日志？

1. Railway Dashboard → 选择项目
2. 点击 `machrio-cron-remind-unpaid-orders` 服务
3. 点击 **"Logs"** 标签
4. 查看执行记录

### Q4: 如何修改 Cron Job 时间？

编辑 `railway.json` 文件：
```json
{
  "crons": [
    {
      "name": "remind-unpaid-orders",
      "schedule": "0 10 * * *"  // 改为每天 10 AM UTC
    }
  ]
}
```

推送后 Railway 会自动更新。

---

## 📚 相关文档

- [完整部署指南](./RAILWAY-DEPLOY.md)
- [SQL 操作指南](./RAILWAY-SQL-GUIDE.md)
- [银行转账支付功能](./BANK-TRANSFER-PAYMENT-GUIDE.md)
- [部署检查清单](./DEPLOYMENT-CHECKLIST.md)

---

**最后更新**: 2026-03-28  
**版本**: v1.1.0
