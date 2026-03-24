# 生产环境批量导入修复指南

## 问题症状
错误：`Unexpected token 'A', 'An error o"... is not valid JSON`

## 根本原因
生产环境使用 MongoDB，但批量导入代码在处理某些数据库操作时可能返回了非 JSON 响应。

## 解决方案

### 方案 1：保持 MongoDB（推荐）
生产环境继续使用 MongoDB，无需更改。

**需要的环境变量（已在 Vercel 配置）**：
- `MONGODB_URI` ✅
- `PAYLOAD_SECRET` ✅

### 方案 2：迁移到 Supabase
如果需要切换到 Supabase，需要在 Vercel 添加以下环境变量：
- `USE_POSTGRES=1`
- `DATABASE_URI=postgresql://postgres:Machrio@2026@db.yderhgkjcsaqrsfntpqm.supabase.co:5432/postgres`

## 当前状态
- ✅ 代码已修复：增强错误处理
- ✅ 依赖版本已统一：所有 Payload 包 3.17.1
- ✅ 需要重新部署到 Vercel

## 部署步骤
```bash
cd machrio
vercel --prod
```
