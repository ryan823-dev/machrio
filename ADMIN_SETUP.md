# Machrio 后台本地安装指南

## 环境要求
- Node.js 18+ (推荐 LTS 版本)
- 下载地址：https://nodejs.org/

## 安装步骤

### 1. 安装 Node.js
下载并安装 Node.js (LTS 版本)

### 2. 获取代码
将 `machrio` 文件夹复制到目标电脑

### 3. 安装依赖
打开终端，进入项目目录，运行：
```bash
npm install
```

### 4. 配置环境变量
复制 `env.local.example` 为 `.env.local`：
```bash
# Windows
copy env.local.example .env.local

# Mac/Linux
cp env.local.example .env.local
```

### 5. 启动开发服务器
```bash
npm run dev
```

### 6. 访问后台
浏览器打开：http://localhost:3000/admin

## 登录账号
使用现有的 admin 账号登录

## 注意事项
- 本地开发修改代码后会自动刷新
- 图片上传会直接上传到阿里云 OSS
- 数据库使用 Supabase PostgreSQL，无需本地安装

## 常见问题

### 安装依赖报错
```bash
# 清除缓存后重试
npm cache clean --force
npm install
```

### 数据库连接失败
检查 `.env.local` 中的 `DATABASE_URI` 是否正确

### 端口被占用
```bash
# 修改端口
set PORT=3001 && npm run dev
# 或 Mac/Linux:
PORT=3001 npm run dev
```
