# 项目架构与功能分析文档

## 📊 项目概览

**简谱 LRC 播放器**是一个基于 React 18 + TypeScript + Vite 6 构建的现代化歌词制作和播放工具。这是一个功能丰富的 Web 应用，主要用于创建、编辑、同步和播放 LRC 格式歌词文件，特别支持简谱转调功能。

**Android 版本**通过 Capacitor 框架将 Web 应用转换为原生 Android App，使用 MediaStore API 直接访问系统媒体库。

- **项目名称**: lrc-player
- **当前版本**: 6.0.5 (重构优化版)
- **作者**: magic-akari (forked and enhanced by GuestsZhen)
- **许可证**: MIT
- **在线地址**: https://guestszhen.github.io/lrc-player
- **Android 包名**: com.lrcplayer.app



## 🎯 核心功能模块

### 1. 播放器 (Player)
- 🎵 简谱LRC高亮滚动播放 - 通过歌词中 "/"符号可实现双行显示
- 🎨 高度自定义：字体大小调节、对齐方式（左/中/右）、背景颜色自定义、歌词颜色自定义、大小调识别
- 🌓 主题自适应（亮色/暗色）
- 🖥️ 全屏模式支持

### 2. 简谱转调工具 (Tune) ⭐特色功能
- 🎼 **首调唱名法转调**（核心特色）
- 🔄 简谱数字与音名映射转换
- 🎹 支持高低八度标记：
  - `(5)` 表示低音
  - `[5]` 表示高音
- 📊 升降号支持（#1, b2 等）
- 🌍 多调式转换（C调、D调等）
- 📋 转换结果预览和导出

### 3. 歌词编辑器 (Editor)
- 📝 可视化歌词编辑界面
- 🏷️ 支持插入和管理时间标签
- 💾 歌词导入/导出功能
- ☁️ GitHub Gist 云同步
- 📋 复制和下载歌词文件
- 🔧 歌词元数据编辑（标题、艺术家等）

### 4. 歌词工具箱 (Lrc-utils)
- 🔧 多种实用工具：歌词压缩、时间偏移、时间变换、翻译分割、标签移除
- 📥 原文本和处理后文本对比
- 💾 覆盖模式支持

### 5. 歌词同步器 (Synchronizer)
- ⏱️ 实时歌词时间轴同步
- 🎮 两种同步模式：选择模式（手动选择行并打点）、高亮模式（跟随播放自动高亮）
- ⌨️ 键盘快捷键支持
- 🔄 平滑滚动到当前行
- ⚡ 时间标签微调功能

### 6. 偏好设置 (Preferences)
- 🎨 主题设置（自动/亮色/暗色）
- ⌨️ 键盘快捷键自定义
- 🌐 多语言切换（EN/ZH-CN/ZH-TW）
- 📝 编辑器配置
- 🎵 音频播放设置

### 7. Gist 云同步 (Gist)
- ☁️ GitHub Gist 集成
- 🔐 OAuth 认证
- 📤 上传歌词到云端
- 📥 从云端加载歌词
- 🗂️ Gist 管理界面

### 8. 测试版 ST播放器 (player-soundtouch)
- 🎵 实现歌曲转调
- 受技术限制，无法调整播放进度，指定时间点（seek）等

### 9. 文件管理 (File Manager) ⭐新增
- 📂 本地音频文件扫描和管理
- 🎶 播放列表管理（添加、删除、排序）
- 💾 IndexedDB 持久化存储
- 🔄 跨组件状态同步
- 📱 Web 和 Android 双端支持

### 10. Footer 组件重构 ⭐最新
- 📦 **模块化架构**: 从单体 683 行优化为模块化结构
- 🔧 **工具函数提取**: file-utils.ts, audio-decoder.ts, playback-control.ts
- 🎣 **Hook 封装**: usePlaylistEvents.ts 管理 10 个事件监听器
- ✨ **代码质量**: 提取 PlaylistPanel 组件，提升可维护性

---

## 📁 项目结构详解

### 根目录文件

