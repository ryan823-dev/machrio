# AI 对话记录集成 - 快速配置指南

## ⚡ 3 分钟快速配置

### 1️⃣ 配置环境变量（1 分钟）

编辑 `.env.local` 文件，添加以下配置：

**开发环境（本地测试）**：
```bash
NEXT_PUBLIC_ADMIN_API_URL=http://localhost:8080
```

**生产环境**：
```bash
NEXT_PUBLIC_ADMIN_API_URL=https://admin-api.machrio.com
NEXT_PUBLIC_ADMIN_API_KEY=your-admin-api-key
```

### 2️⃣ 测试功能（2 分钟）

```bash
# 启动网站
npm run dev

# 访问 http://localhost:3000
# 与 AI 助手进行对话

# 查看浏览器控制台
# 应该看到：[Conversation Tracker] Conversation saved successfully: xxx
```

## ✅ 已完成的修改

以下文件已自动修改，**无需手动操作**：

- ✅ `src/lib/conversation-tracker.ts` - 核心服务（新建）
- ✅ `src/components/shared/AIAssistant.tsx` - 浮动助手（已修改）
- ✅ `src/components/shared/HeroAIChat.tsx` - Hero 聊天（已修改）
- ✅ `.env.local` - 环境变量（已更新）
- ✅ `.env.example` - 环境变量示例（已更新）

## 📊 功能特性

- ✅ 自动保存对话到 admin 后台
- ✅ 会话级别跟踪
- ✅ 自动对话类型识别
- ✅ 产品推荐信息保存
- ✅ 10 秒防抖自动保存
- ✅ 页面卸载时强制保存

## 🔍 验证方法

### 浏览器控制台

打开开发者工具（F12），查看控制台日志：

```
[Conversation Tracker] Conversation saved successfully: sess_1234567890_abc
```

### Session Storage

在 Application 标签页查看：

```
sessionStorage:
  machrio_conversation_session_id: "sess_1234567890_abc"
```

### 网络请求

在 Network 标签页查看：

```
POST http://localhost:8080/api/ai-conversations
Status: 200 OK
```

## 📖 详细文档

完整文档请查看：`AI-CONVERSATION-INTEGRATION.md`

## ❓ 常见问题

**Q: 没有看到保存日志？**
A: 检查 `NEXT_PUBLIC_ADMIN_API_URL` 是否配置正确

**Q: 保存失败但 AI 助手正常？**
A: 正常现象，保存失败不影响 AI 助手使用

**Q: 如何禁用对话保存？**
A: 删除或注释掉 `NEXT_PUBLIC_ADMIN_API_URL` 配置即可

## 🚀 生产部署

1. 配置生产环境 API 地址
2. 配置 API Key（如需要）
3. 部署网站代码
4. 测试生产环境功能
5. 在 admin 后台查看对话记录

---

**需要帮助？** 查看完整文档：`AI-CONVERSATION-INTEGRATION.md`
