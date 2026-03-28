# Railway 部署指南

## 环境变量配置

在 Railway Dashboard 中设置以下环境变量：

### 必需的环境变量

```bash
# Payload CMS Secret
PAYLOAD_SECRET=your-secret-key-32-chars-minimum

# 数据库 (Supabase PostgreSQL)
USE_POSTGRES=1
DATABASE_URI=postgresql://postgres.yderhgkjcsaqrsfntpqm:Machrio%402026@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres

# Public URL
NEXT_PUBLIC_SERVER_URL=https://machrio.com

# AI Provider
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=your-openrouter-api-key

# 图片存储 (Aliyun OSS)
ALIYUN_OSS_REGION=oss-us-west-1
ALIYUN_OSS_ENDPOINT=https://oss-us-west-1.aliyuncs.com
ALIYUN_OSS_BUCKET=machrio
ALIYUN_OSS_ACCESS_KEY_ID=your-access-key
ALIYUN_OSS_ACCESS_KEY_SECRET=your-secret-key
```

### 可选的环境变量

```bash
# Email Service
RESEND_API_KEY=your-resend-api-key
RFQ_NOTIFICATION_EMAIL=sales@machrio.com

# Payment (PayPal)
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_CLIENT_SECRET=your-paypal-secret

# Supabase (如果需要 Auth/Storage)
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT-REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Cron Jobs (for automated tasks)
CRON_SECRET=your-secret-key-for-cron-authentication
```

## 配置定时任务（Cron Jobs）

### 银行转账逾期提醒

自动发送付款提醒邮件给未付款的客户（订单创建后 7-14 天）。

#### 在 Railway Dashboard 中配置：

1. **进入项目设置**
   - 访问：https://railway.app/dashboard
   - 选择 machrio 项目
   - 点击 **"Settings"** 标签

2. **添加 Cron Job**
   - 滚动到 **"Cron Jobs"** 部分
   - 点击 **"Add Cron Job"**
   - 填写：
     - **Name**: `remind-unpaid-orders`
     - **Schedule**: `0 9 * * *` (每天 UTC 9 AM)
     - **Command**: `curl -H "Authorization: Bearer $CRON_SECRET" https://machrio.com/api/cron/remind-unpaid`

3. **设置 CRON_SECRET 环境变量**
   - 在 Railway Dashboard → Variables 中添加
   - 生成一个随机密钥：`openssl rand -hex 32`
   - 值：`CRON_SECRET=your-generated-secret`

#### 测试定时任务：

```bash
# 手动运行测试
curl -H "Authorization: Bearer your-cron-secret" \
     https://machrio.com/api/cron/remind-unpaid

# 查看返回结果
{
  "success": true,
  "message": "Sent 3 reminders",
  "results": {
    "total": 3,
    "reminded": 3,
    "errors": []
  }
}
```

#### 其他定时任务建议：

```bash
# 每天检查 30 天以上未付款订单（准备取消）
0 10 * * * curl -H "Authorization: Bearer $CRON_SECRET" https://machrio.com/api/cron/cancel-old-orders

# 每周一生成上周销售报告
0 8 * * 1 curl -H "Authorization: Bearer $CRON_SECRET" https://machrio.com/api/cron/weekly-report
```

## 部署步骤

### 方法 1：从 GitHub 部署

1. 访问：https://railway.app/dashboard
2. 点击 **"New Project"**
3. 选择 **"Deploy from GitHub repo"**
4. 授权并选择：`ryan823-dev/machrio`
5. Railway 会自动检测 Next.js 并部署

### 方法 2：使用 Dockerfile

如果需要自定义配置，可以创建 Dockerfile：

```dockerfile
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

## 验证部署

### 1. 检查首页
访问：`https://machrio.com`

### 2. 检查 Sitemap
访问：`https://machrio.com/sitemap.xml`

应该能看到 XML 格式的 sitemap，包含：
- 静态页面（首页、分类页、信息页等）
- 动态产品页面（从数据库获取）
- 动态分类页面（从数据库获取）

### 3. 检查 Robots.txt
访问：`https://machrio.com/robots.txt`

应该看到：
```
Sitemap: https://machrio.com/sitemap.xml
```

### 4. 在谷歌站长工具中提交

1. 访问：https://search.google.com/search-console
2. 选择 machrio.com 属性
3. 进入 **Sitemaps** 部分
4. 提交：`sitemap.xml`
5. 等待谷歌抓取

## 故障排查

### Sitemap 返回 404 或错误

1. 检查 Railway 日志：
   - 在 Railway Dashboard 中查看 Logs
   - 查找 sitemap 生成相关的错误

2. 检查数据库连接：
   - 确认 `DATABASE_URI` 正确
   - 确认数据库可访问

3. 查看生成的 sitemap：
   ```bash
   curl https://machrio.com/sitemap.xml
   ```

### 数据库连接失败

1. 检查 `DATABASE_URI` 格式是否正确
2. 确认 Supabase 项目允许外部连接
3. 检查防火墙设置

### 页面不更新

清除缓存并重新部署：
1. Railway Dashboard > Settings
2. 点击 **"Redeploy"**

## 性能优化建议

1. **启用缓存**
   - sitemap.ts 已配置 `revalidate = 3600`（每小时更新）
   - 可以考虑使用 Redis 缓存数据库查询结果

2. **监控性能**
   - 使用 Railway 的监控功能
   - 设置告警阈值

3. **优化数据库查询**
   - 为 `slug` 字段添加索引
   - 考虑使用物化视图

## 完成检查清单

- [ ] 环境变量已配置
- [ ] 部署成功
- [ ] 首页可访问
- [ ] sitemap.xml 可访问且包含所有 URL
- [ ] robots.txt 正确指向 sitemap
- [ ] 在谷歌站长工具中提交 sitemap
- [ ] 监控 Railway 日志无错误
- [ ] Cron Jobs 已配置（逾期提醒）
- [ ] CRON_SECRET 已设置
- [ ] 测试付款凭证上传功能
- [ ] 测试财务确认收款 API