| 文件/文件夹 | 作用 |
|------------|------|
| `package.json` | 项目配置、依赖管理、脚本命令定义 |
| `vite.config.ts` | Vite 构建配置、插件配置、CDN 注入、语言包处理 |
| `tsconfig.json` | TypeScript 编译配置 |
| `tsconfig.node.json` | Node 环境 TypeScript 配置 |
| `index.html` | 应用入口 HTML 文件，包含 PWA 配置 |
| `README.md` | 项目文档和使用说明（中文） |
| `README.en-US.md` | 项目文档和使用说明（英文） |
| `CHANGELOG.md` | 版本更新日志 |
| `DEPLOYMENT.md` | 部署指南 |
| `Dockerfile` | Docker 容器化配置 |
| `vercel.json` | Vercel 平台部署配置 |
| `.npmrc` | npm 包管理器配置 |
| `pnpm-lock.yaml` | pnpm 依赖锁定文件 |
| `package-lock.json` | npm 依赖锁定文件 |
| `.gitignore` | Git 忽略文件配置 |
| `.dockerignore` | Docker 忽略文件配置 |
| `.browserslistrc` | 浏览器兼容性配置 |
| `.postcssrc.js` | PostCSS 配置 |
| `dprint.json` | 代码格式化配置 |

### src/ - 源代码目录

#### src/index.ts - 应用主入口
```typescript
// 主要功能：
// 1. 初始化 React 应用
// 2. 注册全局事件监听（拖放、点击等）
// 3. 加载 polyfill（平滑滚动等）
// 4. 处理 standalone 模式的链接跳转
```

#### src/components/ - React 组件库

**核心布局组件：**

| 组件文件 | 功能说明 |
|---------|---------||
| `app.tsx` | 根组件，组织整体布局结构（Header + Content + Footer + Toast） |
| `app.context.tsx` | 全局状态管理（Context API），提供应用级状态共享 |
| `header.tsx` | 顶部导航栏，包含菜单、功能按钮、路由切换 |
| `content.tsx` | 主要内容区域，根据路由动态加载不同页面组件 |
| `footer.tsx` | 底部控制栏，播放控制、进度条、信息显示 ⭐已重构 |

**音频子组件 (audio/)：** ⭐新增

| 组件文件 | 功能说明 |
|---------|---------||
| `LrcAudio.tsx` | LRC 音频控制组件，显示当前歌曲信息 |
| `PlaybackControls.tsx` | 播放控制按钮组件 (播放/暂停/上一首/下一首) |
| `TimeLine.tsx` | 时间轴组件，显示播放进度和总时长 |
| `RateSlider.tsx` | 播放速率滑块，支持 0.5x - 2.0x 调节 |
| `Slider.tsx` | 通用滑块组件 |
| `index.ts` | Audio 组件统一导出 |

**播放列表相关组件：** ⭐新增

| 组件文件 | 功能说明 |
|---------|---------||
| `PlaylistPanel.tsx` | 播放列表面板组件 (从 footer 提取) |
| `FileListPanel.tsx` | 文件列表面板组件，显示所有音频文件 |
| `MSFileListPanel.tsx` | Android MediaStore 播放列表面板 |

**导航和设置组件：** ⭐新增

| 组件文件 | 功能说明 |
|---------|---------||
| `NavigationButtons.tsx` | 导航按钮组件，根据当前页面显示不同按钮 |
| `PlayerSettingsPanel.tsx` | Player 设置面板 (字体、背景色、歌词颜色等) |
| `RouteTransition.tsx` | 路由过渡动画组件，提供页面切换淡入淡出效果 |

**功能页面组件：**

| 组件文件 | 功能说明 |
|---------|---------|
| `editor.tsx` | 歌词编辑器组件，提供可视化编辑界面 |
| `synchronizer.tsx` | 歌词同步器组件，实现时间轴打点功能 |
| `player.tsx` | 标准播放器组件，全屏歌词展示 |
| `player-soundtouch.tsx` | 带变调功能的播放器，支持音调调整 |
| `tune.tsx` | 简谱转调工具组件，核心特色功能 |
| `lrc-utils.tsx` | 歌词工具箱组件，提供多种实用工具 |
| `gist.tsx` | GitHub Gist 管理组件，云端同步功能 |
| `preferences.tsx` | 偏好设置组件，配置管理界面 |
| `home.tsx` | 首页组件，欢迎页面和功能介绍 |

**辅助组件：**

| 组件文件 | 功能说明 |
|---------|---------|
| `audio.tsx` | 音频处理和控制组件，封装音频播放逻辑 |
| `LrcAudio.tsx` | LRC 音频控制组件 (从 audio 提取) |
| `waveform.tsx` | 音频波形可视化组件，基于 WaveSurfer.js |
| `loadaudio.tsx` | 音频文件加载组件，处理文件上传和解析 |
| `asidepanel.tsx` | 侧边面板组件，显示额外信息和工具 |
| `toast.tsx` | 消息提示组件，显示临时通知 |
| `ios-hint.tsx` | iOS 全屏提示组件，引导用户添加到主屏幕 |
| `svg.tsx` | SVG 图标组件库，提供各种图标 |
| `svg.img.tsx` | SVG 图片组件，显示 loading 和错误页面 |
| `curser.tsx` | 光标/指示器组件，显示当前位置 |

