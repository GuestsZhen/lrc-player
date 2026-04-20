#!/bin/bash

# ========================================
# ExoPlayer 去人声功能测试脚本
# ========================================

echo "🎤 ========================================"
echo "🎤 ExoPlayer 相位抵消法去人声功能测试"
echo "🎤 ========================================"
echo ""

# 检查设备连接
echo "📱 步骤 1/5: 检查 Android 设备连接..."
if ! adb devices | grep -q "device$"; then
    echo "❌ 错误: 未检测到 Android 设备"
    echo "请确保:"
    echo "  1. USB 调试已开启"
    echo "  2. 设备已通过 USB 连接"
    echo "  3. 已授权 USB 调试"
    exit 1
fi
echo "✅ 设备已连接"
echo ""

# 构建和部署
echo "🔨 步骤 2/5: 构建和部署应用..."
cd /Volumes/data/lingmaProjects0418/lrc-player
npm run cap:android:deploy

if [ $? -ne 0 ]; then
    echo "❌ 部署失败"
    exit 1
fi
echo "✅ 部署成功"
echo ""

# 等待应用启动
echo "⏳ 步骤 3/5: 等待应用启动 (5秒)..."
sleep 5
echo "✅ 应用已启动"
echo ""

# 启动日志监控
echo "📊 步骤 4/5: 启动日志监控..."
echo "提示: 按 Ctrl+C 停止日志监控"
echo ""
echo "=========================================="
echo "🎤 测试说明:"
echo "=========================================="
echo "1. 在应用中进入 Player 页面"
echo "2. 播放一首歌曲"
echo "3. 点击右下角的 '🎤 原唱模式 OFF' 按钮"
echo "4. 观察:"
echo "   - 按钮变为红色 '🎤 伴奏模式 ON'"
echo "   - 调试面板显示启用信息"
echo "   - 音频中的人声应该消失"
echo "5. 再次点击按钮关闭去人声"
echo "6. 确认人声恢复"
echo "=========================================="
echo ""

# 过滤相关日志
adb logcat -c  # 清除旧日志
adb logcat | grep -E "VocalRemovalAP|ExoPlayerPlugin.*Vocal|Player Debug" &
LOGCAT_PID=$!

echo "🔍 正在监控日志..."
echo ""

# 等待用户手动测试
read -p "按 Enter 键停止日志监控并继续..." 

# 停止日志监控
kill $LOGCAT_PID 2>/dev/null

echo ""
echo "✅ 日志监控已停止"
echo ""

# 清理
echo "🧹 步骤 5/5: 清理..."
echo ""

echo "=========================================="
echo "🎉 测试完成!"
echo "=========================================="
echo ""
echo "📝 查看详细文档:"
echo "   docs/VOCAL-REMOVAL-IMPLEMENTATION.md"
echo ""
echo "🐛 如果遇到问题，请检查:"
echo "   1. adb logcat | grep VocalRemovalAP"
echo "   2. 浏览器控制台 (Chrome DevTools)"
echo "   3. 调试面板中的错误信息"
echo ""
