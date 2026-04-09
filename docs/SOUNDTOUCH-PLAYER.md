# SoundTouchJS 高级播放器

## 📋 概述

`/player-soundtouch/` 页面是一个基于 **Web Audio API + SoundTouchJS** 的高级播放器，支持以下功能：

- ✅ **音高调节**（Pitch Shift）：在不改变播放速度的情况下调整音调
- ✅ **速度调节**（Time Stretch）：在不改变音调的情况下调整播放速度
- ✅ **歌词同步显示**：与普通播放器相同的歌词展示功能
- ⚠️ **Seek 限制**：启用音高调节后，跳转进度会从头播放（SoundTouchJS 的技术限制）

## 🎯 使用场景

### 普通播放器 (`/player/`)
- 基于 HTMLAudioElement
- 稳定、兼容性好
- 支持完整的 seek 功能
- ❌ 不支持音高/速度独立调节

### 高级播放器 (`/player-soundtouch/`)
- 基于 Web Audio API + SoundTouchJS
- ✅ 支持音高和速度独立调节
- ⚠️ Seek 功能有限制
- 适合需要调音的专业场景

## 🔧 技术架构

### 核心组件

1. **WebAudioPlayer** (`src/utils/web-audio-player.ts`)
   - 封装 Web Audio API 和 SoundTouchJS
   - 管理音频上下文、缓冲区和节点链
   - 提供播放、暂停、seek、音高/速度调节接口

2. **PlayerSoundTouch** (`src/components/player-soundtouch.tsx`)
   - React 组件，负责 UI 渲染
   - 监听歌词状态并自动滚动
   - 支持点击歌词跳转

3. **混合 Seek 方案**
   ```typescript
   // 无音高调节时：使用原生 AudioBufferSourceNode（支持 seek）
   if (startOffset > 0 && !needPitchShift) {
       this.sourceNode.start(0, startOffset); // ✅ 完美支持
   } else {
       // 有音高调节时：使用 PitchShifter（不支持 seek）
       this.pitchShifter = new PitchShifter(...);
       // ⚠️ 会从头播放
   }
   ```

## 🚀 使用方法

### 1. 访问高级播放器

在 Header 中点击 **"ST"** 按钮，或直接访问：
```
http://localhost:5173/#/player-soundtouch/
```

### 2. 加载音频文件

**重要**：此页面有独立的文件加载系统，不会自动从普通播放器继承音频。

1. 点击页面底部的 **"选择文件"** 按钮
2. 可以选择以下文件：
   - **音频文件**：MP3、WAV、FLAC、AAC、OGG、M4A、WMA、APE、OPUS、NCM 等
   - **歌词文件**：LRC 格式（可选）
3. **智能匹配**：如果同时选择了音频和同名 LRC 文件，会自动加载歌词
   - 例如：`song.mp3` + `song.lrc` → 自动关联
4. 文件会自动开始播放

### 3. 播放控制

页面底部有一个控制面板，包含：
- **选择文件**：加载新的音频文件
- **播放/暂停**：控制播放状态
- **时间显示**：当前播放时间 / 总时长
- **音高调节**：-12 到 +12 半音
- **速度调节**：0.5x 到 2.0x

点击控制面板右上角的 **×** 可以隐藏面板，点击右下角的 **⚙️** 按钮可以重新显示。

### 4. 注意事项

⚠️ **重要限制**：
- 启用音高调节后，点击歌词或拖动进度条会从**歌曲开头**重新播放
- 这是 SoundTouchJS 库的技术限制，无法绕过
- 建议在不需频繁跳转的场景下使用音高调节功能

## 📊 技术对比

### 核心技术差异

| 对比项 | `/player` (普通播放器) | `/player-soundtouch` (ST播放器) |
|--------|----------------------|-------------------------------|
| **音频技术** | HTMLAudioElement | Web Audio API + SoundTouchJS |
| **音高调节** | ❌ 不支持 | ✅ 支持 (SoundTouchJS PitchShifter) |
| **速度调节** | ⚠️ 会同时改变音高 | ✅ 独立调节，不影响音高 |
| **去人声** | ❌ 不支持 | ✅ 支持 (相位抵消法) |
| **调性检测** | ❌ 不支持 | ✅ 支持 |
| **Seek 功能** | ✅ 完美支持 | ⚠️ 启用音高调节后受限 |
| **内存占用** | 低 (流式加载) | 较高 (需加载整个 AudioBuffer) |
| **CPU 占用** | 低 | 中等 (实时音频处理) |
| **兼容性** | 所有浏览器 | 现代浏览器 (需支持 Web Audio API) |

### 为什么 `/player` 不支持音高调节？

#### HTMLAudioElement 的技术限制

`/player` 使用浏览器原生的 `HTMLAudioElement`，这是 HTML5 标准音频元素：

```typescript
// player.tsx 使用 audioRef
import { audioRef } from '../utils/audiomodule.js';

// HTMLAudioElement 只能这样调节速度：
audio.playbackRate = 1.5;  // ❌ 速度变快，音高也会变高（像快放磁带）

// 没有音高调节 API：
audio.pitch = 2;  // ❌ 不存在这个 API
```

**HTMLAudioElement 的局限性**：
- 只能控制播放速度 (`playbackRate`)
- 改变速度会同时改变音高（物理特性）
- 无法访问底层音频数据进行处理
- 不支持 Web Audio API 的 AudioNode 链

#### Web Audio API 的优势

`/player-soundtouch` 使用 `Web Audio API` + `SoundTouchJS` 库：

