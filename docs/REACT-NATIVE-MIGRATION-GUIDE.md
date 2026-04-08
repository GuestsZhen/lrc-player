# React Native 移动端迁移方案

## 📱 概述

本文档详细分析了将简谱 LRC 播放器从 Web 应用迁移到 React Native 移动端原生应用的可行性、技术方案、挑战和实施建议。

---

## 🎯 迁移动机与价值

### 优势
1. **原生体验**：更流畅的动画、更好的触摸交互
2. **离线能力**：天然支持离线使用，无需 Service Worker
3. **系统集成**：访问文件系统、通知、后台播放等原生功能
4. **性能提升**：音频处理、波形渲染性能更优
5. **应用商店分发**：可通过 App Store / Google Play 分发
6. **后台播放**：真正的后台音频播放支持

### 挑战
1. **Web API 依赖**：大量使用浏览器特有 API
2. **第三方库兼容性**：部分 Web 库无 RN 对应版本
3. **开发成本**：需要重写大部分组件和逻辑
4. **平台差异**：iOS 和 Android 需要分别适配

---

## 🔍 核心技术依赖分析

### 1. 音频处理层（关键）

#### 当前 Web 技术栈
```typescript
// 当前使用的音频相关库
- WaveSurfer.js 7.9.5        // 波形可视化和播放
- @wavesurfer/react           // WaveSurfer React 封装
- SoundTouch.js 0.3           // 音高和速度调节
- Essentia.js 0.1             // 音频特征分析
- Web Audio API               // 底层音频处理
```

#### React Native 替代方案

| Web 技术 | RN 替代方案 | 成熟度 | 说明 |
|---------|------------|--------|------|
| WaveSurfer.js | `react-native-track-player` + `react-native-audio-waveform` | ⭐⭐⭐⭐ | 专业音频播放库 |
| Web Audio API | `react-native-sound` / `expo-av` | ⭐⭐⭐⭐⭐ | 成熟的音频播放 |
| SoundTouch.js | `react-native-pitch-shifter` / 自定义 Native Module | ⭐⭐⭐ | 需要原生实现 |
| Essentia.js | `react-native-essentia` (需自行封装) | ⭐⭐ | 需要 C++ Bridge |
| HTMLAudioElement | `react-native-video` (音频模式) | ⭐⭐⭐⭐⭐ | 稳定可靠 |

**推荐方案：**
```json
{
  "dependencies": {
    "react-native-track-player": "^4.0.0",
    "react-native-audio-waveform": "^1.0.0",
    "react-native-sound": "^0.11.2",
    "expo-av": "~13.0.0"
  }
}
```

---

### 2. UI 组件层

#### 需要重写的组件

| Web 组件 | RN 组件 | 工作量 | 说明 |
|---------|--------|--------|------|
| `<div>` / `<span>` | `<View>` / `<Text>` | 🔴 高 | 全部重构 |
| CSS Flexbox | RN Flexbox | 🟢 低 | 语法类似 |
| `<input type="file">` | `react-native-document-picker` | 🟡 中 | 文件选择 |
| `<dialog>` | `react-native-modal` | 🟡 中 | 模态框 |
| `<progress>` | 自定义 Progress Bar | 🟡 中 | 进度条 |
| `<details>`/`<summary>` | 自定义折叠组件 | 🟡 中 | 折叠面板 |
| SVG Icons | `react-native-svg` | 🟢 低 | 直接迁移 |
| CSS Animations | `react-native-reanimated` | 🟡 中 | 动画系统 |

**推荐 UI 库：**
```json
{
  "dependencies": {
    "react-native-paper": "^5.0.0",      // Material Design 组件
    "react-native-elements": "^3.0.0",   // 通用 UI 组件
    "react-native-svg": "^13.0.0",       // SVG 支持
    "react-native-reanimated": "^3.0.0", // 高性能动画
    "react-native-gesture-handler": "^2.0.0" // 手势处理
  }
}
```

---

### 3. 状态管理

#### 当前方案
- React Context API
- Custom Hooks (useLrc, usePref, useLang)
- PubSub 模式

#### RN 迁移建议

**方案 A：保持现有架构（推荐）**
```typescript
// Context + Hooks 在 RN 中完全可用
// 只需少量调整即可复用
```

