# AI 对话记录集成指南

本文档说明如何在 machrio.com 前台网站集成 AI 对话记录保存功能，将对话数据同步到 admin 后台管理系统。

## 📋 概述

集成后的功能：
- ✅ 自动保存 AI 助手与用户的对话到 admin 后台
- ✅ 会话级别的对话跟踪
- ✅ 自动检测对话类型（产品咨询、RFQ 询价、技术支持等）
- ✅ 支持产品推荐信息保存
- ✅ 自动保存机制（10 秒防抖）
- ✅ 页面卸载时自动保存剩余对话

## 🔧 配置步骤

### 1. 环境变量配置

在 `.env.local` 文件中添加以下配置：

```bash
# AI Conversation Tracking (Admin Backend)
# 开发环境（本地 admin 后台）
NEXT_PUBLIC_ADMIN_API_URL=http://localhost:8080
# 可选：显式指定后台 ingest 路径
# NEXT_PUBLIC_ADMIN_API_CONVERSATION_PATH=/api/ai-conversations/ingest-snapshot

# 生产环境
# NEXT_PUBLIC_ADMIN_API_URL=https://admin-api.machrio.com

# 可选：API Key 认证
# NEXT_PUBLIC_ADMIN_API_KEY=your-admin-api-key
```

### 2. 已完成的代码修改

以下文件已经修改完成，无需额外操作：

#### ✅ `src/lib/conversation-tracker.ts`
核心服务文件，提供：
- `ConversationTracker` 类 - 会话跟踪器
- `saveConversation()` - 保存对话函数
- `generateSessionId()` - 生成会话 ID
- 自动对话类型检测
- 用户数据收集

#### ✅ `src/components/shared/AIAssistant.tsx`
浮动 AI 助手组件，已添加：
- 对话跟踪器初始化
- 消息自动保存
- 产品推荐信息保存

#### ✅ `src/components/shared/HeroAIChat.tsx`
Hero AI 聊天组件，已添加：
- 对话跟踪器初始化
- 消息自动保存
- 产品推荐信息保存

## 📊 工作原理

### 对话保存流程

```
用户发送消息
    ↓
AIAssistant/HeroAIChat 接收
    ↓
ConversationTracker.addMessage()
    ↓
等待 10 秒（防抖）
    ↓
saveConversation() 调用
    ↓
如果配置了 NEXT_PUBLIC_ADMIN_API_URL:
POST {ADMIN_API_URL}/api/ai-conversations/ingest-snapshot
    ↓
如果后台仍是旧接口，自动回退:
POST {ADMIN_API_URL}/api/ai-conversations
    ↓
如果未配置:
POST /api/ai-conversation-sync
    ↓
Admin 后台存储
```

### 会话管理

- **会话 ID 生成**：首次打开页面时自动生成，存储在 `sessionStorage` 中
- **会话持久性**：页面刷新保持同一会话 ID
- **会话重置**：用户注销或关闭浏览器后重新打开会创建新会话

### 自动保存机制

- **防抖时间**：10 秒（可配置）
- **触发条件**：每次添加新消息后重新计时
- **强制保存**：页面卸载时立即保存

## 📝 保存的数据内容

### 对话信息

```typescript
{
  sessionId: "sess_1234567890_abc",
  messages: [
    {
      role: "user" | "assistant",
      content: "消息内容",
      products?: [
        { id, name, sku, price }
      ]
    }
  ],
  user?: {
    userId?: string,
    userName?: string,
    userEmail?: string,
    userPhone?: string,
    userCompany?: string
  },
  sourcePage: "页面标题 - /path",
  sourceUrl: "https://machrio.com/path",
  conversationType: "product_inquiry" | "rfq_inquiry" | "shipping_inquiry" | "returns_support" | "technical_support" | "general",
  metadata: {
    userAgent: "...",
    referrer: "...",
    timestamp: "2026-03-28T12:00:00.000Z"
  }
}
```

### 对话类型自动检测

系统会根据用户消息内容自动识别对话类型：

| 类型 | 检测关键词 |
|------|-----------|
| `product_inquiry` | product, item, buy, price, cost, quote |
| `rfq_inquiry` | bulk, rfq, wholesale, large quantity, b2b |
| `shipping_inquiry` | shipping, delivery, track |
| `returns_support` | return, refund, exchange |
| `technical_support` | how to, help, issue, problem |
| `general` | 其他 |

## 🧪 测试方法

### 1. 本地测试

```bash
# 1. 配置开发环境变量
echo "NEXT_PUBLIC_ADMIN_API_URL=http://localhost:8080" >> .env.local
# 如后台使用新快照接口，可显式指定（默认也会优先尝试）
# echo "NEXT_PUBLIC_ADMIN_API_CONVERSATION_PATH=/api/ai-conversations/ingest-snapshot" >> .env.local

# 2. 启动网站
npm run dev

# 3. 打开浏览器访问 http://localhost:3000

# 4. 与 AI 助手进行对话

# 5. 查看浏览器控制台日志
# 应该看到类似输出：
# [Conversation Tracker] Conversation saved successfully: uuid-here
```

### 2. 检查保存结果

