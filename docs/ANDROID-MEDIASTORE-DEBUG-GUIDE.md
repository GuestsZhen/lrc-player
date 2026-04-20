# Android MediaStore 完整调试指南

> **本文档整合了 MediaStore 插件修复和 Android 调试的完整流程**

---

## 📋 目录

1. [问题描述](#-问题描述)
2. [快速修复](#-快速修复)
3. [macOS 部署流程](#-macos-部署流程) ⭐
4. [测试验证](#-测试验证)
5. [调试步骤](#-调试步骤)
6. [常见问题](#-常见问题)
7. [诊断清单](#-诊断清单)

---

## 🐛 问题描述

### 现象

- App 已安装到 Android 15 (API 35) 设备
- 用户点击"授权"按钮
- 选择包含音乐文件的文件夹
- **文件列表显示为 0**

### 确认信息

- ✅ 文件夹中确实存在音乐文件
- ✅ MediaStore 数据库中有音频文件（系统正常）
- ❌ 应用扫描返回 0 个文件
- ❌ 报错：`"MediaStore" plugin is not implemented on android`

---

## ⚡ 快速修复

如果遇到问题，按以下步骤快速修复：

```bash
# 1. 构建 Web 应用
npm run build

# 2. 同步到 Android
npx cap sync android

# 3. 重新注册 MediaStore 插件（必须在 sync 后执行！）
python3 scripts/register-mediastore-plugin.py

# 4. 使用标准部署命令（自动完成后续步骤）
npm run cap:android:deploy
```

**标准部署命令会自动完成**：
- ✅ 编译 APK
- ✅ 安装到设备
- ✅ 授予所有必需权限
- ✅ 重启应用

详见：[ANDROID-CAPACITOR-STATUS.md](./ANDROID-CAPACITOR-STATUS.md)

---

## 🍎 macOS 部署流程

> **本文档已在 macOS 上测试通过** ✅

### 前置条件

- ✅ macOS 系统
- ✅ Android SDK 已安装
- ✅ Node.js 和 npm 已安装
- ✅ Java JDK 21 已安装
- ✅ adb 工具可用
- ✅ Android 设备已连接并启用 USB 调试

### 方法 1：使用自动化脚本（推荐）⭐

项目已提供完整的自动化部署脚本：

```bash
# 进入项目目录
cd /Volumes/data/lingmaProjects/lrc-player

# 运行标准部署命令
npm run cap:android:deploy
```

**脚本自动完成以下步骤**：
1. ✅ 构建 Web 应用（设置 `CAPACITOR_BUILD=true`）
2. ✅ 同步到 Android (`npx cap sync android`)
3. ✅ 注册 MediaStore 插件到 `capacitor.plugins.json`
4. ✅ 构建 APK (`./gradlew assembleDebug`)
5. ✅ 安装到设备 (`adb install`)
6. ✅ 授予所有必要权限
7. ✅ 重启应用

### 方法 2：手动部署

#### 步骤 1：确保 AndroidManifest.xml 包含必要权限

**文件**: `android/app/src/main/AndroidManifest.xml`

```xml
<!-- Permissions -->
<uses-permission android:name="android.permission.INTERNET" />

<!-- MediaStore 权限（Android 15 / API 35）⭐ -->
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="32" />
<uses-permission android:name="android.permission.READ_MEDIA_AUDIO" />
<uses-permission android:name="android.permission.MANAGE_EXTERNAL_STORAGE" />
```

⚠️ **关键权限说明**：
- `MANAGE_EXTERNAL_STORAGE` - **必须添加**，否则在 Android 11+ 上无法访问 MediaStore
- `READ_MEDIA_AUDIO` - Android 13+ 必需
- `READ_EXTERNAL_STORAGE` - 通用读取权限

#### 步骤 2：构建 Web 应用

```bash
export CAPACITOR_BUILD=true
npm run build
```

#### 步骤 3：同步到 Android

```bash
npx cap sync android
```

#### 步骤 4：注册 MediaStore 插件

```bash
python3 scripts/register-mediastore-plugin.py
```

#### 步骤 5：构建 APK

```bash
cd android
./gradlew assembleDebug --no-daemon
cd ..
```

#### 步骤 6：安装到设备

```bash
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

#### 步骤 7：授予权限

```bash
adb shell pm grant com.lrcplayer.app android.permission.READ_EXTERNAL_STORAGE
adb shell pm grant com.lrcplayer.app android.permission.READ_MEDIA_AUDIO
adb shell appops set com.lrcplayer.app MANAGE_EXTERNAL_STORAGE allow
```

#### 步骤 8：重启应用

```bash
adb shell am force-stop com.lrcplayer.app
sleep 2
adb shell am start -n com.lrcplayer.app/.MainActivity
```

### 验证部署

```bash
# 监控日志
adb logcat | grep -E "MediaStorePlugin|FolderScanner"

# 在手机上操作：授权 → 选择文件夹
# 应该看到类似输出：
# D MediaStorePlugin: ALL files count: XXX
# D MediaStorePlugin: Query returned XXX tracks
```

### 常见问题（macOS 特定）

#### 问题 1：Gradle 构建失败 - 连接超时

**解决**：配置阿里云 Maven 镜像

编辑 `android/build.gradle`：

```gradle
repositories {
    maven { url 'https://maven.aliyun.com/repository/google' }
    maven { url 'https://maven.aliyun.com/repository/public' }
    google()
    mavenCentral()
}
```

#### 问题 2：Java 版本冲突

**症状**：`Unsupported class file major version`

**解决**：使用 Java 21

```bash
# 临时设置 JAVA_HOME
export JAVA_HOME=$(/usr/libexec/java_home -v 21)

# 验证
java -version
```

#### 问题 3：adb 找不到设备

**解决**：

```bash
# 检查设备连接
adb devices

# 如果显示 unauthorized，请在手机上允许 USB 调试
# 如果显示 offline，尝试重启 adb
adb kill-server
adb start-server
```

#### 问题 4：权限授予后仍然返回 0 tracks

**可能原因**：MediaStore 数据库未更新

**解决**：触发媒体扫描

```bash
# 扫描特定文件夹
adb shell am broadcast -a android.intent.action.MEDIA_SCANNER_SCAN_FILE \
  -d file:///storage/emulated/0/Music/YourFolder

# 等待 10 秒
sleep 10

# 验证扫描结果
adb shell content query --uri content://media/external/audio/media \
  --projection _data | grep "YourFolder"
```

---

## ✅ 测试验证

### 测试环境

- **设备**：Samsung (R5CR309YQCT)
- **Android 版本**：15 (API 35)
- **测试文件夹**：`/storage/emulated/0/Music/00演奏/`
- **文件内容**：92个 MP3 文件 + 对应的 LRC 歌词文件

### 测试步骤

1. **打开应用**
2. **点击"授权"按钮**
3. **使用 FilePicker 选择文件夹** `/Music/00演奏/`
4. **等待扫描完成**

### 测试结果

✅ **成功！**

**关键日志**：
```
[FolderScanner] Input folderPath: content://com.android.externalstorage.documents/tree/primary%3AMusic%2F00%E6%BC%94%E5%A5%8F
[FolderScanner] Converted to real path: /storage/emulated/0/Music/00演奏
[FolderScanner] Calling MediaStore.getTracksInFolder with: /storage/emulated/0/Music/00演奏

MediaStorePlugin: ========== getTracksInFolder called ==========
MediaStorePlugin: Input folderPath: /storage/emulated/0/Music/00演奏
MediaStorePlugin: Using selection: data LIKE ?
MediaStorePlugin: With args: /storage/emulated/0/Music/00演奏%
MediaStorePlugin: Query returned 92 tracks

[FolderScanner] MediaStore returned: 92 tracks
[FolderScanner] Found LRC for 陈奕迅 - 好久不见 C调.mp3: /storage/emulated/0/Music/00演奏/陈奕迅 - 好久不见 C调.lrc
[FolderScanner] Processed 92 tracks
[FolderScanner] Rescanned 92 tracks from 1 folders
```

**验证结果**：
- ✅ 正确识别 SAF URI 并转换为真实路径
- ✅ MediaStore 查询返回 92 个音轨（仅指定文件夹）
- ✅ 自动找到所有对应的 LRC 歌词文件
- ✅ 数据保存到 Preferences，可以正常播放

---

## 🔍 调试步骤

### 步骤 1：连接设备并查看日志

```bash
# 确认设备已连接
adb devices

# 实时查看应用日志
adb logcat | grep -E "lrc|mediastore|media|file"
```

### 步骤 2：清除应用数据并重新测试

```bash
# 清除应用数据（保留 APK）
adb shell pm clear com.lrcplayer.app

# 重新启动应用
adb shell am start -n com.lrcplayer.app/.MainActivity
```

### 步骤 3：检查权限状态

```bash
# 查看应用权限
adb shell dumpsys package com.lrcplayer.app | grep "permission"

# 手动授予权限（如果需要）
adb shell pm grant com.lrcplayer.app android.permission.READ_EXTERNAL_STORAGE
adb shell pm grant com.lrcplayer.app android.permission.READ_MEDIA_AUDIO
```

### 步骤 4：检查 MediaStore 内容

```bash
# 查询 MediaStore 中的音频文件数量
adb shell content query --uri content://media/external/audio/media --projection count

# 查看所有音频文件路径
adb shell content query --uri content://media/external/audio/media --projection _data
```

### 步骤 5：触发媒体扫描

```bash
# 方法 1：重启媒体扫描服务
adb shell am broadcast -a android.intent.action.MEDIA_MOUNTED -d file:///sdcard

# 方法 2：扫描特定目录
adb shell am broadcast -a android.intent.action.MEDIA_SCANNER_SCAN_FILE -d file:///sdcard/Music/YourFolder
```

---

## 📋 常见问题

### 问题 1：MediaStore 数据库未更新

**症状**：
- 新添加的文件未被 MediaStore 索引
- `content://media/external/audio/media` 查询返回空

**解决**：
```bash
# 触发全盘扫描
adb shell am broadcast -a android.intent.action.MEDIA_MOUNTED -d file:///sdcard

# 等待 30 秒后重试
sleep 30

# 重新打开应用测试
```

### 问题 2：文件格式不被识别

**症状**：
- 文件存在但扩展名不标准
- 文件损坏或编码异常

**检查**：
```bash
# 查看文件夹中的实际文件
adb shell ls -la /sdcard/Music/YourFolder/

# 检查文件类型
adb shell file /sdcard/Music/YourFolder/*.mp3
```

**解决**：
- 确保文件扩展名正确（.mp3, .flac, .wav, .m4a）
- 尝试使用标准格式的测试文件

### 问题 3：权限授予不完整

**症状**：
- 只授予了部分权限
- Android 11+ 需要特殊处理

**检查**：
```bash
# 查看详细权限
adb shell dumpsys package com.lrcplayer.app | grep -E "READ_EXTERNAL|READ_MEDIA|MANAGE_EXTERNAL"
```

**解决**：
```bash
# 授予所有必要权限
adb shell pm grant com.lrcplayer.app android.permission.READ_EXTERNAL_STORAGE
adb shell pm grant com.lrcplayer.app android.permission.READ_MEDIA_AUDIO

# Android 11+ 可能需要
adb shell appops set com.lrcplayer.app MANAGE_EXTERNAL_STORAGE allow
```

### 问题 4：文件夹路径问题

**症状**：
- 选择的文件夹不在 MediaStore 监控范围内
- 使用了非标准路径

**检查**：
```bash
# 查看 MediaStore 监控的目录
adb shell content query --uri content://media/external/audio/media --projection _data | head -10
```

**解决**：
- 将音乐文件移动到标准目录：
  - `/sdcard/Music/`
  - `/sdcard/Download/`
  - `/sdcard/DCIM/`

### 问题 5：MediaStore 插件未正确注册

**症状**：
- Capacitor 同步时插件未注册
- JavaScript 调用原生代码失败
- 报错：`"MediaStore" plugin is not implemented on android`

**检查日志**：
```bash
adb logcat | grep -E "MediaStore|capacitor|plugin"
```

**解决**：
```bash
# 重新同步 Capacitor
npm run build
npx cap sync android

# ⚠️ 重新注册 MediaStore 插件（必须！）
python3 scripts/register-mediastore-plugin.py

# 重新构建并安装
cd android
./gradlew clean assembleDebug
cd ..
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 🔧 启用详细日志

### 方法 1：在应用中添加调试日志

编辑相关 TypeScript 文件，添加日志：

```typescript
console.log(`[FolderScanner] ========== scanWithMediaStore START ==========`);
console.log(`[FolderScanner] Input folderPath: ${folderPath}`);
```

### 方法 2：查看完整日志

```bash
# 保存日志到文件
adb logcat -v time > debug_log.txt

# 过滤关键信息
grep -E "MediaStore|scan|folder|file" debug_log.txt | tail -50
```

### 方法 3：使用 Chrome DevTools 调试

```bash
# 启动远程调试
adb shell am start -a android.intent.action.VIEW -d "chrome://inspect"

# 在 Chrome 中访问 chrome://inspect
# 找到你的应用，点击 "inspect"
```

---

## 📊 诊断清单

按顺序检查以下项目：

- [ ] **设备连接正常**
  ```bash
  adb devices
  # 应显示设备 ID 和 device 状态
  ```

- [ ] **应用已安装**
  ```bash
  adb shell pm list packages | grep lrcplayer
  ```

- [ ] **权限已授予**
  ```bash
  adb shell dumpsys package com.lrcplayer.app | grep "granted=true"
  ```

- [ ] **MediaStore 中有音频文件**
  ```bash
  adb shell content query --uri content://media/external/audio/media --projection count
  # 应返回大于 0 的数字
  ```

- [ ] **文件夹路径正确**
  ```bash
  adb shell ls -la /sdcard/Music/YourFolder/
  # 应显示文件列表
  ```

- [ ] **Capacitor 插件已注册**
  ```bash
  cat android/app/src/main/assets/capacitor.plugins.json
  # 应包含 MediaStore 插件
  ```

- [ ] **日志中无错误**
  ```bash
  adb logcat | grep -E "E/|Error|Exception"
  # 应无相关错误
  ```

---

## 💡 预防措施

1. **首次使用时**：
   - 等待 1-2 分钟让 MediaStore 完成初始扫描
   - 使用标准音乐目录（/sdcard/Music/）

2. **添加新文件后**：
   - 手动触发扫描或使用文件管理器刷新
   - 重启应用

3. **开发阶段**：
   - 始终启用详细日志
   - 定期检查 MediaStore 状态
   - 测试多种文件格式

4. **Capacitor 自定义插件维护**：
   - ⚠️ 每次 `npx cap sync` 后必须重新注册自定义插件
   - 自动化脚本应该在 sync 后自动执行注册
   - 参考 `scripts/register-mediastore-plugin.py`

---

## 📝 总结

### 问题根因

**MediaStore 插件未实现、未注册，且 AndroidManifest.xml 缺少权限**

1. TypeScript 接口存在，但 Android 原生代码缺失
2. 插件未注册到 `capacitor.plugins.json`
3. `npx cap sync` 会重置插件注册
4. SAF URI 需要转换为真实路径
5. **⚠️ AndroidManifest.xml 缺少存储权限（最关键！）**
   - 没有 `MANAGE_EXTERNAL_STORAGE`
   - 没有 `READ_MEDIA_AUDIO`
   - 没有 `READ_EXTERNAL_STORAGE`
   - 导致 MediaStore 查询返回 0 条记录

### 解决方案

1. ✅ 创建 `MediaStorePlugin.java` - 完整的 Android 原生实现
2. ✅ 添加存储权限到 `AndroidManifest.xml` ⭐ **关键步骤**
3. ✅ 手动注册插件到 `capacitor.plugins.json`
4. ✅ 实现 SAF URI 转换逻辑
5. ✅ 添加详细调试日志
6. ✅ 授予运行时权限 (`adb shell pm grant`)

### macOS 测试结果

- ✅ **成功扫描指定文件夹**：92个音轨（而非全部）
- ✅ **自动查找 LRC 歌词**：所有文件都找到对应的歌词
- ✅ **SAF URI 转换正确**：content:// → /storage/emulated/0/...
- ✅ **数据持久化**：保存到 Preferences，可正常播放
- ✅ **自动化脚本可用**：`npm run cap:android:deploy`

### 重要提醒

⚠️ **每次执行 `npx cap sync` 后，必须重新注册 MediaStore 插件！**

```bash
# Sync 后立即执行
python3 scripts/register-mediastore-plugin.py
```

---

**文档维护者**: Development Team  
**最后更新**: 2026-04-15  
**下次审查**: 2026-04-22  
**测试状态**: ✅ macOS 测试通过