**样式文件：**
每个组件都有对应的 `.css` 样式文件，采用模块化 CSS 设计。

#### src/hooks/ - 自定义 React Hooks

| Hook 文件 | 功能说明 |
|----------|---------||
| `useLrc.ts` | 歌词状态管理和操作，处理歌词解析、编辑、同步 |
| `usePref.ts` | 偏好设置管理，持久化用户配置 |
| `useLang.ts` | 国际化语言切换，多语言支持 |
| `useKeyBindings.ts` | 键盘快捷键绑定，处理用户输入 |
| `useMediaStore.ts` | MediaStore 媒体库访问 Hook (Android) |
| `useAudioEvents.ts` | 音频事件处理 Hook (play/pause/ended/timeupdate) |
| `usePlaylistEvents.ts` | 播放列表事件监听 Hook ⭐新增 (管理 10 个事件) |
| `useAudioControl.ts` | 音频控制 Hook (音量、静音等) |
| `useMenu.ts` | 菜单状态管理 Hook |
| `usePageDetection.ts` | 页面检测 Hook |
| `usePlatform.ts` | 平台检测 Hook |
| `usePlaybackMode.ts` | 播放模式管理 Hook |
| `index.ts` | Hooks 统一导出 |

#### src/utils/ - 工具函数库

**音频相关：**

| 工具文件 | 功能说明 |
|---------|---------|
| `web-audio-player.ts` | Web Audio API 播放器封装，提供高级音频控制 |
| `audiomodule.ts` | 音频模块管理，统一音频状态和操作 |
| `playlist-manager.ts` | 播放列表管理，支持多音频文件 |
| `pitch-shifter.ts` | 音调转换工具，实现变调功能 |
| `file-utils.ts` | 文件处理工具 (getBaseName, findMatchingLrcFile) ⭐新增 |
| `audio-decoder.ts` | 音频解码工具 (NCM/QMC 解密) ⭐新增 |
| `playback-control.ts` | 播放控制工具 (索引计算、歌曲加载) ⭐新增 |
| `exoplayer-plugin.ts` | ExoPlayer 插件接口 (Android) ⭐新增 |
| `exoplayer-key-detector.ts` | ExoPlayer 按键检测器 ⭐新增 |
| `platform-detector.ts` | 平台检测工具 ⭐新增 |
| `mediastore-plugin.ts` | MediaStore 插件接口 (Android) ⭐新增 |

**输入处理：**

| 工具文件 | 功能说明 |
|---------|---------|
| `key-detector.ts` | 高级按键检测器，支持复杂快捷键组合 |
| `simple-key-detector.ts` | 简化按键检测，基础键盘事件处理 |
| `keybindings.ts` | 快捷键配置管理 |
| `default-keybindings.ts` | 默认快捷键定义 |
| `input-action.ts` | 输入动作处理，统一输入事件 |
| `is-keyboard-element.ts` | 判断元素是否为键盘输入元素 |

**网络和数据：**

| 工具文件 | 功能说明 |
|---------|---------|
| `gistapi.ts` | GitHub Gist API 封装，处理云端同步 |
| `router.ts` | 前端路由管理，页面导航 |
| `pubsub.ts` | 发布订阅模式实现，组件间通信 |

**状态管理 (Zustand Stores)：** ⭐新增

| Store 文件 | 功能说明 |
|-----------|----------|
| `stores/playerSettings.ts` | Player 设置管理（字体大小、背景色、歌词颜色、副行透明度） |
| `stores/navigation.ts` | 导航状态管理（全屏、Player 设置菜单、调性检测菜单） |
| `stores/fileManager.ts` | 文件管理（播放列表、当前播放文件、搜索过滤） |
| `stores/audioStore.ts` | 音频状态管理（播放状态、音量、进度等） |
| `stores/playlistStore.ts` | 播放列表状态管理 |
| `stores/index.ts` | Stores 统一导出 |

**其他工具：**

| 工具文件 | 功能说明 |
|---------|---------|
| `lrc-file-name.ts` | LRC 文件名生成，根据元数据生成文件名 |
| `sw.unregister.ts` | Service Worker 注销工具 |

