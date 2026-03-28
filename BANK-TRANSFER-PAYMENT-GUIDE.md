# 银行转账支付功能完整指南

## 功能概述

Machrio 网站现在支持完整的银行转账（电汇）支付流程，适用于 B2B 国际贸易场景。客户可以选择 15 种货币进行支付，系统会自动匹配相应的海外收款银行账户。

## 支持的货币

- USD (美元)
- HKD (港元)
- EUR (欧元)
- GBP (英镑)
- CAD (加拿大元)
- AUD (澳大利亚元)
- NZD (新西兰元)
- SGD (新加坡元)
- AED (阿联酋迪拉姆)
- MXN (墨西哥比索)
- PHP (菲律宾比索)
- IDR (印度尼西亚盾)
- ILS (以色列新谢克尔)
- DKK (丹麦克朗)
- CNY (人民币)

## 功能模块

### 1. 客户下单与付款

#### 1.1 结账页面
- 客户在结账时选择 "Bank Transfer" 支付方式
- 选择订单货币（15 种可选）
- 系统自动生成订单，状态为 "Unpaid"

#### 1.2 查看形式发票（Proforma Invoice）
- 客户在订单确认页面点击 "View Proforma Invoice"
- 访问：`https://machrio.com/order/{orderNumber}/invoice`
- 发票显示：
  - 订单详情
  - 应付金额和货币
  - 匹配的银行账户信息（根据货币智能匹配）
  - 付款指引和注意事项

#### 1.3 上传付款凭证
- 客户在订单确认页面可以直接上传银行转账凭证
- 支持格式：JPEG, PNG, GIF, PDF
- 最大文件大小：10MB
- 上传后状态：凭证待审核

**前端组件位置：**
```
src/components/order/PaymentReceiptUpload.tsx
```

**API 端点：**
```
POST /api/orders/{orderNumber}/upload-receipt
```

**请求示例：**
```bash
curl -X POST https://machrio.com/api/orders/ORD-2026-ABC123/upload-receipt \
  -F "receipt=@/path/to/receipt.pdf" \
  -F "notes=Payment via HSBC bank transfer"
```

**响应示例：**
```json
{
  "success": true,
  "message": "Receipt uploaded successfully",
  "receiptId": "67890",
  "filename": "receipt-ORD-2026-ABC123-uuid.pdf"
}
```

### 2. 财务团队审核

#### 2.1 查看上传的凭证
- 登录后台：https://machrio.com/admin
- 进入：销售 → Payment Receipts
- 查看所有上传的付款凭证
- 可以验证凭证（点击 verified 复选框）

#### 2.2 手动确认收款
财务团队可以通过以下方式确认收款：

**方法 1：通过后台界面**
1. 进入 Orders 列表
2. 找到对应订单
3. 手动更新：
   - Payment Status: paid
   - Status: confirmed
   - 上传凭证到 Payment Receipt 字段

**方法 2：通过 API（推荐用于批量操作）**

```bash
# 确认收款
curl -X POST https://machrio.com/api/admin/orders/{order_id}/confirm-payment \
  -H "Authorization: Bearer your-admin-token" \
  -H "Content-Type: application/json" \
  -d '{
    "notes": "Bank transfer received via HSBC",
    "notifyCustomer": true
  }'
```

**API 端点：**
```
POST /api/admin/orders/{id}/confirm-payment
```

**请求参数：**
- `notes` (可选): 内部备注信息
- `notifyCustomer` (布尔值): 是否发送邮件通知客户

**响应示例：**
```json
{
  "success": true,
  "message": "Payment confirmed successfully",
  "order": {
    "id": "123",
    "orderNumber": "ORD-2026-ABC123",
    "paymentStatus": "paid",
    "status": "confirmed"
  }
}
```

### 3. 自动化提醒系统

#### 3.1 逾期付款提醒
系统会自动发送付款提醒给未付款的客户。

**API 端点：**
```
GET /api/cron/remind-unpaid
```

**触发条件：**
- 支付方式：Bank Transfer
- 付款状态：Unpaid
- 订单创建时间：7-14 天前

**配置方法：**
在 Railway Dashboard 中设置 Cron Job：
- Schedule: `0 9 * * *` (每天 UTC 9 AM)
- Command: `curl -H "Authorization: Bearer $CRON_SECRET" https://machrio.com/api/cron/remind-unpaid`

**环境变量：**
```bash
CRON_SECRET=your-secret-key
```

**邮件内容：**
- 友好的付款提醒
- 订单详情和金额
- Proforma Invoice 链接
- 联系方式

### 4. 数据库管理

#### 4.1 查看银行账户信息
所有海外收款账户存储在 `bank_accounts` 表中。

**SQL 查询示例：**
```sql
-- 查看所有活跃的银行账户
SELECT country, currency, account_name, bank_name, swift_code
FROM bank_accounts
WHERE is_active = true
ORDER BY country, currency;

-- 查看特定货币的账户
SELECT * FROM bank_accounts
WHERE currency = 'USD' AND is_active = true;

-- 检查是否有重复账户
SELECT country, currency, account_number, COUNT(*) as count
FROM bank_accounts
GROUP BY country, currency, account_number
HAVING COUNT(*) > 1;
```

#### 4.2 查看未付款订单
```sql
-- 所有未付款的银行转账订单
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
ORDER BY created_at DESC;

-- 逾期 7 天以上的订单
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
```