```typescript
// player-soundtouch.tsx 使用 webAudioPlayer
import { webAudioPlayer } from '../utils/web-audio-player.js';
import { PitchShifter } from 'soundtouchjs';

// 可以独立控制：
webAudioPlayer.setPitch(2);    // ✅ 音高 +2 个半音，速度不变
webAudioPlayer.setSpeed(1.5);  // ✅ 速度 1.5 倍，音高不变
```

**工作原理**：
1. 使用 `AudioContext.decodeAudioData()` 将音频解码为 `AudioBuffer`
2. 通过 `SoundTouchJS` 的 `PitchShifter` 处理音频数据
3. 使用 `AudioBufferSourceNode` 播放处理后的音频
4. 可以添加任意 `AudioNode`（如去人声的 ChannelSplitter/Merger）

### 音频处理链对比

```
/player (HTMLAudioElement):
音频文件 → HTMLAudioElement → 扬声器
          (无法干预中间处理)

/player-soundtouch (Web Audio API):
音频文件 → AudioBuffer → PitchShifter → GainNode → 扬声器
                     (可添加任意处理节点)
                     - 音高调节
                     - 速度调节  
                     - 去人声 (相位抵消)
                     - 均衡器
                     - 混响等
```

### 去人声功能实现 (仅 ST播放器)

使用相位抵消法去除居中声道的人声：

```typescript
// web-audio-player.ts
// 分离左右声道
const splitter = audioContext.createChannelSplitter(2);

// 反相左声道
const inverterL = audioContext.createGain();
inverterL.gain.value = -1;  // 反相

// 合并声道（L + R）
const merger = audioContext.createChannelMerger(2);

// 居中的人声会被抵消（相位相反，互相抵消）
// 左右声道不同的乐器会被保留
```

### Seek 功能限制说明

**问题**：ST 播放器启用音高调节后，Seek 会从头播放

**原因**：SoundTouchJS 的 `PitchShifter` 是流式处理，不支持随机访问

**解决方案**：
1. **无音高调节时**：使用原生 `AudioBufferSourceNode.start(0, offset)` 完美支持 Seek
2. **有音高调节时**：必须使用 `PitchShifter`，只能从头播放

```typescript
// web-audio-player.ts 中的混合方案
if (startOffset > 0 && !needPitchShift) {
    // ✅ 无音高调节：使用原生节点，支持 Seek
    this.sourceNode.start(0, startOffset);
} else {
    // ⚠️ 有音高调节：使用 PitchShifter，从头播放
    this.pitchShifter = new PitchShifter(...);
}
```

---

## 📊 性能对比

| 特性 | 普通播放器 | 高级播放器 |
|------|-----------|-----------|
| 音高调节 | ❌ | ✅ |
| 速度调节（不影响音调） | ❌ | ✅ |
| Seek 功能 | ✅ 完美 | ⚠️ 有限制 |
| 内存占用 | 低 | 较高（需解码为 AudioBuffer） |
| CPU 占用 | 低 | 中等（实时音频处理） |
| 兼容性 | 所有浏览器 | 现代浏览器（支持 Web Audio API） |

## 🔍 故障排查

### 问题 1：点击歌词没有反应

**原因**：音频文件尚未加载完成

**解决**：
1. 确认已选择音频文件
2. 等待音频解码完成（查看控制台日志）
3. 刷新页面重试

### 问题 2：音高调节不生效

**原因**：可能使用了原生节点而非 PitchShifter

**解决**：
1. 检查控制台日志，确认是否显示 "Using PitchShifter"
2. 确保音高值不为 0
3. 重新加载音频文件

### 问题 3：Seek 后从头播放

**原因**：启用了音高调节，触发了 SoundTouchJS 的限制

**解决**：
- 这是已知限制，无法修复
- 如需频繁跳转，请关闭音高调节（设为 0 半音）
- 或使用普通播放器 (`/player/`)

## 🛠️ 开发说明

### 文件结构

```
src/
├── components/
│   ├── player-soundtouch.tsx    # SoundTouchJS 播放器组件
│   └── player.tsx               # 普通播放器组件
├── utils/
│   ├── web-audio-player.ts      # Web Audio 管理器
│   └── audiomodule.ts           # 音频模块（HTMLAudioElement）
└── const/
    └── router.json              # 路由配置
```

### 关键代码位置

1. **路由配置**：`src/const/router.json`
   ```json
   "playerSoundTouchJS": "/player-soundtouch/"
   ```

2. **Content 路由处理**：`src/components/content.tsx`
   ```typescript
   case ROUTER.playerSoundTouchJS:
       return <LazyPlayerSoundTouch state={lrcState} dispatch={lrcDispatch} />;
   ```

3. **Header 入口按钮**：`src/components/header.tsx`
   ```tsx
   <a href={prependHash(ROUTER.playerSoundTouchJS)}>ST</a>
   ```

## 📝 未来改进方向

1. **优化 Seek 体验**
   - 探索其他音频处理库（如 Rubber Band WASM）
   - 实现相位声码器算法

2. **性能优化**
   - 减少 AudioBuffer 内存占用
   - 优化 PitchShifter 缓冲区大小

3. **用户体验**
   - 添加音高调节时的 Seek 警告提示
   - 提供切换回普通播放器的快捷方式

## 🔗 相关资源

- [SoundTouchJS GitHub](https://github.com/cutterbl/SoundTouchJS)
- [Web Audio API MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [项目主 README](../README.md)