#### src/const/ - 常量配置文件

| 配置文件 | 内容说明 |
|---------|---------|
| `router.json` | 路由路径定义，统一管理所有路由 |
| `local_key.json` | localStorage 键名常量 |
| `session_key.json` | sessionStorage 键名常量 |
| `gist_info.json` | Gist 相关配置信息 |
| `link.json` | 外部链接配置 |
| `strings.json` | 字符串常量定义 |

#### src/languages/ - 国际化资源

| 文件 | 语言 | 说明 |
|-----|------|------|
| `zh-CN.json` | 简体中文 | 中国大陆语言包 |
| `zh-TW.json` | 繁体中文 | 中国台湾语言包 |
| `en-US.json` | 英文 | 英语语言包 |
| `index.ts` | - | 语言模块导出和配置 |

#### src/polyfill/ - 浏览器兼容性补丁
为旧版浏览器提供现代 API 的兼容实现，包括：
- 平滑滚动 polyfill
- 其他现代浏览器特性的降级方案

#### src/ CSS 文件

| 文件 | 功能 |
|-----|------|
| `index.css` | 主样式文件，全局样式定义 |
| `variables.css` | CSS 变量定义，主题配色 |
| `animation.css` | 动画样式定义 |
| `normalize.css` | CSS 重置样式，统一浏览器默认样式 |

### worker/ - Web Worker 目录

Web Worker 用于在后台线程执行耗时任务，避免阻塞主线程。

| 文件 | 功能说明 |
|-----|---------|
| `sw.ts` | Service Worker 主文件，实现离线缓存和 PWA 功能 |
| `ncmc-worker.ts` | NCMC 格式音频解码 worker |
| `qmc-worker.ts` | QMC 格式音频解码 worker |
| `tsconfig.json` | Worker TypeScript 编译配置 |
| `types.d.ts` | Worker 类型定义文件 |

### plugins/ - Vite 插件

| 插件文件 | 功能说明 |
|---------|---------|
| `sw-plugin.ts` | Service Worker 构建插件，自动生成 SW 注册代码 |
| `sw.register.js` | Service Worker 注册脚本 |

### public/ - 静态资源目录

这些文件在构建时会被直接复制到输出目录。

| 目录/文件 | 内容说明 |
|----------|---------|
| `favicons/` | 网站图标集合（PNG、SVG、ICO 等多种格式） |
| `svg/` | SVG 图片资源（loading 动画、错误页面插图等） |
| `site.webmanifest` | PWA manifest 配置文件 |

**favicons 包含：**
- android-chrome-*.png/svg - Android Chrome 图标
- apple-touch-icon.png - iOS 主屏幕图标
- favicon-*.png - 浏览器标签页图标
- browserconfig.xml - Windows磁贴配置
- safari-pinned-tab.svg - Safari 固定标签页图标

**svg 包含：**
- akari-hide-wall.svg - 装饰性插图
- akari-not-found.svg - 404 页面插图
- akari-odango-loading.svg - Loading 动画

### build/ - 构建输出目录

生产环境构建后的静态文件，可直接部署到 Web 服务器。

包含：
- HTML 文件
- 压缩后的 CSS 和 JavaScript
- 资源文件（图片、字体等）
- Service Worker 文件
- PWA manifest

### scripts/ - 构建和维护脚本

| 脚本文件 | 功能说明 |
|---------|---------|
| `bump-version.js` | 版本号管理脚本，自动更新版本号 |
| `fallback.es5.js` | ES5 降级兼容脚本 |
| `fallback.es6.js` | ES6 降级兼容脚本 |

### types/ - TypeScript 类型定义

为第三方库和项目全局提供类型定义。

| 类型文件 | 内容说明 |
|---------|---------|
| `env.d.ts` | 环境变量类型定义 |
| `global.d.ts` | 全局类型定义 |
| `post-message.d.ts` | PostMessage 通信类型定义 |
| `soundtouchjs.d.ts` | SoundTouch.js 库类型定义 |
| `essentia.d.ts` | Essentia.js 库类型定义 |

### docs/ - 项目文档

| 文档文件 | 内容说明 |
|---------|---------|
| `SOUNDTOUCH-PLAYER.md` | SoundTouch 播放器功能文档 |
| `key-detection-feature.md` | 按键检测功能说明 |
| `key-detection-integration.md` | 按键检测集成指南 |
| `key-detection-user-guide.md` | 按键检测用户指南 |
| `ios-fullscreen.md` | iOS 全屏适配说明 |
| `ios-fullscreen-fix-summary.md` | iOS 全屏修复总结 |
| `version-management.md` | 版本管理说明 |
| `QUICK-UPDATE.md` | 快速更新指南 |

