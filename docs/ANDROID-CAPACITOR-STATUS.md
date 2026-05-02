# Capacitor Android 迁移状态


## 🚀 开发部署流程

### 标准部署命令

```bash
cd lrc-player && npm run cap:android:deploy
```

**命令详解** (`package.json` 第32行):

```bash
npm run cap:sync && \
cd android && ./gradlew assembleDebug --no-daemon && \
cd .. && \
adb install -r android/app/build/outputs/apk/debug/app-debug.apk && \
adb shell pm grant com.lrcplayer.app android.permission.READ_EXTERNAL_STORAGE && \
adb shell pm grant com.lrcplayer.app android.permission.READ_MEDIA_AUDIO && \
adb shell appops set com.lrcplayer.app MANAGE_EXTERNAL_STORAGE allow && \
adb shell am force-stop com.lrcplayer.app && \
sleep 2 && \
adb shell am start -n com.lrcplayer.app/.MainActivity && \
echo '✅ 部署完成，请测试'
```

**执行步骤分解**:

1. **构建和同步** (`npm run cap:sync`)
   - `npm run build` - Vite 构建 Web 资源到 `build/` 目录
   - `npx cap sync` - 同步 Web 资源到 Android 项目
   - `python3 scripts/register-mediastore-plugin.py` - **注册 MediaStore 和 ExoPlayer 插件** ⚠️
     - 自动将自定义插件添加到 `capacitor.plugins.json`
     - 注册 `MediaStorePlugin`（媒体库扫描）
     - 注册 `ExoPlayerPlugin`（音频播放 + 去人声功能）
     - **重要**: 必须在 `npx cap sync` 之后运行，否则会被覆盖

2. **编译 APK** (`./gradlew assembleDebug --no-daemon`)
   - 编译调试版 APK
   - `--no-daemon`: 不使用 Gradle 守护进程（避免内存占用）
   - 输出: `android/app/build/outputs/apk/debug/app-debug.apk`

3. **安装应用** (`adb install -r`)
   - `-r`: 覆盖安装（保留数据）
   - 如果首次安装会自动创建应用数据目录

4. **授予权限** (关键步骤 ⚠️)
   ```bash
   # Android 10-12 权限
   adb shell pm grant com.lrcplayer.app android.permission.READ_EXTERNAL_STORAGE
   
   # Android 13+ 权限
   adb shell pm grant com.lrcplayer.app android.permission.READ_MEDIA_AUDIO
   
   # 允许管理外部存储（访问所有文件）
   adb shell appops set com.lrcplayer.app MANAGE_EXTERNAL_STORAGE allow
   ```

5. **重启应用**
   ```bash
   adb shell am force-stop com.lrcplayer.app  # 强制停止
   sleep 2                                     # 等待2秒
   adb shell am start -n com.lrcplayer.app/.MainActivity  # 启动主活动
   ```

**为什么需要手动注册插件？**

Capacitor 的 `npx cap sync` 命令会根据 `package.json` 中的依赖自动检测并注册官方插件，但**不会自动发现自定义插件**。因此我们需要：

1. **在 `cap:sync` 脚本中自动注册**
   ```json
   "cap:sync": "npm run build && npx cap sync && python3 scripts/register-mediastore-plugin.py"
   ```

2. **注册脚本的作用** (`scripts/register-mediastore-plugin.py`)
   - 读取 `android/app/src/main/assets/capacitor.plugins.json`
   - 检查是否已注册 `MediaStore` 和 `ExoPlayerPlugin`
   - 如果未注册，则添加到插件列表
   - 确保每次同步后插件都正确注册

3. **验证插件注册**
   ```bash
   # 查看当前注册的插件
   cat android/app/src/main/assets/capacitor.plugins.json
   
   # 应该包含:
   # - @capacitor/preferences
   # - @capawesome/capacitor-file-picker
   # - MediaStore (自定义)
   # - ExoPlayerPlugin (自定义)
   ```

4. **常见问题**
   - ❌ **忘记注册插件**: 应用启动时自定义插件不会被加载
   - ❌ **先运行 cap sync 再手动注册**: 下次 cap sync 会覆盖
   - ✅ **正确做法**: 始终使用 `npm run cap:sync` 或 `npm run cap:android:deploy`

---

### 为什么需要这个命令？

#### ✅ 必要性

1. **自动化权限授予**
   - Android 10+ 的 Scoped Storage 限制严格
   - 手动授予权限繁琐且容易遗漏
   - ADB 命令可以一次性授予所有必需权限

2. **快速迭代开发**
   - 一键完成：构建 → 编译 → 安装 → 授权 → 启动
   - 节省大量手动操作时间
   - 适合频繁修改代码后的快速测试

