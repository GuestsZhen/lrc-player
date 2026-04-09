# 🧪 Capacitor 应用验证指南

## ✅ 当前状态

- ✅ Web 应用构建成功
- ✅ Android 平台已添加
- ✅ iOS 平台已添加（需要 macOS + Xcode 才能运行）
- ✅ 项目同步完成

---

## 📱 如何运行应用

### 方法 1: 使用 Android Studio（推荐 Windows 用户）

#### 步骤 1: 打开 Android Studio

```bash
# 在项目根目录运行
npx cap open android
```

或者直接在 Android Studio 中打开 `android/` 目录。

#### 步骤 2: 等待 Gradle 同步

首次打开时，Android Studio 会自动同步 Gradle 依赖。这可能需要几分钟时间。

#### 步骤 3: 选择设备

**选项 A: 使用模拟器**
1. 点击顶部工具栏的设备选择器
2. 选择 "Create New Device"
3. 选择一个设备（如 Pixel 6）
4. 下载并安装系统镜像（如 Android 13）
5. 点击 Finish

**选项 B: 使用真机**
1. 在手机上启用开发者模式
2. 启用 USB 调试
3. 通过 USB 连接电脑
4. 手机会出现在设备列表中

#### 步骤 4: 运行应用

点击绿色的 "Run" 按钮（或按 Shift+F10），应用将编译并安装到设备上。

---

### 方法 2: 使用命令行（快速测试）

```bash
# 在连接的 Android 设备上运行
npm run cap:android

# 或在模拟器中运行
npx cap run android
```

---

### 方法 3: 使用 Xcode（仅 macOS）

```bash
# 打开 Xcode 项目
npx cap open ios

# 然后在 Xcode 中:
# 1. 选择设备或模拟器
# 2. 点击 Run 按钮
```

---

## 🔍 验证清单

### 基本功能测试

在应用运行后，检查以下功能是否正常：

- [ ] **应用启动**: 应用能否正常启动，无白屏
- [ ] **首页加载**: 主页内容是否正确显示
- [ ] **导航菜单**: 所有页面能否正常切换
- [ ] **音频播放**: 能否选择和播放音频文件
- [ ] **歌词显示**: LRC 歌词能否正确加载和同步
- [ ] **波形显示**: 音频波形能否正常渲染
- [ ] **播放器控制**: 播放/暂停/进度条是否正常工作

### 移动端特性测试

- [ ] **触摸交互**: 触摸操作是否流畅
- [ ] **响应式布局**: UI 是否适配屏幕尺寸
- [ ] **横竖屏切换**: 旋转屏幕后 UI 是否正常
- [ ] **返回按钮**: Android 返回按钮是否正常工作

---

## 🐛 常见问题排查

### 问题 1: Gradle 同步失败

**症状**: Android Studio 显示 Gradle 错误

**解决方案**:
```bash
# 清理项目
cd android
./gradlew clean

# 返回项目根目录
cd ..

# 重新同步
npx cap sync
```

### 问题 2: 应用白屏

**可能原因**: Web 资源未正确复制

**解决方案**:
```bash
# 重新构建 Web 应用
npm run build

# 同步到原生平台
npx cap sync

# 重新运行
npx cap run android
```

### 问题 3: 无法找到设备

**Android**:
1. 确保已启用 USB 调试
2. 检查 USB 驱动是否安装
3. 尝试更换 USB 端口或线缆

**iOS**:
1. 确保设备已信任此电脑
2. 检查 Xcode 中的设备管理器
3. 确保设备系统版本受支持

### 问题 4: 音频无法播放

**检查项**:
1. 文件权限是否正确
2. 音频格式是否支持
3. 查看 Logcat/Xcode Console 的错误信息

---

## 📊 调试技巧

### Android 调试

#### 使用 Chrome DevTools

1. 在 Chrome 浏览器中打开: `chrome://inspect`
2. 确保手机已连接并启用 USB 调试
3. 在 "Remote Target" 中找到您的应用
4. 点击 "inspect" 打开 DevTools

#### 查看日志

```bash
# 在终端中查看实时日志
adb logcat

# 过滤特定标签
adb logcat -s "Capacitor"
```

### iOS 调试

#### 使用 Safari Web Inspector

1. 在 Mac 上打开 Safari
2. 启用 "开发" 菜单 (Safari -> Preferences -> Advanced)
3. 连接 iOS 设备
4. 开发菜单 -> 您的设备 -> 您的应用

#### 查看日志

在 Xcode 中:
1. View -> Debug Area -> Activate Console
2. 查看控制台输出

---

## 🎯 下一步行动

验证完成后，您可以：

1. **如果一切正常**: 开始集成 Capacitor 插件（第 2-3 周任务）
2. **如果有问题**: 记录错误信息，查阅文档或提交 Issue

---

## 📚 相关文档

- [Capacitor 工作流指南](https://capacitorjs.com/docs/basics/workflow)
- [Android 部署指南](https://capacitorjs.com/docs/android/deployment)
- [iOS 部署指南](https://capacitorjs.com/docs/ios/deployment)
- [调试指南](https://capacitorjs.com/docs/guides/debugging)

---

**最后更新**: 2026-04-XX  
**文档版本**: 0.1.0