### .vscode/ - VSCode 编辑器配置

| 文件 | 功能 |
|-----|------|
| `settings.json` | 编辑器设置（格式化、lint 等） |
| `extensions.json` | 推荐的 VSCode 扩展列表 |

### .github/ - GitHub 配置

| 目录/文件 | 功能 |
|----------|------|
| `workflows/` | GitHub Actions CI/CD 工作流配置 |
| `FUNDING.yml` | 项目赞助信息配置 |

---

## 🔧 技术栈详情

### 核心框架
- **React 18** - UI 框架，使用 Hooks 和 Context API
- **TypeScript 5.8** - 类型安全的 JavaScript 超集
- **Vite 6** - 现代化的前端构建工具

### 状态管理 ⭐新增
- **Zustand ^5.0.12** - 轻量级、高性能的全局状态管理库

### 音频处理
- **WaveSurfer.js 7.9** - 音频波形可视化和播放
- **@wavesurfer/react** - WaveSurfer 的 React 封装
- **SoundTouch.js 0.3** - 音频变调和变速处理
- **Essentia.js 0.1** - 音频分析和特征提取

### 歌词处理
- **@lrc-maker/lrc-parser 0.1** - LRC 歌词解析和生成库

### 构建和优化
- **SWC** - 快速的 Rust-based JavaScript/TypeScript 编译器
- **LightningCSS** - 高性能 CSS 处理器
- **Rollup** - 模块打包器（Vite 内部使用）
- **rollup-plugin-externals** - 外部依赖处理
- **rollup-plugin-swc3** - SWC Rollup 插件

### 代码质量
- **oxlint** - 快速的 JavaScript/TypeScript linter
- **dprint** - 高性能代码格式化工具

### PWA 支持
- **Service Worker** - 离线缓存和网络拦截
- **Web App Manifest** - PWA 安装配置

### 其他依赖
- **core-js** - JavaScript 标准库 polyfill
- **toggle-switch-css** - 开关按钮样式库
- **gen_dep_tag** - 生成 CDN 标签的工具

---

## 🚀 应用工作流程

### 1. 应用启动流程
```
index.html 加载
    ↓
src/index.ts 执行
    ↓
加载必要的 polyfill
    ↓
创建 React Root
    ↓
渲染 App 组件
    ↓
AppProvider 提供全局状态
    ↓
渲染 Header / Content / Footer / Toast
```

### 2. 路由切换流程
```
用户点击导航
    ↓
router.ts 处理路由变化
    ↓
Content 组件根据路由加载对应组件
    ↓
懒加载目标组件（Editor/Synchronizer/Player 等）
    ↓
渲染新页面
```

### 3. 音频播放流程
```
用户上传/选择音频文件
    ↓
loadaudio.tsx 处理文件读取
    ↓
audiomodule.ts 创建音频上下文
    ↓
web-audio-player.ts 初始化播放器 (Web 模式)
或 ExoPlayer (Android 模式)
    ↓
waveform.tsx 渲染波形图 (可选)
    ↓
用户控制播放/暂停/seek
    ↓
音频状态通过 pubsub 广播
    ↓
其他组件响应状态变化
```

### 4. 歌词同步流程
```
用户进入 Synchronizer 页面
    ↓
加载歌词文本（useLrc hook）
    ↓
解析歌词为结构化数据
    ↓
用户按下快捷键（空格键）
    ↓
key-detector 捕获按键事件
    ↓
记录当前音频时间戳
    ↓
更新时间标签到歌词行
    ↓
自动滚动到下一行
    ↓
保存修改后的歌词
```

### 5. 简谱转调流程
```
用户进入 Tune 页面
    ↓
输入或粘贴简谱文本
    ↓
选择源调性和目标调性
    ↓
tune.tsx 解析简谱数字和标记
    ↓
应用转调算法
    ↓
处理高低八度标记 () 和 []
    ↓
处理升降号 # 和 b
    ↓
显示转换结果
    ↓
用户可复制或导出结果
```

### 6. 数据持久化流程
```
用户修改配置或歌词
    ↓
usePref 或 useLrc hook 捕获变化
    ↓
保存到 localStorage/sessionStorage
    ↓
或使用 gistapi.ts 同步到 GitHub Gist
    ↓
下次加载时从存储恢复状态
```

