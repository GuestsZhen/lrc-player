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