**方案 B：引入专业状态管理**
```json
{
  "dependencies": {
    "zustand": "^4.4.0",     // 轻量级状态管理
    "@tanstack/react-query": "^5.0.0" // 数据获取和缓存
  }
}
```

**优势：**
- ✅ Context API 在 RN 中工作方式相同
- ✅ 大部分业务逻辑可复用
- ✅ 学习成本低

---

### 4. 文件系统和存储

#### Web vs RN 对比

| 功能 | Web | React Native | 说明 |
|-----|-----|--------------|------|
| LocalStorage | `localStorage` | `@react-native-async-storage/async-storage` | 键值存储 |
| SessionStorage | `sessionStorage` | 内存存储 / AsyncStorage | 临时数据 |
| File Upload | `<input type="file">` | `react-native-document-picker` | 文件选择 |
| File System | File API | `react-native-fs` / `expo-file-system` | 文件操作 |
| Blob URL | `URL.createObjectURL()` | 直接文件路径 | 无需 Blob |

**推荐方案：**
```json
{
  "dependencies": {
    "@react-native-async-storage/async-storage": "^1.19.0",
    "react-native-document-picker": "^9.0.0",
    "react-native-fs": "^2.20.0"
  }
}
```

---

### 5. 路由导航

#### Web 方案
- 自定义 router.ts（基于 hash/location）

#### RN 方案
```json
{
  "dependencies": {
    "@react-navigation/native": "^6.0.0",
    "@react-navigation/stack": "^6.0.0",
    "@react-navigation/bottom-tabs": "^6.0.0"
  }
}
```

**路由映射：**
```typescript
// Web 路由 -> RN 屏幕
{
  '/editor': 'EditorScreen',
  '/synchronizer': 'SynchronizerScreen',
  '/player': 'PlayerScreen',
  '/tune': 'TuneScreen',
  '/lrc-utils': 'LrcUtilsScreen',
  '/gist': 'GistScreen',
  '/preferences': 'PreferencesScreen'
}
```

---

### 6. 国际化

#### 当前方案
- JSON 语言包
- useLang Hook

#### RN 迁移
**方案 A：保持现有方案（推荐）**
```typescript
// 语言包完全可复用
// 只需调整加载方式
import zhCN from './languages/zh-CN.json';
import enUS from './languages/en-US.json';
```

**方案 B：使用专业库**
```json
{
  "dependencies": {
    "react-i18next": "^13.0.0",
    "i18next": "^23.0.0"
  }
}
```

---

### 7. GitHub Gist 集成

#### 当前方案
- fetch API
- OAuth 认证

#### RN 迁移
```json
{
  "dependencies": {
    "react-native-app-auth": "^6.0.0",  // OAuth 认证
    "axios": "^1.4.0"                    // HTTP 客户端
  }
}
```

**优势：**
- ✅ fetch API 在 RN 中可用
- ✅ 业务逻辑几乎无需修改
- ✅ OAuth 流程更规范

---

## 🏗️ 架构设计建议

### 项目结构

```
lrc-player-mobile/
├── src/
│   ├── components/          # UI 组件
│   │   ├── common/         # 通用组件
│   │   ├── editor/         # 编辑器组件
│   │   ├── player/         # 播放器组件
│   │   └── ...
│   ├── screens/            # 页面屏幕
│   │   ├── EditorScreen.tsx
│   │   ├── SynchronizerScreen.tsx
│   │   ├── PlayerScreen.tsx
│   │   ├── TuneScreen.tsx
│   │   └── ...
│   ├── hooks/              # 自定义 Hooks（可复用）
│   │   ├── useLrc.ts      # ✅ 大部分可复用
│   │   ├── usePref.ts     # ✅ 大部分可复用
│   │   └── useLang.ts     # ✅ 大部分可复用
│   ├── services/           # 服务层
│   │   ├── audioService.ts    # 音频服务
│   │   ├── gistService.ts     # Gist 服务
│   │   └── storageService.ts  # 存储服务
│   ├── store/              # 状态管理
│   │   ├── lrcStore.ts
│   │   ├── prefStore.ts
│   │   └── playerStore.ts
│   ├── utils/              # 工具函数（部分可复用）
│   │   ├── lrcParser.ts   # ✅ 可复用
│   │   ├── keyDetector.ts # ❌ 需重写
│   │   └── ...
│   ├── languages/          # 语言包（✅ 完全可复用）
│   │   ├── zh-CN.json
│   │   ├── zh-TW.json
│   │   └── en-US.json
│   ├── navigation/         # 导航配置
│   │   └── AppNavigator.tsx
│   └── types/              # TypeScript 类型
│       └── index.ts
├── android/                # Android 原生代码
├── ios/                    # iOS 原生代码
├── assets/                 # 静态资源
│   ├── images/
│   ├── fonts/
│   └── svg/
└── App.tsx                 # 应用入口
```