---

## 📦 依赖关系图

```
App (根组件)
├── AppProvider (全局状态)
│   ├── useLrc (歌词状态)
│   ├── usePref (偏好设置)
│   ├── useLang (语言)
│   └── useKeyBindings (快捷键)
│
├── Zustand Stores ⭐新增
│   ├── usePlayerSettings (Player 设置：字体、背景色、歌词颜色、透明度)
│   ├── useNavigation (导航状态：全屏、菜单显示)
│   ├── useFileManager (文件管理：播放列表、当前文件)
│   ├── useAudioStore (音频状态：播放状态、音量、进度)
│   └── usePlaylistStore (播放列表状态管理)
│
├── Header (导航栏)
│   ├── NavigationButtons (导航按钮)
│   └── 路由切换按钮
│
├── Content (内容区)
│   ├── RouteTransition (路由过渡动画)
│   ├── Editor (编辑器)
│   ├── Synchronizer (同步器)
│   ├── Player (播放器)
│   │   └── PlayerSettingsPanel (Player 设置面板)
│   ├── PlayerSoundTouch (变调播放器)
│   ├── Tune (转调工具)
│   ├── LrcUtils (工具箱)
│   ├── Gist (云同步)
│   ├── Preferences (设置)
│   └── Home (首页)
│
├── Footer (控制栏) ⭐已重构
│   ├── Audio 子组件
│   │   ├── LrcAudio (歌曲信息显示)
│   │   ├── PlaybackControls (播放控制按钮)
│   │   ├── TimeLine (时间轴)
│   │   └── RateSlider (播放速率滑块)
│   ├── PlaylistPanel (播放列表面板)
│   └── LoadAudio (音频加载)
│
├── FileListPanel (文件列表面板) ⭐新增
├── MSFileListPanel (Android 播放列表) ⭐新增
└── Toast (消息提示)

工具层：
├── web-audio-player.ts (音频播放)
├── audiomodule.ts (音频管理)
├── playlist-manager.ts (播放列表)
├── file-utils.ts (文件处理工具) ⭐新增
├── audio-decoder.ts (音频解码) ⭐新增
├── playback-control.ts (播放控制) ⭐新增
├── exoplayer-plugin.ts (ExoPlayer 插件) ⭐新增
├── platform-detector.ts (平台检测) ⭐新增
├── mediastore-plugin.ts (MediaStore 插件) ⭐新增
├── key-detector.ts (按键检测)
├── gistapi.ts (Gist API)
└── router.ts (路由)

Hooks 层：
├── useMediaStore.ts (MediaStore 访问)
├── useAudioEvents.ts (音频事件)
└── usePlaylistEvents.ts (播放列表事件) ⭐新增

Worker 层：
├── sw.ts (Service Worker)
├── ncmc-worker.ts (NCMC 解码)
└── qmc-worker.ts (QMC 解码)
```

---

## 🎨 架构设计特点

### 1. 组件化设计
- 采用 React 函数组件 + Hooks
- 组件职责单一，易于维护和测试
- 使用懒加载优化首屏性能

### 2. 状态管理 ⭐重构
- **Zustand Store**：轻量级全局状态管理（playerSettings、navigation、fileManager）
- **React Context API**：应用级状态共享（语言、偏好设置）
- **自定义 Hooks**：封装业务逻辑（useLrc、usePref、useLang、usePlaylistEvents）
- **PubSub 模式**：组件间通信和事件广播
- **自动持久化**：Store 自动同步到 Capacitor Preferences / sessionStorage/localStorage

### 3. 模块化组织
- 按功能划分目录（components、hooks、utils、stores）
- 常量集中管理（const 目录）
- 类型定义统一管理（types 目录）

### 4. 性能优化
- 代码分割和懒加载
- Web Worker 处理耗时任务（NCM/QMC 解密）
- Service Worker 离线缓存
- LightningCSS 快速 CSS 处理

### 5. 国际化支持
- JSON 格式语言包
- 动态语言切换
- 三种语言支持（EN、ZH-CN、ZH-TW）

### 6. PWA 特性
- 可安装为桌面应用
- 离线可用
- 后台同步
- 推送通知（可扩展）

### 7. 跨平台适配 ⭐新增
- **Web 版本**：标准 HTML5 Audio API
- **Android 版本**：ExoPlayer + MediaStore API
- **平台检测**：自动识别运行环境
- **统一接口**：抽象层屏蔽平台差异

---

## 🔑 快捷键系统

