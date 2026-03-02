#!/bin/bash
# ============================================================
# Machrio ZKH 自动化导入 - VPS 部署脚本
# 使用方法: bash deploy.sh
# ============================================================

set -e

echo "====================================="
echo "  Machrio Python API 部署脚本"
echo "====================================="

# 1. 基础目录
APP_DIR="/opt/machrio-api"
TOOL_DIR="$APP_DIR/tool"
SERVICE_NAME="machrio-api"

# 2. 安装系统依赖
echo ""
echo "[1/6] 安装系统依赖..."
apt-get update -qq
apt-get install -y python3 python3-pip python3-venv nginx certbot python3-certbot-nginx

# 3. 创建应用目录
echo ""
echo "[2/6] 创建应用目录..."
mkdir -p "$APP_DIR"
mkdir -p "$TOOL_DIR"
mkdir -p "$APP_DIR/output"

# 4. 复制文件
echo ""
echo "[3/6] 复制应用文件..."
# 注意: 需要先将以下文件上传到服务器:
#   - python-api/ 目录 -> /opt/machrio-api/
#   - Machrio产品导入_完整代码包_v3/ -> /opt/machrio-api/tool/
echo "请确保已上传文件到以下位置:"
echo "  $APP_DIR/main.py"
echo "  $APP_DIR/requirements.txt"
echo "  $TOOL_DIR/核心代码/"
echo "  $TOOL_DIR/爬虫代码/"
echo "  $TOOL_DIR/配置文件/"

# 5. 创建虚拟环境并安装依赖
echo ""
echo "[4/6] 创建Python虚拟环境..."
cd "$APP_DIR"
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# 安装爬虫依赖 (可选, 如果需要爬虫功能)
pip install DrissionPage || echo "DrissionPage 安装失败 (需要 Chrome 浏览器)"

echo "Python 依赖安装完成"

# 6. 创建 systemd 服务
echo ""
echo "[5/6] 创建系统服务..."
cat > /etc/systemd/system/$SERVICE_NAME.service << 'UNIT'
[Unit]
Description=Machrio ZKH Import API
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/machrio-api
Environment=TOOL_PATH=/opt/machrio-api/tool
ExecStart=/opt/machrio-api/venv/bin/uvicorn main:app --host 127.0.0.1 --port 8100
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
UNIT

systemctl daemon-reload
systemctl enable $SERVICE_NAME
systemctl start $SERVICE_NAME

echo "服务已启动: $SERVICE_NAME"

# 7. 配置 Nginx 反向代理
echo ""
echo "[6/6] 配置 Nginx..."
cat > /etc/nginx/sites-available/machrio-api << 'NGINX'
server {
    listen 80;
    server_name api.machrio.com;  # 修改为你的域名

    location / {
        proxy_pass http://127.0.0.1:8100;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
}
NGINX

ln -sf /etc/nginx/sites-available/machrio-api /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

echo ""
echo "====================================="
echo "  部署完成!"
echo "====================================="
echo ""
echo "服务地址: http://127.0.0.1:8100"
echo "健康检查: curl http://127.0.0.1:8100/api/health"
echo ""
echo "下一步:"
echo "  1. 修改 Nginx 中的 server_name 为你的域名"
echo "  2. 运行 certbot --nginx 配置 HTTPS"
echo "  3. 在 Vercel 环境变量中设置:"
echo "     PYTHON_API_URL=https://api.machrio.com"
echo ""
