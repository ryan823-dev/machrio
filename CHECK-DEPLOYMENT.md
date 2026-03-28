# 部署状态检查 - machrio.com

## 当前状态

❌ **网站返回 404** - https://www.machrio.com

## 可能的原因

### 1. Railway 部署未完成
- 代码已推送到 GitHub
- Railway 应该自动触发部署
- 部署需要 2-5 分钟

### 2. 域名未配置到 Railway
- machrio.com 域名可能还指向 Vercel
- 需要在 Railway 中配置自定义域名

### 3. DNS 记录未更新
- DNS 传播需要时间（最多 48 小时）
- 可能需要等待 DNS 更新

## 解决方案

### 方案 1：等待 Railway 自动部署

1. 访问：https://github.com/ryan823-dev/machrio/actions
2. 检查最新的 GitHub Actions 是否成功
3. 访问：https://railway.app/dashboard
4. 查看 machrio 项目的部署状态

### 方案 2：在 Railway 中配置域名

1. **访问 Railway Dashboard**
   - https://railway.app/dashboard
   - 选择 machrio 项目

2. **配置自定义域名**
   - 进入 **Settings** 标签
   - 找到 **Domains** 部分
   - 点击 **"Add Custom Domain"**
   - 输入：`machrio.com` 和 `www.machrio.com`

3. **更新 DNS 记录**
   - Railway 会提供 DNS 记录信息
   - 通常是 CNAME 或 A 记录
   - 在你的域名注册商处更新 DNS

4. **等待 DNS 传播**
   - 通常需要几分钟到几小时
   - 最多可能需要 48 小时

### 方案 3：检查当前部署状态

访问以下链接检查：

1. **Railway 部署 URL**（临时域名）
   - 格式：`https://[project-id].up.railway.app`
   - 在 Railway Dashboard 中可以找到

2. **GitHub Actions 状态**
   - https://github.com/ryan823-dev/machrio/actions
   - 查看最新的部署 workflow

## 验证步骤

部署完成后，依次检查：

1. ✅ **Railway 临时 URL** 能访问
2. ✅ **https://machrio.com** 能访问
3. ✅ **https://www.machrio.com** 能访问
4. ✅ **https://www.machrio.com/sitemap.xml** 能访问
5. ✅ **https://www.machrio.com/robots.txt** 显示正确的 sitemap 地址

## 快速检查命令

```bash
# 检查 DNS
nslookup machrio.com
nslookup www.machrio.com

# 检查网站状态
curl -I https://www.machrio.com
curl -I https://www.machrio.com/sitemap.xml

# 检查 sitemap 内容
curl https://www.machrio.com/sitemap.xml
```

## 如果还是 404

1. 确认 Railway 部署成功（查看 Railway Dashboard）
2. 确认域名已添加到 Railway
3. 检查 DNS 是否已更新
4. 尝试清除浏览器缓存
5. 使用不同的 DNS 服务器（如 8.8.8.8）

## 联系支持

如果问题持续，请提供：
- Railway Dashboard 截图
- DNS 记录截图
- 错误页面截图
