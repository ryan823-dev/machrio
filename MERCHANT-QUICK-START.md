# Google Merchant XML Feed - 快速开始

## 🎯 完成的工作

已为 Machrio.com 创建符合 Google Merchant Center 规范的产品 XML feed 系统。

## 📁 创建的文件

### 1. API 路由
**`src/app/api/merchant-feed/route.ts`**
- 动态生成 XML feed
- 包含所有必需字段（id, title, description, link, image_link, availability, price, brand）
- 包含推荐字段（condition, product_type, mpn）
- 自动查询品牌和分类信息
- 缓存优化（1 小时浏览器缓存，24 小时 CDN 缓存）

### 2. 测试脚本
**`scripts/test-merchant-feed.ts`**
- 验证 XML 格式
- 检查必需和可选字段
- 统计产品数量
- 输出示例产品
- 保存 XML 到文件供检查

### 3. 使用指南
**`GOOGLE-MERCHANT-GUIDE.md`**
- 完整的提交步骤
- 验证方法
- 故障排除
- 最佳实践

## 🚀 快速使用

### 本地测试

```bash
# 1. 启动开发服务器
npm run dev

# 2. 运行测试脚本（在另一个终端）
npx tsx scripts/test-merchant-feed.ts
```

### 部署到生产环境

```bash
# 1. 提交代码
git add .
git commit -m "feat: Add Google Merchant Center XML feed"
git push

# 2. Railway 会自动部署

# 3. 验证生产 URL
curl https://machrio.com/api/merchant-feed
```

### 提交到 Google Merchant Center

1. 登录 [Google Merchant Center](https://merchants.google.com/)

2. 导航到 **Products** > **Feeds**

3. 点击 **+** 添加新 Feed

4. 配置：
   - **Feed 名称**: Machrio Product Feed
   - **Feed 类型**: XML
   - **抓取 URL**: `https://machrio.com/api/merchant-feed`
   - **抓取频率**: Daily（每天）

5. 点击 **Save and fetch**

## 📊 XML Feed 规格

### 必需字段 ✅
- `g:id` - 产品 SKU
- `g:title` - 产品名称（≤150 字符）
- `g:description` - 产品描述（≤5000 字符）
- `g:link` - 产品页面 URL
- `g:image_link` - 产品图片 URL
- `g:availability` - 库存状态
- `g:price` - 价格（格式：`29.99 USD`）
- `g:brand` - 品牌名称

### 推荐字段 ✅
- `g:condition` - 产品状态（new/refurbished/used）
- `g:product_type` - 分类路径
- `g:mpn` - 制造商部件号

## 🔍 验证检查清单

在提交之前，请确保：

- [ ] 测试脚本运行无错误
- [ ] 所有必需字段都存在
- [ ] 产品图片 URL 有效（无 404）
- [ ] 价格格式正确（包含货币代码）
- [ ] 产品页面可以正常访问
- [ ] 数据库有已发布的产品

## 📈 监控和维护

### 监控指标
- XML feed 大小（应在合理范围内）
- 产品数量（与数据库一致）
- Google Merchant Center 的 Diagnostics 页面

### 常见问题
查看 `GOOGLE-MERCHANT-GUIDE.md` 中的故障排除部分

## 📚 相关资源

- [Google Merchant Center 产品数据规范](https://support.google.com/merchants/answer/12631822)
- [XML Feed 格式指南](https://support.google.com/merchants/answer/7052112)
- [产品 Feed 最佳实践](https://support.google.com/merchants/answer/7439058)

## 🎉 完成

XML feed 已准备就绪，可以直接提交到 Google Merchant Center！
