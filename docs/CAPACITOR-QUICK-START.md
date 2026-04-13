# Capacitor Android 迁移 - 快速开始

## 🎯 核心目标

将 **lrc-player** Web 应用迁移为 **Capacitor Android** 原生应用，同时：
1. **完全保留 Web 版本功能**
2. **实现完全离线使用**（无需网络连接）

## 📚 完整文档

详细迁移指南请查看：[CAPACITOR-ANDROID-MIGRATION.md](./CAPACITOR-ANDROID-MIGRATION.md)

## ✨ 关键特性

### 双端共存架构

```
┌─────────────────────────────────────┐
│         lrc-player 项目              │
├──────────────────┬──────────────────┤
│   Web 版本       │  Android 版本     │
│                  │                   │
│ • 文件选择器     │ • MediaStore API  │
│ • selected-files │ • MSselected-file │
│ • Zustand Stores │ • Zustand Stores  │
│ • 浏览器运行     │ • Capacitor WebView│
└──────────────────┴──────────────────┘
         ↓                ↓
    共享核心代码层 (player, lyric, tune...)
```

### file-list-btn 按钮的平台特定行为

| 平台 | 点击效果 | 打开面板 |
|------|---------|----------|
| **Web** | 打开文件选择器 | `selected-files-panel` (现有) |
| **Android** | 打开音乐库 | `MSselected-files-panel` (新增) |

### MSselected-files-panel 功能（Android 专属）

- ✅ **授权管理** - 请求存储权限
- ✅ **添加文件夹** - 选择扫描的音乐文件夹
- ✅ **播放列表** - 显示 MediaStore 扫描结果
- ✅ **刷新媒体库** - 触发系统媒体扫描
- ✅ **元数据显示** - 标题、艺术家、专辑、时长

### 离线功能特性

✅ **完全离线可用：**
- 音频播放（从 MediaStore）
- 歌词显示和滚动
- 简谱转调
- 音高/速度调节
- 去人声功能
- 歌词编辑和同步
- 偏好设置保存
- **状态管理**：Zustand Stores 自动持久化

❌ **无需网络：**
- 所有代码打包在 APK 中
- 所有数据处理在本地完成
- 不依赖任何 CDN 或外部服务

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
```

### 2. 初始化 Capacitor

```bash
npx cap init "LRC Player" com.lrcplayer.app --web-dir=build
npx cap add android
```

### 3. 创建平台检测工具

```typescript
// src/utils/platform-detector.ts
import { Capacitor } from '@capacitor/core';

export function isAndroidNative(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
}
```

### 4. 修改 header.tsx

```typescript
import { isAndroidNative } from './utils/platform-detector';
import { MSSelectedFilesPanel } from './components/MSselected-files-panel';

// 在 Header 组件中
{isAndroidNative() ? (
  <button onClick={() => setShowMSPanel(true)}>📁 音乐库</button>
) : (
  <button onClick={() => setShowWebPanel(true)}>📁 文件列表</button>
)}

{isAndroidNative() && showMSPanel && (
  <MSSelectedFilesPanel ... />
)}
```

### 5. 构建并运行

```bash
npm run build
npx cap sync
npx cap run android
```

## 📋 迁移检查清单

- [ ] 安装 Capacitor 依赖
- [ ] 初始化 Capacitor 配置
- [ ] 创建 MediaStore 插件
- [ ] 创建平台检测工具
- [ ] 创建 MSselected-files-panel 组件
- [ ] 修改 header.tsx 添加平台检测
- [ ] 配置 Android 权限
- [ ] 测试 Web 版本（确保不受影响）
- [ ] 测试 Android 版本
- [ ] 构建 APK

## ⚠️ 重要提醒

### ✅ 正确做法

```typescript
// 使用平台检测隔离代码
if (isAndroidNative()) {
  // Android 特定逻辑
  const tracks = await MediaStore.getAudioTracks();
} else {
  // Web 逻辑（原有）
  const files = await fileInputRef.current?.files;
}
```

### ❌ 错误做法

```typescript
// 直接调用 Android API（会破坏 Web 版本！）
const tracks = await MediaStore.getAudioTracks();

// 修改现有 Web 组件
// 不要修改 selected-files-panel.tsx！
```

## 🔍 常见问题

### Q: Web 版本会受影响吗？
**A**: 不会！所有 Android 代码都通过 `isAndroidNative()` 检测隔离。

### Q: file-list-btn 在两个平台的行为一样吗？
**A**: 不一样！
- Web: 打开文件选择器
- Android: 打开音乐库（MSselected-files-panel）

### Q: 需要维护两套代码吗？
**A**: 不需要！核心功能（播放、歌词、转调）是共享的，只有文件选择和播放列表有平台差异。

## 📖 相关文档

- [完整迁移指南](./CAPACITOR-ANDROID-MIGRATION.md)
- [项目架构文档](./PROJECT-ARCHITECTURE.md)
- [Capacitor 官方文档](https://capacitorjs.com/docs)

---

**文档版本**: 1.1.0  
**最后更新**: 2026-04-12  
**状态**: 📝 准备开始迁移  
**离线支持**: ✅ 完全离线