#### 4.3 查看上传的凭证
```sql
-- 所有上传的付款凭证
SELECT 
  pr.filename,
  pr.order_number,
  pr.uploaded_by,
  pr.file_size,
  pr.created_at,
  pr.verified,
  o.status,
  o.payment_status
FROM payment_receipts pr
LEFT JOIN orders o ON pr.order_id = o.id
ORDER BY pr.created_at DESC;

-- 待审核的凭证
SELECT 
  pr.order_number,
  pr.uploaded_by,
  pr.created_at
FROM payment_receipts pr
WHERE pr.verified = false
ORDER BY pr.created_at;
```

### 5. 使用 Railway SQL 编辑器

参考文档：[RAILWAY-SQL-GUIDE.md](./RAILWAY-SQL-GUIDE.md)

**快速访问：**
1. Railway Dashboard → 选择项目 → PostgreSQL 服务
2. 点击 "SQL" 标签
3. 执行查询

**常用操作：**
```sql
-- 查看订单统计
SELECT 
  payment_status,
  COUNT(*) as count,
  SUM(total) as total_amount
FROM orders
GROUP BY payment_status;

-- 更新订单状态（谨慎使用）
UPDATE orders
SET 
  payment_status = 'paid',
  status = 'confirmed',
  paid_at = NOW()
WHERE order_number = 'ORD-2026-ABC123';
```

## 完整工作流程

### 客户视角

```
1. 下单 → 选择 Bank Transfer → 选择货币
2. 收到订单确认邮件（含 Proforma Invoice 链接）
3. 查看 Proforma Invoice → 获取银行账户信息
4. 通过银行转账付款
5. 上传付款凭证（可选但推荐）
6. 等待财务确认（1-2 个工作日）
7. 收到付款确认邮件
8. 订单开始处理
```

### 财务团队视角

```
1. 收到新订单通知（邮件）
2. 登录后台查看订单
3. 检查是否上传了付款凭证
4. 银行查收到账
5. 确认收款（后台或 API）
   - 更新订单状态为 paid/confirmed
   - 可选：发送确认邮件给客户
6. 订单转入处理流程
```

### 自动化流程

```
每天 9 AM UTC:
1. 系统检查 7-14 天前创建的未付款订单
2. 发送付款提醒邮件
3. 返回统计结果
```

## 测试指南

### 测试场景 1：完整付款流程

```bash
# 1. 创建测试订单（通过网站或 API）
# 2. 上传付款凭证
curl -X POST https://machrio.com/api/orders/ORD-TEST-123/upload-receipt \
  -F "receipt=@test-receipt.pdf"

# 3. 确认收款
curl -X POST https://machrio.com/api/admin/orders/{order_id}/confirm-payment \
  -H "Content-Type: application/json" \
  -d '{"notifyCustomer": true}'

# 4. 验证订单状态
curl https://machrio.com/api/orders/ORD-TEST-123
```

### 测试场景 2：逾期提醒

```bash
# 手动触发提醒（测试环境）
curl -H "Authorization: Bearer test-secret" \
     https://machrio.com/api/cron/remind-unpaid

# 检查日志
# Railway Dashboard → Logs → 查看提醒发送记录
```

### 测试场景 3：SQL 查询验证

```sql
-- 验证测试订单状态
SELECT order_number, payment_status, status, payment_receipt
FROM orders
WHERE order_number LIKE 'ORD-TEST-%';

-- 验证凭证上传
SELECT order_number, filename, verified, created_at
FROM payment_receipts
WHERE order_number LIKE 'ORD-TEST-%';
```

## 故障排查

### 问题 1：凭证上传失败

**可能原因：**
- 文件太大（超过 10MB）
- 文件格式不支持
- 订单不存在

**解决方案：**
```bash
# 检查文件信息
ls -lh receipt.pdf
file receipt.pdf

# 验证订单存在
curl https://machrio.com/api/orders/ORD-2026-ABC123
```

### 问题 2：财务确认 API 返回 401

**可能原因：**
- 缺少认证
- 权限不足

**解决方案：**
- 确保用户已登录且有 admin 权限
- 检查 API 端点权限设置

### 问题 3：定时任务未执行

**检查步骤：**
1. Railway Dashboard → Settings → Cron Jobs
2. 确认 Cron Job 已启用
3. 查看 Logs 确认执行记录
4. 验证 CRON_SECRET 环境变量

## 安全注意事项

1. **保护 API 端点**
   - `/api/admin/*` 需要 admin 权限
   - `/api/cron/*` 需要 CRON_SECRET 认证

2. **文件上传安全**
   - 限制文件类型（仅图片/PDF）
   - 限制文件大小（10MB）
   - 存储在安全目录

3. **数据库访问**
   - 生产环境使用只读账号进行查询
   - 避免直接 UPDATE/DELETE，使用应用程序 API

4. **客户隐私**
   - 付款凭证包含敏感信息
   - 仅授权人员可访问
   - 定期清理过期凭证

## 相关文档

- [Railway 部署指南](./RAILWAY-DEPLOY.md)
- [Railway SQL 操作指南](./RAILWAY-SQL-GUIDE.md)
- [Payload CMS 文档](https://payloadcms.com/docs)

## 需要帮助？

如有问题，请检查：
1. Railway Dashboard 日志
2. 数据库连接状态
3. 环境变量配置
4. 文件权限设置