如果 admin 后台已部署并运行：

```bash
# 访问 admin 后台查看对话记录
http://localhost:8080/admin/ai-conversations
```

### 3. 调试模式

在浏览器控制台查看：
- `[Conversation Tracker]` 开头的日志
- 网络请求（Network 标签页）
- Session Storage 中的 `machrio_conversation_session_id`

## 🔐 数据隐私说明

根据要求，本集成不过多考虑数据隐私限制：

- ❌ 不强制要求用户同意
- ❌ 不强制匿名化处理
- ❌ 不限制数据保留时间

**注意**：如果未来需要 GDPR 合规，可以：
1. 添加用户同意提示
2. 实现数据匿名化
3. 添加数据导出/删除功能
4. 设置数据保留策略

## 🛠️ 高级用法

### 手动保存对话

```typescript
import { ConversationTracker } from '@/lib/conversation-tracker'

const tracker = new ConversationTracker()

tracker.addMessage({
  role: 'user',
  content: '手动添加的消息'
})

// 立即保存（不等待防抖）
await tracker.save()
```

### 获取当前会话 ID

```typescript
import { getSessionId } from '@/lib/conversation-tracker'

const sessionId = getSessionId()
console.log('当前会话 ID:', sessionId)
```

### 重置会话

```typescript
import { resetSessionId } from '@/lib/conversation-tracker'

// 用户注销时调用
resetSessionId()
```

### 批量保存（离线同步）

```typescript
import { batchSaveConversations } from '@/lib/conversation-tracker'

const conversations = [/* 对话数据数组 */]
const savedCount = await batchSaveConversations(conversations)
console.log(`成功保存 ${savedCount} 条对话`)
```

## 📦 API 端点

### 保存对话

```
POST {ADMIN_API_URL}/api/ai-conversations/ingest-snapshot
Content-Type: application/json
Authorization: Bearer {API_KEY} (可选)

Body:
{
  "sessionId": "sess_xxx",
  "messages": [...],
  "user": {...},
  "sourcePage": "...",
  "sourceUrl": "...",
  "conversationType": "...",
  "metadata": {...}
}
```

如果后台仍保留旧接口，前台会自动回退到：

```
POST {ADMIN_API_URL}/api/ai-conversations
```

### 本地 fallback（未配置外部后台地址时）

```
POST /api/ai-conversation-sync
Content-Type: application/json

Body:
{
  "sessionId": "sess_xxx",
  "messages": [...],
  "user": {...},
  "sourcePage": "...",
  "sourceUrl": "...",
  "conversationType": "...",
  "metadata": {...}
}
```

### 保存单条消息

```
POST {ADMIN_API_URL}/api/ai-conversations/session/{sessionId}/messages
Content-Type: application/json

Body:
{
  "messageType": "user" | "assistant",
  "content": "...",
  "contentType": "text",
  "contextData": {...}
}
```

### 批量保存

```
POST {ADMIN_API_URL}/api/ai-conversations/batch
Content-Type: application/json

Body:
{
  "conversations": [...]
}
```

## ⚠️ 注意事项

### 1. Admin API URL 未配置

如果未配置 `NEXT_PUBLIC_ADMIN_API_URL`，系统会：
- 在控制台输出警告
- 跳过保存操作
- 不影响 AI 助手正常使用

### 2. 网络错误处理

如果保存失败：
- 在控制台输出错误日志
- 不显示错误提示给用户
- 不影响 AI 助手正常使用

### 3. 性能优化

- 使用防抖机制减少 API 调用
- 仅在页面卸载时保存剩余消息
- 不阻塞 UI 渲染

## 🐛 故障排查

### 问题：对话没有保存

**检查步骤**：
1. 检查 `NEXT_PUBLIC_ADMIN_API_URL` 是否配置
2. 查看浏览器控制台是否有错误日志
3. 检查网络请求是否成功（Network 标签页）
4. 确认 admin 后台 API 正常运行

### 问题：会话 ID 变化频繁

**原因**：
- 使用了隐私浏览模式
- 清除了浏览器数据
- SessionStorage 被清除

**解决方案**：正常现象，不影响功能使用

### 问题：保存延迟过高

**检查**：
1. 网络连接是否正常
2. Admin API 响应时间
3. 是否有大量消息需要保存

**优化**：可以调整防抖时间（默认 10 秒）

## 📚 相关文件

- `src/lib/conversation-tracker.ts` - 核心服务
- `src/components/shared/AIAssistant.tsx` - 浮动助手组件
- `src/components/shared/HeroAIChat.tsx` - Hero 聊天组件
- `.env.local` - 环境变量配置
- `.env.example` - 环境变量示例

## 🚀 下一步

1. ✅ 完成代码集成
2. ⏳ 配置 admin 后台 API 地址
3. ⏳ 测试对话保存功能
4. ⏳ 部署到生产环境
5. ⏳ 监控和调优

## 📞 支持

如有问题，请查看：
- Admin 后台文档：`d:\qoder\machrio-admin\AI-CONVERSATION-MANAGEMENT.md`
- 数据库迁移：`d:\qoder\machrio-admin\backend\migrations\V005__create_ai_conversations_tables.sql`
