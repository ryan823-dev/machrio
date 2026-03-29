# Google Merchant Center 产品 Feed 使用指南

## 概述

Machrio.com 已自动生成 Google Merchant Center 兼容的 XML 产品 feed 文件，可以直接提交到 Google Merchant Center 平台。

## XML Feed 地址

```
https://machrio.com/api/merchant-feed
```

## 自动生成的 XML 包含以下产品信息

### 必需字段（Required）
- ✅ `g:id` - 产品 SKU 或 ID
- ✅ `g:title` - 产品名称（最多 150 字符）
- ✅ `g:description` - 产品描述（最多 5000 字符）
- ✅ `g:link` - 产品页面 URL
- ✅ `g:image_link` - 主产品图片 URL
- ✅ `g:availability` - 库存状态（in_stock/out_of_stock/backorder）
- ✅ `g:price` - 价格和货币（例如：29.99 USD）
- ✅ `g:brand` - 品牌名称

### 可选但推荐字段（Recommended）
- ✅ `g:condition` - 产品状态（new/refurbished/used）
- ✅ `g:product_type` - 产品分类路径
- ✅ `g:mpn` - 制造商部件号（使用 SKU）

## 提交到 Google Merchant Center 的步骤

### 1. 访问 Google Merchant Center
前往 [Google Merchant Center](https://merchants.google.com/) 并登录您的账户

### 2. 添加产品 Feed
1. 点击左侧菜单的 **"Products"** > **"Feeds"**
2. 点击蓝色 **"+"** 按钮添加新 feed
3. 选择目标国家/地区和销售语言

### 3. 选择 Feed 类型
- 选择 **"Scheduled fetch"**（定期抓取）
- Feed 类型选择 **"XML"**

### 4. 配置 Feed 设置
填写以下信息：

**Feed 名称：**
```
Machrio Product Feed
```

**Feed 文件名称：**
```
merchant-feed.xml
```

**抓取 URL：**
```
https://machrio.com/api/merchant-feed
```

**抓取频率：**
- 选择 **"Daily"**（每天）
- 建议时间：凌晨 2:00（根据您的时区）

### 5. 确认并保存
- 确认所有设置
- 点击 **"Save and fetch"**

## 验证 XML Feed

### 本地测试

**1. 启动开发服务器**
```bash
cd machrio
npm run dev
```

**2. 运行测试脚本**
```bash
npx tsx scripts/test-merchant-feed.ts
```

测试脚本会：
- ✅ 验证所有必需字段
- ✅ 验证可选推荐字段
- ✅ 统计产品数量
- ✅ 保存 XML 输出到 `merchant-feed-output.xml`
- ✅ 显示前 3 个产品示例

**3. 在浏览器中查看**
```
http://localhost:3000/api/merchant-feed
```

### 生产环境验证

**1. 部署到 Railway**
```bash
git add .
git commit -m "Add Google Merchant XML feed"
git push
```

**2. 验证生产 URL**
```
https://machrio.com/api/merchant-feed
```

**3. 使用 Google 的 Feed 验证工具**
1. 访问 [Google Merchant Center Feed Specification](https://support.google.com/merchants/answer/7052112)
2. 检查 XML 格式是否符合规范

## XML 示例

```xml
<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>Machrio Industrial Supplies Product Feed</title>
    <link>https://machrio.com</link>
    <description>Industrial supplies and equipment from Machrio</description>
    <item>
      <g:id>PROD-001</g:id>
      <g:title>Safety Gloves - Industrial Grade</g:title>
      <g:description>High-quality industrial safety gloves with cut resistance</g:description>
      <g:link>https://machrio.com/products/safety-gloves-industrial</g:link>
      <g:image_link>https://machrio.com/images/safety-gloves.jpg</g:image_link>
      <g:availability>in_stock</g:availability>
      <g:price>29.99 USD</g:price>
      <g:brand>Machrio</g:brand>
      <g:condition>new</g:condition>
      <g:product_type>Safety Equipment > Hand Protection > Gloves</g:product_type>
      <g:mpn>PROD-001</g:mpn>
    </item>
    <!-- 更多产品... -->
  </channel>
</rss>
```

## 缓存策略

XML feed 使用以下缓存策略：
- **浏览器缓存：** 1 小时（3600 秒）
- **CDN 缓存：** 24 小时（86400 秒）stale-while-revalidate

这确保了：
1. Google 每次抓取都能获取较新的数据
2. 不会给数据库造成过大压力
3. Feed 生成速度快（通常在 1 秒内）

## 故障排除

### 问题：XML 显示为空
**解决方案：**
- 检查数据库是否有已发布的产品
- 确认 `DATABASE_URI` 环境变量已正确配置

### 问题：缺少品牌信息
**解决方案：**
- 确保产品在数据库中有关联的 `brand_id`
- 在数据库中创建品牌数据

### 问题：价格显示为 0.00
**解决方案：**
- 在数据库中为产品添加价格信息
- 检查 `pricing` 字段的 JSON 格式是否正确

## 相关文档

- [Google Merchant Center 产品数据规范](https://support.google.com/merchants/answer/12631822)
- [XML Feed 格式指南](https://support.google.com/merchants/answer/7052112)
- [产品 Feed 最佳实践](https://support.google.com/merchants/answer/7439058)

## 技术支持

如有问题，请联系技术团队或通过 [Machrio 联系页面](https://machrio.com/contact) 获取帮助。
