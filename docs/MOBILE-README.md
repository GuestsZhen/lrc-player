# 📱 LRC Player Mobile - Capacitor 迁移指南

## 🚀 快速开始

### 前置要求

确保您的系统已安装以下软件：

- ✅ Node.js 18+ 和 npm 9+
- ⬜ Xcode 15+ (仅 macOS，用于 iOS 开发)
- ⬜ Android Studio (用于 Android 开发)
- ⬜ CocoaPods (iOS 依赖管理，macOS only)

### 安装步骤

#### 1. 安装依赖

```bash
npm install
```

Capacitor 核心依赖已自动安装：
- `@capacitor/core` - Capacitor 运行时
- `@capacitor/cli` - Capacitor 命令行工具

#### 2. 添加原生平台

**添加 iOS 平台** (需要 macOS):
```bash
npx cap add ios
```

**添加 Android 平台**:
```bash
npx cap add android
```

或者使用快捷脚本：
```bash
# Windows
cap-dev.bat

# 选择选项 6 或 7
```

#### 3. 构建并同步

```bash
# 方法 1: 使用 npm scripts
npm run cap:sync

# 方法 2: 手动执行
npm run build
npx cap sync
```

#### 4. 运行应用

**在 iOS 模拟器中运行** (需要 macOS):
```bash
npm run cap:ios
```

**在 Android 模拟器中运行**:
```bash
npm run cap:android
```

**打开原生 IDE**:
```bash
# iOS (Xcode)
npm run cap:open:ios

# Android (Android Studio)
npm run cap:open:android
```

---

## 🛠️ 开发工作流

### 日常开发流程

```bash
# 1. 修改 Web 代码
# 编辑 src/ 目录下的文件

# 2. 实时预览 (Web)
npm start

# 3. 构建并同步到移动端
npm run cap:sync

# 4. 在模拟器/真机中测试
npm run cap:ios        # iOS
npm run cap:android    # Android
```

### 使用快捷脚本 (Windows)

```bash
# 运行交互式菜单
cap-dev.bat

# 提供以下功能:
# 1. 构建并同步
# 2-5. 在不同平台运行
# 6-7. 添加平台
# 8. 更新依赖
# 9. 清理缓存
```

---

## 📦 项目结构

```
lrc-player/
├── src/                    # Web 应用源代码 (保持不变)
├── dist/                   # Web 构建输出 (Capacitor 会读取此目录)
├── ios/                    # iOS 原生项目 (自动生成)
├── android/                # Android 原生项目 (自动生成)
├── capacitor.config.ts     # Capacitor 配置文件
├── package.json            # 包含 Capacitor scripts
├── cap-dev.bat             # Windows 快捷脚本
├── CAPACITOR-MIGRATION-LOG.md  # 迁移进度记录
└── MOBILE-README.md        # 本文档
```

---

## 🔌 计划安装的插件

### 核心插件

| 插件 | 用途 | 安装命令 |
|-----|------|---------|
| `@capacitor/filesystem` | 文件系统访问 | `npm install @capacitor/filesystem` |
| `@capacitor/preferences` | 持久化存储 | `npm install @capacitor/preferences` |
| `@capacitor/share` | 分享功能 | `npm install @capacitor/share` |
| `@capacitor/local-notifications` | 本地通知 | `npm install @capacitor/local-notifications` |

### 社区插件

| 插件 | 用途 | 安装命令 |
|-----|------|---------|
| `@capawesome/capacitor-file-picker` | 文件选择器 | `npm install @capawesome/capacitor-file-picker` |
| `@capawesome/capacitor-background-task` | 后台任务 | `npm install @capawesome/capacitor-background-task` |

---

## ⚙️ 配置说明

### capacitor.config.ts

```typescript
{
  appId: 'com.lrcplayer.app',      // App ID
  appName: 'LRC Player',           // App 名称
  webDir: 'dist',                  // Web 构建输出目录
  server: {
    cleartext: true,               // 允许 HTTP (开发用)
    androidScheme: 'https'         // Android 使用 HTTPS
  }
}
```

### 重要提示

1. **每次修改 Web 代码后**，必须运行 `npm run cap:sync` 同步到原生平台
2. **修改原生配置后** (如权限、图标)，需要在 Xcode/Android Studio 中重新构建
3. **调试 Web 代码**: 可以使用 Chrome DevTools (Android) 或 Safari Web Inspector (iOS)

---

## 🐛 常见问题

### 1. 同步失败

```bash
# 清理缓存后重试
rm -rf dist node_modules/.vite
npm run build
npx cap sync
```

### 2. iOS 构建失败

```bash
# 进入 iOS 目录
cd ios

# 更新 Pods
pod install

# 返回根目录
cd ..

# 重新打开 Xcode
npx cap open ios
```

### 3. Android 构建失败

```bash
# 在 Android Studio 中
# File -> Sync Project with Gradle Files
# Build -> Rebuild Project
```

### 4. 白屏或加载失败

检查 `capacitor.config.ts` 中的 `webDir` 是否正确指向构建输出目录。

---

## 📚 学习资源

- [Capacitor 官方文档](https://capacitorjs.com/docs)
- [Capacitor 插件列表](https://capacitorjs.com/docs/plugins)
- [Ionic Framework 社区](https://forum.ionicframework.com/)
- [本项目迁移日志](./CAPACITOR-MIGRATION-LOG.md)

---

## 📊 当前进度

查看 [迁移进度追踪](./CAPACITOR-MIGRATION-LOG.md#-进度追踪)

**当前阶段**: 第 1 周 - 技术预研和初始化 ✅

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

**最后更新**: 2026-04-XX  
**文档版本**: 0.1.0
