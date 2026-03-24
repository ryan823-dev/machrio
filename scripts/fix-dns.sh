#!/bin/bash

echo "🔧 Supabase DNS 修复工具"
echo "======================"
echo ""

# 检查当前 DNS
echo "📋 当前 DNS 配置:"
networksetup -getdnsservers Wi-Fi 2>/dev/null || echo "  Wi-Fi: 未配置"
networksetup -getdnsservers Ethernet 2>/dev/null || echo "  Ethernet: 未配置"
echo ""

# 尝试使用 Google DNS
echo "🔄 尝试设置 Google DNS..."
sudo networksetup -setdnsservers Wi-Fi 8.8.8.8 8.8.4.4 1.1.1.1
sudo networksetup -setdnsservers Ethernet 8.8.8.8 8.8.4.4 1.1.1.1

# 清理 DNS 缓存
echo "🧹 清理 DNS 缓存..."
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder

# 测试 DNS 解析
echo ""
echo "🔍 测试 DNS 解析:"
echo "  db.yderhgkjcsaqrsfntpqm.supabase.co"
nslookup db.yderhgkjcsaqrsfntpqm.supabase.co 2>&1 | grep -A 2 "Name:" || echo "  ❌ 解析失败"

echo ""
echo "💡 提示：如果仍然失败，可能需要："
echo "  1. 重启路由器"
echo "  2. 检查防火墙设置"
echo "  3. 使用 VPN 或代理"
echo ""
