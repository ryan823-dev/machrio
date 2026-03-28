# 部署后配置检查清单

## ✅ 代码已推送

您的代码已成功推送到 GitHub：
- **仓库**: https://github.com/ryan823-dev/machrio
- **分支**: main
- **状态**: Railway 将自动开始部署

## 📋 Railway Dashboard 配置步骤

### 1. 环境变量设置

访问：https://railway.app/dashboard → 选择 machrio 项目 → Variables

**必需的环境变量：**

```bash
# Payload CMS
PAYLOAD_SECRET=your-secret-key-32-chars-minimum

# 数据库
USE_POSTGRES=1
DATABASE_URI=postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres

# 网站 URL
NEXT_PUBLIC_SERVER_URL=https://machrio.com

# Email Service
RESEND_API_KEY=your-resend-api-key
RFQ_NOTIFICATION_EMAIL=sales@machrio.com

# Cron Jobs（重要！）
CRON_SECRET=生成一个随机密钥
```

**生成 CRON_SECRET：**
```bash
# 方法 1: 使用 openssl
openssl rand -hex 32

# 方法 2: 使用 node
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. 配置定时任务（Cron Jobs）

访问：Railway Dashboard → Settings → Cron Jobs

**添加逾期提醒任务：**

| 字段 | 值 |
|------|-----|
| **Name** | `remind-unpaid-orders` |
| **Schedule** | `0 9 * * *` |
| **Command** | `curl -H "Authorization: Bearer $CRON_SECRET" https://machrio.com/api/cron/remind-unpaid` |

**配置步骤：**
1. 点击 "Add Cron Job"
2. 填写上述信息
3. 点击 "Save"

### 3. 验证部署

等待 Railway 完成部署（约 2-5 分钟），然后验证：

**✅ 检查列表：**

```bash
# 1. 检查首页
curl -I https://machrio.com

# 2. 检查 Sitemap
curl https://machrio.com/sitemap.xml

# 3. 检查 Robots.txt
curl https://machrio.com/robots.txt

# 4. 测试上传 API（需要测试订单）
# 访问：https://machrio.com/order/测试订单号
```

## 🔍 功能测试

### 测试 1：付款凭证上传

1. 创建一个测试订单（选择 Bank Transfer）
2. 访问订单确认页面
3. 点击 "Upload Payment Receipt"
4. 上传测试文件（PDF 或图片）
5. 确认上传成功

### 测试 2：财务确认 API

```bash
# 获取测试订单 ID（从后台或数据库）
# 然后执行：

curl -X POST https://machrio.com/api/admin/orders/{order_id}/confirm-payment \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-admin-token" \
  -d '{
    "notes": "Test payment confirmation",
    "notifyCustomer": true
  }'
```

### 测试 3：定时任务

```bash
# 手动触发测试
curl -H "Authorization: Bearer your-cron-secret" \
     https://machrio.com/api/cron/remind-unpaid

# 预期响应
{
  "success": true,
  "message": "Sent X reminders",
  "results": { ... }
}
```

## 🗄️ 数据库初始化

### 创建 Payment Receipts 表

Railway 部署后，Payload CMS 会自动创建新表。如果需要手动检查：

```sql
-- 在 Railway SQL 编辑器中执行
\d payment_receipts

-- 应该看到表结构包含：
-- id, filename, order_number, order_id, uploaded_by, 
-- file_size, file_type, notes, verified, verified_by, 
-- verified_at, created_at, updated_at
```

### 验证 Orders 表更新

```sql
-- 检查 payment 字段是否包含新列
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'orders' 
  AND column_name LIKE '%receipt%'
ORDER BY column_name;
```

## 📊 监控部署

### Railway Dashboard 监控

1. **查看部署日志**
   - Railway Dashboard → Deployments
   - 点击最新的部署
   - 查看 "Logs" 标签

2. **检查服务状态**
   - 确认服务显示 "Deployed"
   - 检查健康检查状态

3. **查看资源使用**
   - CPU 和内存使用情况
   - 数据库连接数

### 错误排查

**如果部署失败：**

1. 查看 Railway Logs
   ```bash
   # 常见错误：
   - 数据库连接失败 → 检查 DATABASE_URI
   - 构建失败 → 检查 Node 版本兼容性
   - 环境变量缺失 → 检查 Variables
   ```

2. 回滚部署
   - Railway Dashboard → Deployments
   - 选择上一个成功版本
   - 点击 "Redeploy"

## 🔐 安全配置

### 1. 保护 Admin API

确保以下端点受到保护：
- `/api/admin/*` - 需要 admin 权限
- `/api/cron/*` - 需要 CRON_SECRET

### 2. 文件上传安全

检查上传目录权限：
```bash
# 在 Railway 中，public/payment-receipts 应该是可写权限
# Payload 会自动处理权限设置
```

### 3. 数据库访问控制

```sql
-- 创建只读用户用于查询
CREATE USER machrio_readonly WITH PASSWORD 'strong-password';
GRANT SELECT ON ALL TABLES IN SCHEMA public TO machrio_readonly;
```

## 📝 后续优化建议

### 1. 性能优化

- [ ] 为 `payment_receipts` 表添加索引
- [ ] 配置 Redis 缓存
- [ ] 优化数据库连接池

### 2. 监控告警

- [ ] 设置 Railway 告警（CPU/内存）
- [ ] 配置错误通知邮件
- [ ] 监控定时任务执行情况

### 3. 备份策略

- [ ] 配置 Railway 自动备份
- [ ] 定期导出 payment_receipts 数据
- [ ] 测试数据恢复流程

## 📞 需要帮助？

### Railway 文档
- 部署指南：https://docs.railway.app/
- PostgreSQL：https://docs.railway.app/databases/postgresql
- Cron Jobs：https://docs.railway.app/deploy/crons

### 项目文档
- [Railway SQL 操作指南](./RAILWAY-SQL-GUIDE.md)
- [银行转账支付功能](./BANK-TRANSFER-PAYMENT-GUIDE.md)
- [Railway 部署指南](./RAILWAY-DEPLOY.md)

### 检查清单完成状态

- [x] 代码已推送到 GitHub
- [ ] Railway 环境变量已配置
- [ ] CRON_SECRET 已设置
- [ ] Cron Job 已配置
- [ ] 部署成功验证
- [ ] 付款凭证上传测试
- [ ] 财务确认 API 测试
- [ ] 定时任务测试
- [ ] 数据库表验证

---

**部署时间**: 2026-03-28  
**版本**: v1.0.0  
**主要功能**: 银行转账支付完整流程 + Railway SQL 操作指南
