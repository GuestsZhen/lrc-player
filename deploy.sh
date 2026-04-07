#!/bin/bash

# 服务器自动部署脚本
# 此脚本在服务器上执行，用于完成部署后的操作

set -e

DEPLOY_PATH="${1:-/var/www/lrc-player}"

echo "================================"
echo "开始部署 LRC Player"
echo "================================"
echo "部署路径: $DEPLOY_PATH"
echo "时间: $(date)"
echo "================================"

# 检查部署目录是否存在
if [ ! -d "$DEPLOY_PATH" ]; then
    echo "错误: 部署目录不存在: $DEPLOY_PATH"
    exit 1
fi

# 进入部署目录
cd "$DEPLOY_PATH"

# 设置正确的文件权限
echo "设置文件权限..."
chmod -R 755 .
chown -R www-data:www-data . 2>/dev/null || true

# 清理旧文件（可选）
echo "清理临时文件..."
find . -name "*.tmp" -delete 2>/dev/null || true
find . -name ".DS_Store" -delete 2>/dev/null || true

# 重启 Nginx（如果需要）
echo "重启 Nginx..."
if command -v systemctl &> /dev/null; then
    sudo systemctl reload nginx 2>/dev/null || echo "Nginx reload skipped"
elif command -v service &> /dev/null; then
    sudo service nginx reload 2>/dev/null || echo "Nginx reload skipped"
else
    echo "未找到 Nginx 服务管理命令"
fi

# 验证部署
echo "验证部署..."
if [ -f "index.html" ]; then
    echo "✓ index.html 存在"
else
    echo "✗ 警告: index.html 不存在"
fi

if [ -d "assets" ]; then
    echo "✓ assets 目录存在"
else
    echo "✗ 警告: assets 目录不存在"
fi

echo "================================"
echo "部署完成！"
echo "================================"
echo "部署时间: $(date)"
echo "================================"