---

## 📋 功能模块迁移优先级

### Phase 1: 核心功能（MVP）

**优先级：🔴 必须实现**

1. **音频播放器**
   - [ ] 基础播放/暂停
   - [ ] 进度控制
   - [ ] 文件加载
   - [ ] 后台播放

2. **歌词显示**
   - [ ] LRC 解析
   - [ ] 同步滚动
   - [ ] 高亮当前行

3. **基本 UI**
   - [ ] 播放器界面
   - [ ] 歌词编辑界面
   - [ ] 导航菜单

**预计工作量：4-6 周**

---

### Phase 2: 增强功能

**优先级：🟡 重要但不紧急**

4. **歌词编辑器**
   - [ ] 时间标签插入
   - [ ] 歌词文本编辑
   - [ ] 导入/导出

5. **歌词同步器**
   - [ ] 打点功能
   - [ ] 键盘快捷键（虚拟键盘）
   - [ ] 微调功能

6. **偏好设置**
   - [ ] 主题切换
   - [ ] 字体大小
   - [ ] 颜色自定义

**预计工作量：3-4 周**

---

### Phase 3: 特色功能

**优先级：🟢 锦上添花**

7. **简谱转调工具**
   - [ ] 转调算法
   - [ ] UI 界面
   - [ ] 导出功能

8. **歌词工具箱**
   - [ ] 歌词压缩
   - [ ] 时间偏移
   - [ ] 翻译分割

9. **Gist 云同步**
   - [ ] OAuth 登录
   - [ ] 上传/下载
   - [ ] Gist 管理

**预计工作量：3-4 周**

---

### Phase 4: 优化和完善

**优先级：🔵 持续改进**

10. **性能优化**
    - [ ] 波形渲染优化
    - [ ] 内存管理
    - [ ] 启动速度

11. **用户体验**
    - [ ] 动画效果
    - [ ] 手势操作
    - [ ] 无障碍支持

12. **测试和发布**
    - [ ] 单元测试
    - [ ] E2E 测试
    - [ ] App Store 提交

**预计工作量：2-3 周**

---

## 🔧 关键技术实现方案

### 1. 音频播放器实现

```typescript
// services/audioService.ts
import TrackPlayer, { 
  Capability, 
  State, 
  usePlaybackState 
} from 'react-native-track-player';

class AudioService {
  private isInitialized = false;

  async initialize() {
    if (this.isInitialized) return;

    await TrackPlayer.setupPlayer({
      maxCacheSize: 1024 * 10, // 10MB
    });

    await TrackPlayer.updateOptions({
      capabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SeekTo,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
      ],
      compactCapabilities: [
        Capability.Play,
        Capability.Pause,
      ],
    });

    this.isInitialized = true;
  }

  async loadAudio(filePath: string) {
    await TrackPlayer.reset();
    await TrackPlayer.add({
      id: 'track-1',
      url: filePath,
      title: 'Audio Track',
    });
  }

  async play() {
    await TrackPlayer.play();
  }

  async pause() {
    await TrackPlayer.pause();
  }

  async seekTo(seconds: number) {
    await TrackPlayer.seekTo(seconds);
  }

  getCurrentPosition(): Promise<number> {
    return TrackPlayer.getPosition();
  }

  getDuration(): Promise<number> {
    return TrackPlayer.getDuration();
  }

  // 音高调节（需要自定义 Native Module）
  async setPitch(semitones: number) {
    // 调用原生模块
    await NativeModules.PitchShifter.setPitch(semitones);
  }

  // 速度调节
  async setSpeed(rate: number) {
    await TrackPlayer.setRate(rate);
  }
}

export const audioService = new AudioService();
```