| 按键 | 功能 |
|------|------|
| `Space` | 插入时间标签 |
| `Backspace` / `Delete` | 移除时间标签 |
| `Ctrl+Enter` / `Cmd+Enter` | 播放/暂停 |
| `←` / `A` | 回退 5 秒 |
| `→` / `D` | 前进 5 秒 |
| `↑` / `W` / `J` | 选择上一行 |
| `↓` / `S` / `K` | 选择下一行 |
| `-` / `+` | 当前行时间标签微调 |
| `Ctrl+↑` / `Cmd+↑` | 提高播放速度 |
| `Ctrl+↓` / `Cmd+↓` | 降低播放速度 |
| `R` | 重置播放速度 |

---

## 🌐 浏览器兼容性

推荐的最低浏览器版本：

| 浏览器 | 最低版本 | 说明 |
|--------|---------|------|
| Chrome | >= 61 | 完全支持 |
| Firefox | >= 60 | 完全支持 |
| Safari | >= 11 | 部分功能需要 polyfill |
| Edge | >= 79 | 基于 Chromium，完全支持 |

**使用的现代特性：**
- ES Modules
- Web Audio API
- Service Worker
- Fetch API
- LocalStorage / SessionStorage
- CSS Variables
- Flexbox / Grid

---

## 🛠️ 开发和构建

### 本地开发
```bash
# 克隆仓库
git clone https://github.com/GuestsZhen/lrc-player.git
cd lrc-player

# 安装依赖
npm install

# 开发模式（热重载）
npm start

# 访问 http://localhost:5173
```

### 生产构建
```bash
# 构建生产版本
npm run build

# 输出到 build/ 目录
# 可部署到任何静态文件服务器
```

### 版本管理
```bash
# 补丁版本 (6.0.4 -> 6.0.5)
npm run version:patch

# 次版本 (6.0.4 -> 6.1.0)
npm run version:minor

# 主版本 (6.0.4 -> 7.0.0)
npm run version:major
```

### 代码质量检查
```bash
# 格式化代码
npm run fix:fmt

# 检查格式
npm run check:fmt

# Lint 检查
npm run check:lint
```

### Docker 部署
```bash
# 构建镜像
docker build -t lrc-player .

# 运行容器
docker run -d -p 8080:80 lrc-player

# 访问 http://localhost:8080
```

---

## 📊 应用场景

1. **音乐制作人**：为简谱歌曲制作精准的时间轴歌词
2. **KTV 系统**：创建卡拉OK字幕文件
3. **音乐教育**：简谱教学和转调练习
4. **歌词爱好者**：整理和美化歌词文件
5. **开发者**：学习 React + TypeScript 最佳实践
6. **播客制作者**：为音频内容添加字幕
7. **语言学习者**：制作双语歌词对照学习材料

---

## 🔮 未来扩展方向

### 可能的功能增强
- [ ] AI 自动歌词同步
- [ ] 更多音频格式支持
- [ ] 协作编辑功能
- [ ] 歌词翻译集成
- [ ] 更多简谱符号支持
- [ ] 音频效果器（混响、均衡器等）
- [ ] 导出为视频格式
- [ ] 移动端原生应用（React Native）

### 技术改进
- [ ] 迁移到 React 19
- [ ] 引入状态管理库（Zustand/Jotai）
- [ ] 单元测试覆盖
- [ ] E2E 测试
- [ ] 性能监控和分析
- [ ] 错误追踪系统

---

## 📝 总结

**简谱 LRC 播放器**是一个架构清晰、功能完善的现代化 Web 应用。它结合了：

- ✅ 优秀的用户体验（直观的界面、流畅的交互）
- ✅ 强大的功能集合（编辑、同步、播放、转调）
- ✅ 现代的技术栈（React 18、TypeScript、Vite）
- ✅ 良好的代码组织（模块化、组件化）
- ✅ 完善的工程化（PWA、Docker、CI/CD）
- ✅ 国际化支持（三语言）
- ✅ 特色功能（简谱转调）
- ✅ **Android 原生支持**（Capacitor + MediaStore API）

这个项目不仅是一个实用的工具，也是学习现代前端开发的优秀案例。

---

## 📱 Android 版本架构

### 双端架构设计

```
lrc-player/
├── Web 版本 (浏览器)
│   ├── 文件选择: <input type="file" />
│   ├── 播放列表: selected-files-panel
│   └── 存储: localStorage/sessionStorage
│
└── Android 版本 (Capacitor)
    ├── 文件选择: MediaStore API + FilePicker
    ├── 播放列表: MSFileListPanel
    ├── 存储: Capacitor Preferences
    └── 完全离线运行
```

