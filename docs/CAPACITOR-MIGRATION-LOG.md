# Capacitor 移动端迁移实施记录

## 📱 项目信息

- **项目名称**: LRC Player Mobile
- **App ID**: com.lrcplayer.app
- **技术方案**: Capacitor (包装现有 Web 应用)
- **开始时间**: 2026-04-XX
- **当前版本**: Web v6.0.5 → Mobile v1.0.0 (计划)

---

## ✅ 已完成的工作

### 第 1 周：技术预研和初始化

#### 1.1 Capacitor 核心安装 ✅
```bash
npm install @capacitor/core @capacitor/cli
npm install @capacitor/android @capacitor/ios
npx cap init "LRC Player" com.lrcplayer.app --web-dir dist
```

**配置文件**: `capacitor.config.ts`
- ✅ App ID: `com.lrcplayer.app`
- ✅ App Name: `LRC Player`
- ✅ Web 目录: `build` (Vite 输出目录)
- ✅ 服务器配置: cleartext enabled, HTTPS scheme

#### 1.2 平台添加 ✅
```bash
# Android 平台
npx cap add android

# iOS 平台
npx cap add ios

# 同步项目
npx cap sync
```

**状态**:
- ✅ Android 平台已成功添加
- ✅ iOS 平台已成功添加（需要 macOS + Xcode 运行）
- ✅ Web 资源已复制到原生项目
- ✅ 项目同步完成

---

## 📋 待完成的任务

### 第 1 周：技术预研（继续）

#### 1.2 添加平台支持
- [ ] 添加 iOS 平台: `npx cap add ios`
- [ ] 添加 Android 平台: `npx cap add android`
- [ ] 验证平台配置正确

#### 1.3 构建和同步测试
- [ ] 构建 Web 应用: `npm run build`
- [ ] 同步到原生平台: `npx cap sync`
- [ ] 在模拟器中运行测试

---

### 第 2-3 周：核心功能迁移

#### 2.1 文件系统集成
**需要安装的插件**:
```bash
npm install @capacitor/filesystem
npm install @capacitor/file-opener
```

**需要修改的文件**:
- `src/components/content.tsx` - 文件选择逻辑
- `src/utils/fileUtils.ts` - 文件操作工具

**关键改动**:
```typescript
// Web API (当前)
const fileInput = document.createElement('input');
fileInput.type = 'file';

// Capacitor (目标)
import { Filesystem } from '@capacitor/filesystem';
import { FilePicker } from '@capawesome/capacitor-file-picker';

const result = await FilePicker.pickFiles({
  types: ['audio/*', '.lrc'],
});
```

#### 2.2 存储层迁移
**需要安装的插件**:
```bash
npm install @capacitor/preferences
```

**需要修改的文件**:
- `src/hooks/usePref.ts` - 偏好设置
- `src/utils/storage.ts` - 存储工具

**关键改动**:
```typescript
// Web API (当前)
localStorage.setItem('key', value);
const value = localStorage.getItem('key');

// Capacitor (目标)
import { Preferences } from '@capacitor/preferences';

await Preferences.set({ key: 'key', value });
const { value } = await Preferences.get({ key: 'key' });
```

#### 2.3 分享功能
**需要安装的插件**:
```bash
npm install @capacitor/share
```

---

### 第 4-5 周：音频增强

#### 3.1 后台播放研究
**候选方案**:
1. `@capawesome/capacitor-background-task` - 后台任务
2. `cordova-plugin-background-mode` - Cordova 插件
3. 自定义 Native Module

**需要验证**:
- [ ] 音频在后台能否持续播放
- [ ] 锁屏通知控制是否可用
- [ ] 耳机控制是否响应

#### 3.2 性能优化
- [ ] 测试音频延迟
- [ ] 优化波形渲染
- [ ] 减少内存占用

---

### 第 6-7 周：原生功能集成

#### 4.1 文件系统访问
**功能需求**:
- [ ] 扫描本地音乐文件夹
- [ ] 自动识别 .mp3, .lrc 文件
- [ ] 建立播放列表

#### 4.2 通知功能
**需要安装的插件**:
```bash
npm install @capacitor/local-notifications
```

**功能需求**:
- [ ] 播放时显示通知
- [ ] 通知栏控制（播放/暂停/上一首/下一首）
- [ ] 显示当前歌曲信息

#### 4.3 UI 适配
**需要优化的组件**:
- [ ] 触摸交互优化
- [ ] 手势支持（滑动切换歌曲）
- [ ] 移动端响应式布局
- [ ] 安全区域适配（刘海屏）

---

### 第 8 周：测试和优化

#### 5.1 真机测试
**iOS 测试清单**:
- [ ] iPhone 12/13/14/15 系列
- [ ] iOS 15/16/17 兼容性
- [ ] 后台播放测试
- [ ] 锁屏控制测试

**Android 测试清单**:
- [ ] Samsung/Xiaomi/Huawei 等主流品牌
- [ ] Android 10/11/12/13/14 兼容性
- [ ] 后台播放测试
- [ ] 通知控制测试

#### 5.2 性能优化
- [ ] 启动速度优化 (< 2s)
- [ ] 内存占用优化 (< 150MB)
- [ ] 音频延迟优化 (< 50ms)

#### 5.3 Bug 修复
- [ ] 收集测试反馈
- [ ] 修复崩溃问题
- [ ] 修复功能异常

---

## 🔧 开发环境要求

### 必需软件
- ✅ Node.js 18+
- ✅ npm 9+
- [ ] Xcode 15+ (iOS 开发，macOS only)
- [ ] Android Studio (Android 开发)
- [ ] CocoaPods (iOS 依赖管理)

### 可选工具
- [ ] iOS Simulator
- [ ] Android Emulator
- [ ] 真机调试设备

---

## 📚 参考资源

### 官方文档
- [Capacitor 官方文档](https://capacitorjs.com/docs)
- [Capacitor 插件列表](https://capacitorjs.com/docs/plugins)
- [iOS 部署指南](https://capacitorjs.com/docs/ios)
- [Android 部署指南](https://capacitorjs.com/docs/android)

### 社区资源
- [Ionic Forum](https://forum.ionicframework.com/)
- [Capacitor GitHub](https://github.com/ionic-team/capacitor)
- [Stack Overflow - Capacitor](https://stackoverflow.com/questions/tagged/capacitor)

---

## ⚠️ 注意事项

### 已知限制
1. **Web Audio API 兼容性**: 某些高级音频处理可能需要在原生层实现
2. **文件访问权限**: iOS 沙盒机制限制文件访问范围
3. **后台播放**: 需要配置原生权限和后台模式

### 最佳实践
1. **渐进式迁移**: 先保证核心功能可用，再逐步增强
2. **双平台测试**: 同时在 iOS 和 Android 上测试
3. **版本控制**: 每个阶段都提交 Git，方便回滚
4. **文档更新**: 及时记录遇到的问题和解决方案

---

## 📊 进度追踪

| 阶段 | 计划时间 | 实际开始 | 实际完成 | 状态 |
|-----|---------|---------|---------|------|
| 技术预研 | 第 1 周 | 2026-04-XX | 2026-04-XX | ✅ 已完成 |
| 核心功能 | 第 2-3 周 | - | - | ⏳ 待开始 |
| 音频增强 | 第 4-5 周 | - | - | ⏳ 待开始 |
| 原生功能 | 第 6-7 周 | - | - | ⏳ 待开始 |
| 测试优化 | 第 8 周 | - | - | ⏳ 待开始 |

---

**最后更新**: 2026-04-XX  
**文档版本**: 0.2.0