3. **确保权限正确性**
   - 每次部署都重新授予权限
   - 避免因权限问题导致的功能异常
   - 特别是 `MANAGE_EXTERNAL_STORAGE` 需要特殊处理

4. **清理旧版本**
   - `-r` 参数覆盖安装，保留用户数据
   - `force-stop` 确保使用最新代码
   - 避免缓存导致的奇怪问题

#### ⚠️ 前置要求

```bash
# 1. 连接 Android 设备并开启 USB 调试
adb devices  # 确认设备已连接

# 2. 确保 ADB 有足够权限
# macOS/Linux: 可能需要 sudo
# Windows: 以管理员身份运行

# 3. 设备需开启开发者选项和 USB 调试
# 设置 → 关于手机 → 连续点击"版本号"7次
# 设置 → 开发者选项 → 开启"USB 调试"
```

#### 🔍 常见问题

**Q1: 提示 "device not found"**
```bash
# 检查 USB 连接
adb devices

# 如果设备未列出：
# 1. 重新插拔 USB 线
# 2. 确认手机上允许 USB 调试授权
# 3. 尝试不同的 USB 端口或线缆
```

**Q2: 权限授予失败**
```bash
# 检查当前权限状态
adb shell dumpsys package com.lrcplayer.app | grep permission

# 手动在设备上授予：
# 设置 → 应用 → LRC Player → 权限 → 允许所有必需权限
```

**Q3: 应用启动失败**
```bash
# 查看日志
adb logcat | grep -i "lrc\|error"

# 清除应用数据后重试
adb shell pm clear com.lrcplayer.app
npm run cap:android:deploy
```

**Q4: Gradle 编译缓慢**
```bash
# 首次编译需要下载依赖，耗时较长（5-10分钟）
# 后续编译会使用缓存，速度较快（1-2分钟）

# 如果需要更快的增量编译，移除 --no-daemon:
cd android && ./gradlew assembleDebug
```

### 替代方案对比

| 方法 | 优点 | 缺点 | 适用场景 |
|------|------|------|----------|
| **`cap:android:deploy`** | 全自动、权限完整、快速 | 需要 ADB 连接 | 日常开发 ✅ |
| `npx cap run android` | 简单、自动打开 AS | 不自动授权、较慢 | 初次测试 |
| Android Studio | 完整调试功能 | 手动操作多、慢 | 原生代码调试 |
| 手动 ADB 命令 | 灵活可控 | 步骤繁琐 | 特殊需求 |

### 最佳实践

```bash
# 1. 日常开发（推荐）
npm run cap:android:deploy

# 2. 仅同步代码（不重装）
npm run cap:sync

# 3. 在 Android Studio 中打开（调试原生代码）
npx cap open android

# 4. 清理后重新构建
cd android && ./gradlew clean && cd ..
npm run cap:android:deploy
```

---



## 🔧 待完成工作

### 1. Google Play 发布准备

#### 1.1 创建开发者账号
- [ ] 注册 Google Play Console ($25)
- [ ] 创建应用条目

#### 1.2 应用素材准备
- [ ] 应用图标 (512x512 PNG)
- [ ] 特色图片 (1024x500 PNG)
- [ ] 手机截图 (至少2张，推荐5-8张)
  - 主界面 - 歌词滚动播放
  - 简谱转调功能
  - 歌词编辑器
  - 播放列表 (MediaStore 扫描结果)
  - 设置页面

#### 1.3 隐私政策
- [ ] 创建隐私政策页面
- [ ] 托管到可访问的 URL

**隐私政策模板**：
```markdown
# LRC Player 隐私政策

## 数据收集
- 本应用不收集任何个人数据
- 所有数据存储在本地设备
- 不使用网络通信（除可选的 GitHub Gist 同步功能外）

## 权限说明
- READ_MEDIA_AUDIO: 用于扫描和播放本地音频文件
- 不会上传或共享您的音频文件

## 数据存储
- 歌词和偏好设置存储在本地
- 可选择性同步到 GitHub Gist（需用户授权）
```

#### 1.4 内容分级
- [ ] 完成 Google Play 内容分级问卷

#### 1.5 上传 AAB
```bash
cd android
./gradlew bundleRelease
# 输出: android/app/build/outputs/bundle/release/app-release.aab
```

## 📚 相关文档


### 技术参考
- [Capacitor 官方文档](https://capacitorjs.com/docs)
- [MediaStore API 指南](https://developer.android.com/training/data-storage/shared/media)
- [Android 权限最佳实践](https://developer.android.com/guide/topics/permissions/overview)

## 🏗️ 架构概览

### 双端架构
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
```

---

**文档版本**: 2.1.0  
**最后更新**: 2026-05-02  

