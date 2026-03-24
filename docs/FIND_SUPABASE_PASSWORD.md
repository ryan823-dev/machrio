# 🔑 如何获取 Supabase 数据库密码

## 问题诊断

当前密码 `mACHRIOdb2026` 返回错误：`Tenant or user not found`

这说明密码不正确，或者数据库用户不存在。

---

## 步骤 1：打开 Supabase 控制台

**已为你打开：**
https://supabase.com/dashboard/project/yderhgkjcsaqrsfntpqm/settings/database

---

## 步骤 2：找到数据库密码

### 选项 A：查看连接字符串

1. 在打开的页面中，**向下滚动**
2. 找到 **"Connection string"** 部分
3. 点击 **"URI"** 标签
4. 你会看到类似这样的字符串：

```
postgresql://postgres.pnqzjqpryqeqpmdqjhxc:XXXXXXXXX@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
```

5. **密码就是 `:` 和 `@` 之间的部分**（上面的 `XXXXXXXXX`）

---

### 选项 B：重置密码（如果找不到或忘记了）

1. 在同一个页面，找到 **"Reset Database Password"** 按钮
2. 点击它
3. 输入新密码，例如：`Machrio@2026Secure`
4. 点击 **"Reset Password"**
5. **复制新的连接字符串**

---

## 步骤 3：验证密码格式

**正确的密码特点：**
- ✅ 区分大小写
- ✅ 可能包含特殊字符
- ✅ 长度至少 8 位
- ✅ 示例：`xZR9V0IR2uqYGQCe`（ViciVidi 项目的密码）

---

## 步骤 4：更新配置

获取正确的密码后，告诉我，我会立即：

1. 更新 `.env.local` 文件
2. 测试数据库连接
3. 启动 100% Supabase 的开发服务器

---

## 快速验证

或者你可以直接运行这个命令测试密码：

```bash
cd /Users/oceanlink/Documents/Qoder-1/machrio
node -e "
const { Pool } = require('pg');
const pool = new Pool({
  host: 'aws-0-ap-southeast-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  user: 'postgres.pnqzjqpryqeqpmdqjhxc',
  password: 'YOUR_PASSWORD_HERE',
  ssl: { rejectUnauthorized: false }
});
pool.query('SELECT 1', (err) => {
  if (err) console.log('❌ 失败:', err.message);
  else console.log('✅ 成功！');
  pool.end();
});
"
```

把 `YOUR_PASSWORD_HERE` 替换成你从控制台复制的密码。

---

## 常见问题

### Q: 密码是正确的但还是失败？

A: 检查以下几点：
1. 用户名是否正确（`postgres.pnqzjqpryqeqpmdqjhxc`）
2. 区域是否正确（`aws-0-ap-southeast-1.pooler.supabase.com`）
3. 端口是否为 6543
4. 是否使用了 SSL

### Q: 控制台显示的连接字符串不一样？

A: 以控制台显示的为准！复制完整的连接字符串，替换 `.env.local` 中的 `DATABASE_URI`。

### Q: 重置密码后会影响生产环境吗？

A: 会！重置密码后：
- ✅ 本地开发可以立即使用新密码
- ⚠️ 需要更新 Vercel 的环境变量
- ⚠️ 需要更新所有使用这个数据库的地方

---

## 联系支持

如果还是不行，请：
1. 截图 Supabase 控制台的连接字符串（隐藏密码）
2. 或者直接把完整的连接字符串发给我
3. 我会帮你配置好