---

### 2. 波形可视化实现

```typescript
// components/Waveform.tsx
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import AudioWaveform from 'react-native-audio-waveform';

interface WaveformProps {
  audioPath: string;
  onSeek: (time: number) => void;
  currentTime: number;
}

export const Waveform: React.FC<WaveformProps> = ({
  audioPath,
  onSeek,
  currentTime,
}) => {
  const waveformRef = useRef<any>(null);

  useEffect(() => {
    // 加载音频并生成波形
    waveformRef.current?.loadAudio(audioPath);
  }, [audioPath]);

  return (
    <View style={styles.container}>
      <AudioWaveform
        ref={waveformRef}
        style={styles.waveform}
        waveColor="#eeeeee"
        scrubColor="#theme-color"
        onScrub={(time) => onSeek(time)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 100,
    marginVertical: 10,
  },
  waveform: {
    flex: 1,
  },
});
```

---

### 3. 歌词同步器实现

```typescript
// screens/SynchronizerScreen.tsx
import React, { useCallback, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { useLrc } from '../hooks/useLrc';
import { audioService } from '../services/audioService';
import { GestureHandlerRootView, GestureDetector, Gesture } from 'react-native-gesture-handler';

export const SynchronizerScreen: React.FC = () => {
  const { lyric, currentIndex, dispatch } = useLrc();
  const flatListRef = useRef<FlatList>(null);

  // 空格键替代：点击屏幕任意位置打点
  const handleTap = useCallback(async () => {
    const currentTime = await audioService.getCurrentPosition();
    dispatch({ 
      type: 'insertTimestamp', 
      payload: { lineIndex: currentIndex, time: currentTime } 
    });
    
    // 自动滚动到下一行
    flatListRef.current?.scrollToIndex({
      index: currentIndex + 1,
      animated: true,
    });
  }, [currentIndex, dispatch]);

  // 使用手势检测点击
  const tapGesture = Gesture.Tap().onEnd(handleTap);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <GestureDetector gesture={tapGesture}>
        <View style={{ flex: 1 }}>
          <FlatList
            ref={flatListRef}
            data={lyric}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                style={[
                  styles.lyricLine,
                  index === currentIndex && styles.activeLine,
                ]}
                onPress={() => {
                  // 手动选择行
                  dispatch({ type: 'selectLine', payload: index });
                }}
              >
                <Text style={styles.lineNumber}>{index + 1}</Text>
                <Text style={styles.lineText}>{item.text}</Text>
                <Text style={styles.timeTag}>
                  {item.time ? formatTime(item.time) : '--:--'}
                </Text>
              </TouchableOpacity>
            )}
            keyExtractor={(_, index) => index.toString()}
            getItemLayout={(_, index) => ({
              length: 60,
              offset: 60 * index,
              index,
            })}
          />
        </View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
};
```

---

### 4. 文件选择实现

```typescript
// components/FilePicker.tsx
import DocumentPicker from 'react-native-document-picker';
import * as FileSystem from 'expo-file-system';

export const pickAudioAndLrcFiles = async () => {
  try {
    // 选择音频文件
    const audioResult = await DocumentPicker.pick({
      type: [DocumentPicker.types.audio],
      allowMultiSelection: false,
    });

    if (!audioResult || audioResult.length === 0) {
      return null;
    }

    const audioFile = audioResult[0];

    // 复制到应用目录
    const audioDestPath = `${FileSystem.documentDirectory}${audioFile.name}`;
    await FileSystem.copyAsync({
      from: audioFile.uri,
      to: audioDestPath,
    });

    // 尝试查找同名 LRC 文件
    const lrcFileName = audioFile.name.replace(/\.[^.]+$/, '.lrc');
    
    // 提示用户选择 LRC 文件（可选）
    const lrcResult = await DocumentPicker.pick({
      type: [DocumentPicker.types.plainText],
      allowMultiSelection: false,
    });

    let lrcPath = null;
    if (lrcResult && lrcResult.length > 0) {
      const lrcFile = lrcResult[0];
      const lrcDestPath = `${FileSystem.documentDirectory}${lrcFile.name}`;
      await FileSystem.copyAsync({
        from: lrcFile.uri,
        to: lrcDestPath,
      });
      lrcPath = lrcDestPath;
    }

    return {
      audioPath: audioDestPath,
      lrcPath: lrcPath,
      audioName: audioFile.name,
    };
  } catch (error) {
    if (DocumentPicker.isCancel(error)) {
      console.log('用户取消了选择');
    } else {
      console.error('文件选择失败:', error);
    }
    return null;
  }
};
```