### 关键文件

```
src/
├── utils/
│   ├── platform-detector.ts       # 平台检测
│   ├── audio-file-adapter.ts      # 音频文件适配
│   ├── mediastore-plugin.ts       # MediaStore 接口
│   └── storage.ts                 # 统一存储适配器
├── components/
│   ├── MSFileListPanel.tsx # Android 播放列表
│   ├── header.tsx                 # 平台适配头部
│   └── footer.tsx                 # 平台适配底部
└── stores/
    ├── playerSettings.ts          # 播放器设置 (Preferences)
    └── fileManager.ts             # 文件管理

android/
└── app/src/main/java/com/lrcplayer/app/
    ├── MainActivity.java          # 主活动
    └── plugins/
        └── MediaStorePlugin.java  # MediaStore 原生插件 ⭐
```

### MediaStore 集成

这是 Android 版本的**核心创新点**，通过 Android MediaStore API 直接访问系统媒体库。

#### 工作流程

```
用户点击授权按钮
  ↓
调用 MediaStore.scanAudioFiles()
  ↓
检查权限 (READ_MEDIA_AUDIO, MANAGE_EXTERNAL_STORAGE)
  ↓
查询 MediaStore.Audio.Media.EXTERNAL_CONTENT_URI
  ↓
返回音频文件列表 (content:// URIs)
  ↓
转换为实际文件路径
  ↓
查找对应的 LRC 歌词文件
  ↓
显示在播放列表中
```

#### MediaStorePlugin.java 主要方法

| 方法名 | 功能说明 |
|--------|----------|
| `scanAudioFiles()` | 扫描所有音频文件 |
| `getTracksInFolder()` | 获取指定文件夹下的歌曲 |
| `getAudioFilePath()` | 获取音频文件的实际路径 |
| `findLrcFile()` | 查找同名 LRC 歌词文件 |
| `refreshLibrary()` | 刷新媒体库（触发媒体扫描） |
| `readFileAsBase64()` | 读取文件为 Base64 字符串 |

### 构建和部署

详见：
- [ANDROID-CROSS-PLATFORM-GUIDE.md](./ANDROID-CROSS-PLATFORM-GUIDE.md) - 跨平台开发指南
- [ANDROID-MEDIASTORE-DEBUG-GUIDE.md](./ANDROID-MEDIASTORE-DEBUG-GUIDE.md) - MediaStore 调试指南
- [ANDROID-CAPACITOR-STATUS.md](./ANDROID-CAPACITOR-STATUS.md) - Capacitor 迁移状态

### ExoPlayer 集成 ⭐新增

Android 版本使用 **ExoPlayer** 替代 HTML5 Audio，提供更好的性能和功能。

#### ExoPlayerPlugin.java 主要功能

- 🎵 高性能音频播放
- 🎚️ 播放速度控制 (0.5x - 2.0x)
- ⏯️ 播放/暂停/跳转控制
- 🔊 音量控制
- 📢 播放完成事件通知
- 🔄 与 Web 层的双向通信

#### 关键特性

1. **后台播放支持**：即使应用切换到后台也能继续播放
2. **锁屏控制**：支持锁屏界面播放控制
3. **音频焦点管理**：自动处理与其他应用的音频冲突
4. **格式支持广泛**：支持更多音频格式（MP3, FLAC, AAC, OGG 等）


### 关键技术点

#### 1. 类型兼容性处理

在 TypeScript 中,`File | null` 和 `File | undefined` 是不同的类型。我们使用联合类型提高兼容性:

```typescript
readLrcFile: (track: any) => Promise<File | undefined | null>
```

#### 2. React 渲染期间状态更新修复

**问题**: Header 渲染时触发 Content 的状态更新,导致警告。

**解决**: 在 Content 中使用 `setTimeout` 异步更新状态:

```typescript
setTimeout(() => {
    setCurrentPlayingFile(customEvent.detail.fileName);
}, 0);
```

#### 3. Hook 参数传递

确保 `setAudioSrc` 等回调函数正确传递给 Hook:

```typescript
usePlaylistEvents({
    // ...
    setAudioSrc,  // ✅ 直接传递,不使用 CustomEvent
    // ...
});
```

---

**文档生成时间**: 2026-04-19  
**项目版本**: 6.0.5 (重构优化版)  
**文档版本**: 2.3.0 
