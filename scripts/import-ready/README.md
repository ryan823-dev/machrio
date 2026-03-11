# 内容导入指南

## 📋 已准备的内容

本目录包含3篇已准备好的文章，可直接导入到Payload CMS中：

1. **What Is MRO in Manufacturing?**
   - 文件: `mro-what-is-mro.json`
   - 类型: Industry Insight
   - 状态: 已发布

2. **What Are MRO Products?**
   - 文件: `mro-what-are-products.json`
   - 类型: Buying Guide
   - 状态: 已发布

3. **Types of Respirators Explained**
   - 文件: `respirators-types-explained.json`
   - 类型: Industry Insight
   - 状态: 已发布

## 🚀 手动导入步骤

### 步骤1: 访问管理面板
1. 打开浏览器访问: http://localhost:3000/admin
2. 使用管理员账号登录

### 步骤2: 创建文章
1. 在左侧菜单点击 "Articles" (文章)
2. 点击 "Create New" (新建)

### 步骤3: 填充文章信息
对于每篇文章，从对应的JSON文件中复制以下信息：

**基本信息:**
- Title: 复制 `title` 字段
- Slug: 复制 `slug` 字段
- Excerpt: 复制 `excerpt` 字段
- Category: 选择对应的分类
- Tags: 添加列出的标签
- Author: 通常是 "Machrio Team"
- Status: 设置为 "Published" (已发布)

**SEO信息:**
- Meta Title: 复制 `seo.metaTitle`
- Meta Description: 复制 `seo.metaDescription`

### 步骤4: 添加文章内容
由于Rich Text内容较复杂，建议:
1. 先创建文章基本框架
2. 在文章编辑页面手动添加主要内容
3. 参考原始JSON文件中的content结构

## 📝 注意事项

- 所有文章都已标记为"已发布"状态
- 建议按顺序导入：先导入MRO相关文章，再导入Respirator文章
- 导入后可在前端验证：http://localhost:3000/knowledge-center

## 🔧 技术细节

如果需要自动化导入，可以考虑：
1. 使用Payload的API端点
2. 创建专门的导入脚本
3. 或者等待后续开发完整的导入工具

当前的手动导入方法最为可靠且直观。