---

### 5. 后台播放配置

#### iOS (ios/Info.plist)
```xml
<key>UIBackgroundModes</key>
<array>
  <string>audio</string>
</array>
```

#### Android (android/app/src/main/AndroidManifest.xml)
```xml
<service
  android:name="com.guichaguri.trackplayer.service.MusicService"
  android:foregroundServiceType="mediaPlayback"
  android:exported="true">
  <intent-filter>
    <action android:name="android.intent.action.MEDIA_BUTTON" />
  </intent-filter>
</service>
```

---

## 🚀 快速启动方案

### 方案 A：Expo（推荐初学者）

```bash
# 1. 创建 Expo 项目
npx create-expo-app lrc-player-mobile --template blank-typescript

cd lrc-player-mobile

# 2. 安装核心依赖
npx expo install react-native-screens react-native-safe-area-context
npx expo install expo-av expo-file-system expo-document-picker
npm install @react-navigation/native @react-navigation/stack
npm install react-native-paper react-native-svg
npm install @react-native-async-storage/async-storage

# 3. 复制共享代码
cp -r ../lrc-player/src/hooks ./src/
cp -r ../lrc-player/src/languages ./src/
cp -r ../lrc-player/src/utils/lrc-parser.ts ./src/utils/

# 4. 开始开发
npx expo start
```

**优势：**
- ✅ 无需配置原生环境
- ✅ 快速原型开发
- ✅ 热重载支持
- ✅ 跨平台兼容性好

**劣势：**
- ❌ 某些原生功能受限
- ❌ 包体积较大
- ❌ 性能略低于纯 RN

---

### 方案 B：React Native CLI（推荐生产环境）

```bash
# 1. 创建 RN 项目
npx react-native init LrcPlayerMobile --template react-native-template-typescript

cd LrcPlayerMobile

# 2. 安装依赖
npm install react-native-track-player
npm install react-native-document-picker
npm install react-native-fs
npm install @react-native-async-storage/async-storage
npm install @react-navigation/native @react-navigation/stack
npm install react-native-paper react-native-svg react-native-reanimated

# 3. iOS Pod 安装
cd ios && pod install && cd ..

# 4. 运行
npx react-native run-android
npx react-native run-ios
```

**优势：**
- ✅ 完全控制原生代码
- ✅ 性能最优
- ✅ 包体积可控
- ✅ 可集成任何原生库

**劣势：**
- ❌ 配置复杂
- ❌ 需要 Xcode / Android Studio
- ❌ 学习曲线陡峭

---

## 💰 成本和风险评估

### 开发成本估算

| 阶段 | 工作量 | 人员配置 | 时间 |
|-----|--------|---------|------|
| 技术调研 | 1 周 | 1 高级前端 | 1 周 |
| Phase 1 (MVP) | 4-6 周 | 1-2 开发者 | 1.5 个月 |
| Phase 2 (增强) | 3-4 周 | 1-2 开发者 | 1 个月 |
| Phase 3 (特色) | 3-4 周 | 1-2 开发者 | 1 个月 |
| Phase 4 (优化) | 2-3 周 | 1 开发者 | 3 周 |
| 测试和发布 | 2 周 | 1 QA + 1 开发者 | 2 周 |
| **总计** | **15-20 周** | **1-2 人** | **4-5 个月** |

### 技术风险

| 风险 | 概率 | 影响 | 缓解措施 |
|-----|------|------|---------|
| 音频库不兼容 | 中 | 高 | 提前验证核心库 |
| 性能问题 | 中 | 中 | 早期性能测试 |
| 平台差异 | 高 | 中 | 双平台并行开发 |
| 第三方库废弃 | 低 | 高 | 选择成熟稳定的库 |
| 原生模块 Bug | 中 | 高 | 准备降级方案 |

---

## 📊 Web vs React Native 对比

