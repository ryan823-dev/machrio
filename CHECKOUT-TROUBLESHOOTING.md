# 下单失败故障排除指南

## 问题症状

在结账页面点击 "Place Order" 后显示 "Failed to create order" 错误。

## 可能的原因和解决方案

### 1. 数据库连接问题 ⚠️ 最常见

**症状：**
- 订单创建失败
- 控制台显示数据库连接错误
- 错误信息：`SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a string`

**解决方案：**

#### 在 Railway 上检查：

1. 登录 [Railway Dashboard](https://railway.app/)
2. 选择你的项目
3. 点击 **Variables** 标签
4. 确保 `DATABASE_URI` 环境变量已设置
5. 值应该是完整的 PostgreSQL 连接字符串，格式：
   ```
   postgresql://username:password@host:port/database
   ```

#### 获取正确的 DATABASE_URI：

1. 在 Railway 项目中，点击 **PostgreSQL** 服务
2. 点击 **Connect** 标签
3. 复制 **Postgres URL** (POOLER) 或 **Postgres URL** (Direct)
4. 粘贴到 Variables 中的 `DATABASE_URI` 变量
5. 保存后，Railway 会自动重新部署

### 2. Orders 表不存在

**症状：**
- 数据库连接成功
- 但显示 "relation 'orders' does not exist" 错误

**解决方案：**

运行以下 SQL 创建 orders 表：

```sql
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  customer_email TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  customer_company TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_status TEXT NOT NULL DEFAULT 'unpaid',
  payment_method TEXT,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  shipping_cost NUMERIC NOT NULL DEFAULT 0,
  tax NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  shipping_address JSONB,
  billing_address JSONB,
  items JSONB,
  notes TEXT,
  payment_info JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
```

**如何运行 SQL：**

1. 在 Railway 项目中，点击 PostgreSQL 服务
2. 点击 **Open Web UI** 或 **Connect** 按钮
3. 使用 Railway 提供的 SQL 编辑器运行上述 SQL
4. 或者使用本地工具（如 pgAdmin、DBeaver）连接到 Railway 数据库并运行

### 3. Stripe 密钥配置问题

**症状：**
- 订单创建成功，但 Stripe 支付失败
- 错误信息：`Online payment is not configured`

**解决方案：**

在 Railway Variables 中添加：
```
STRIPE_SECRET_KEY=sk_test_... 或 sk_live_...
```

从 [Stripe Dashboard](https://dashboard.stripe.com/apikeys) 获取密钥。

### 4. 产品数据问题

**症状：**
- 特定产品下单失败
- 错误信息包含产品 ID 或 SKU

**解决方案：**

检查产品是否存在且已发布：

```sql
SELECT id, name, slug, status, pricing 
FROM products 
WHERE slug = 'product-slug-here';
```

确保：
- 产品 `status = 'published'`
- `pricing` 字段包含有效的 JSON：`{"basePrice": 99.99, "currency": "USD"}`

### 5. 运费计算失败

**症状：**
- 结账页面运费加载失败
- 下单时运费计算错误

**解决方案：**

检查运费配置表：

```sql
SELECT * FROM shipping_rates ORDER BY country, method;
```

如果表不存在或为空，系统会使用默认运费（$25，满$200 包邮）。

## 本地测试

### 测试数据库连接

```bash
# 设置环境变量
export DATABASE_URI="postgresql://..."

# 运行测试脚本
npx tsx scripts/test-order-creation.ts
```

测试脚本会检查：
- ✅ 数据库连接
- ✅ Orders 表是否存在
- ✅ 表结构是否正确
- ✅ 订单创建功能

### 查看 Railway 日志

1. 登录 Railway Dashboard
2. 选择你的项目
3. 点击 **Deployments** 标签
4. 查看最新的部署日志
5. 点击 **View Logs** 查看运行时日志

查找包含以下关键词的日志：
- `Order creation error`
- `Database error`
- `createOrder error`

## 快速修复步骤

**如果下单失败，按以下顺序检查：**

1. ✅ **检查 Railway DATABASE_URI**
   - 确保已设置且格式正确
   - 重新部署应用

2. ✅ **检查 Orders 表**
   - 运行上面的 SQL 创建表
   - 验证表结构

3. ✅ **查看 Railway 日志**
   - 查找具体错误信息
   - 根据错误信息修复

4. ✅ **测试下单**
   - 使用真实数据测试
   - 查看是否成功

## 联系支持

如果以上步骤都无法解决问题，请提供：

1. Railway 部署日志中的错误信息
2. 浏览器控制台的错误信息
3. 订单创建 API 的响应内容

这会帮助快速定位问题。
