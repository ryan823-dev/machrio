# 🔑 Supabase 数据库密码获取指南

## 问题现状

当前 machrio 项目使用的数据库密码可能不正确，导致无法连接到 Supabase。

**已尝试的密码：**
- ❌ `MachrioDB2026` - Tenant or user not found
- ❌ `qgvPF1YbGso3swVy` - Tenant or user not found
- ❌ 其他组合 - 全部失败

**好消息：**
- ✅ 连接池端点可以正常 DNS 解析
- ✅ 美国区域连接池可以建立连接
- ✅ 网络限制问题已解决

## 如何获取正确的数据库密码

### 方法一：Supabase 控制台（推荐）

1. **访问 Supabase 控制台**
   ```
   https://supabase.com/dashboard/project/yderhgkjcsaqrsfntpqm
   ```

2. **进入数据库设置**
   ```
   Settings (左下角齿轮图标)
   → Database
   ```

3. **查看连接信息**
   - 找到 **Connection string** 部分
   - 选择 **URI** 标签
   - 复制完整的连接字符串

4. **连接字符串格式**
   ```
   postgresql://postgres.<project-ref>:<PASSWORD>@aws-0-<region>-1.pooler.supabase.com:6543/postgres
   
   例如：
   postgresql://postgres.pnqzjqpryqeqpmdqjhxc:CORRECT_PASSWORD@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
   ```

5. **更新 .env.local**
   ```bash
   USE_POSTGRES=1
   DATABASE_URI=postgresql://postgres.pnqzjqpryqeqpmdqjhxc:<CORRECT_PASSWORD>@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
   ```

### 方法二：重置数据库密码

如果忘记密码，可以重置：

1. **在 Supabase 控制台**
   ```
   Settings → Database
   → Reset Database Password
   ```

2. **设置新密码**
   - 建议使用强密码
   - 保存在安全的地方

3. **更新项目配置**
   - 使用新密码更新 `.env.local`

### 方法三：检查其他项目

如果你的其他 Supabase 项目使用相同密码，可以参考：

```bash
# 查看 ViciVidi 项目的密码
cat /Users/oceanlink/Documents/Qoder-1/ViciVidi/.env

# 查找 DATABASE_URL 中的密码部分
```

## 验证连接

获取密码后，运行测试脚本：

```bash
cd /Users/oceanlink/Documents/Qoder-1/machrio
node scripts/test-db-connection.cjs
```

**成功标志：**
```
✅ Supabase 直连：可用
   服务器时间：2026-03-24 10:30:00+00
```

## 启动开发服务器

密码验证成功后：

```bash
# 更新 .env.local
USE_POSTGRES=1
DATABASE_URI=postgresql://postgres.pnqzjqpryqeqpmdqjhxc:<CORRECT_PASSWORD>@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres

# 清理缓存并启动
rm -rf .next
npm run dev
```

**成功标志：**
```
✓ Ready in 2s
✓ Compiled / in 3s
```

## 技术说明

### 为什么使用连接池端点？

**连接池端点（推荐）：**
```
aws-0-ap-southeast-1.pooler.supabase.com:6543
✅ 可以 DNS 解析
✅ 性能更好
✅ 连接管理更优
```

**直连端点（不推荐）：**
```
db.yderhgkjcsaqrsfntpqm.supabase.co:5432
❌ 本地网络无法 DNS 解析
❌ 可能被防火墙阻止
```

### 地域选择

machrio 项目应该使用哪个区域？

**推荐顺序：**
1. `aws-0-ap-southeast-1.pooler.supabase.com` (新加坡) - 离中国最近
2. `aws-0-ap-northeast-1.pooler.supabase.com` (东京)
3. `aws-0-us-west-1.pooler.supabase.com` (美国西部)

选择标准：
- 网络延迟最低
- 最稳定

## 常见问题

### Q: 为什么其他项目可以连接？

A: 其他项目（如 ViciVidi）使用了正确的连接池端点格式：
```
aws-0-us-east-1.pooler.supabase.com:6543
```

而 machrio 之前使用的是：
```
db.yderhgkjcsaqrsfntpqm.supabase.co:5432  ❌
```

### Q: 密码正确但还是连接失败？

A: 检查以下几点：
1. 用户名格式是否正确（`postgres.<project-ref>`）
2. 连接池端点是否正确
3. 端口是否为 6543
4. SSL 配置是否正确

### Q: 可以使用直连端点吗？

A: 理论上可以，但：
- 本地网络可能无法解析 `db.*.supabase.co`
- 连接池端点性能更好
- 推荐使用连接池端点（端口 6543）

## 下一步

1. ✅ 从 Supabase 控制台获取正确密码
2. ✅ 更新 `.env.local` 配置
3. ✅ 运行连接测试
4. ✅ 启动开发服务器
5. ✅ 验证 100% Supabase 迁移

## 联系支持

如果仍有问题，请提供：
- 完整的连接字符串（隐藏密码）
- 错误信息
- 测试脚本输出