### 代码复用率

| 模块 | 复用率 | 说明 |
|-----|--------|------|
| 业务逻辑 (Hooks) | 70-80% | 大部分可直接复用 |
| 语言包 | 100% | 完全复用 |
| LRC 解析器 | 100% | 完全复用 |
| 转调算法 | 100% | 纯 JS 逻辑 |
| UI 组件 | 0-10% | 需完全重写 |
| 音频处理 | 0-20% | API 完全不同 |
| 文件操作 | 0-10% | API 不同 |
| 样式 (CSS) | 0% | 需转换为 StyleSheet |

**总体代码复用率：约 30-40%**

---

### 性能对比

| 指标 | Web | React Native | 提升 |
|-----|-----|--------------|------|
| 启动速度 | 2-3s | 1-2s | ⬆️ 30-50% |
| 音频延迟 | 50-100ms | 10-30ms | ⬆️ 70% |
| 波形渲染 | 30-60fps | 60fps | ⬆️ 50% |
| 内存占用 | 150-200MB | 80-120MB | ⬇️ 40% |
| 后台播放 | ❌ 受限 | ✅ 完整支持 | 质的飞跃 |

---

## 🎓 学习资源

### React Native 入门
- [官方文档](https://reactnative.dev/docs/getting-started)
- [Expo 文档](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)

### 音频处理
- [react-native-track-player 文档](https://rntp.dev/)
- [Expo AV 文档](https://docs.expo.dev/versions/latest/sdk/av/)

### 最佳实践
- [React Native Performance](https://reactnative.dev/docs/performance)
- [React Native Directory](https://reactnative.directory/) - 库搜索

---

## ✅ 决策建议

### 适合迁移的情况
- ✅ 需要发布到 App Store / Google Play
- ✅ 需要后台播放功能
- ✅ 目标用户主要在移动端
- ✅ 有充足的开发资源（2+ 开发者，4-5 个月）
- ✅ 需要更好的性能和原生体验

### 不适合迁移的情况
- ❌ 仅作为个人项目，无商业需求
- ❌ 开发资源有限（单人，< 2 个月）
- ❌ 用户主要在桌面端使用
- ❌ 不需要应用商店分发
- ❌ 对后台播放无需求

### 折中方案：PWA 增强

如果迁移成本过高，可以考虑：

1. **优化现有 PWA**
   - 改进 Service Worker 缓存策略
   - 添加后台同步
   - 优化移动端响应式设计

2. **使用 Capacitor / Tauri**
   - 将现有 Web 应用包装为原生应用
   - 保留 90%+ 代码
   - 通过插件访问原生功能

```bash
# Capacitor 方案
npm install @capacitor/core @capacitor/cli
npx cap init
npx cap add ios
npx cap add android
```

**优势：**
- ✅ 代码复用率 90%+
- ✅ 开发周期短（1-2 个月）
- ✅ 可访问部分原生功能
- ✅ 成本低

**劣势：**
- ❌ 性能不如纯 RN
- ❌ 某些原生功能仍受限
- ❌ 包体积较大

---

## 📝 总结

### 推荐方案排序

1. **如果有充足资源且需要原生体验** → React Native CLI
2. **如果想快速验证市场** → Expo
3. **如果资源有限但需要移动应用** → Capacitor 包装
4. **如果主要用户是桌面端** → 优化现有 PWA

### 关键成功因素

1. **早期验证核心功能**：先实现音频播放和歌词显示
2. **选择合适的技术栈**：根据团队技能选择 Expo 或 CLI
3. **渐进式开发**：按 Phase 逐步实现，每个阶段都可发布
4. **充分测试**：特别是在不同设备和系统版本上
5. **社区支持**：选择活跃的第三方库

### 下一步行动

1. **技术预研（1 周）**
   - 搭建 RN 开发环境
   - 验证音频库可行性
   - 创建简单的 PoC

2. **原型开发（2 周）**
   - 实现基础播放器
   - 实现歌词显示
   - 验证核心交互

3. **评估和调整（1 周）**
   - 评估开发体验
   - 评估性能表现
   - 决定是否继续

---

**文档版本**: 1.0.0  
**创建时间**: 2026-04-08  
**适用项目版本**: lrc-player 6.0.4+
