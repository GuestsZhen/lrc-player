# 音频调性检测功能集成指南

## 📦 第一步：安装依赖

```bash
pnpm add @mtg/essentia.js
```

安装完成后，TypeScript 错误会自动消失。

---

## 🚀 第二步：基础使用示例

### 1. 在 Footer 组件中检测当前播放歌曲的调性

修改 `src/components/footer.tsx`，添加调性检测功能：

```typescript
import { useState, useEffect } from 'react';
import { keyDetector, type KeyDetectionResult } from '../utils/key-detector';
import { audioRef } from '../utils/audiomodule';

export const Footer: React.FC = () => {
    const [detectedKey, setDetectedKey] = useState<KeyDetectionResult | null>(null);
    const [isDetecting, setIsDetecting] = useState(false);

    // 监听音频加载事件
    useEffect(() => {
        const handleAudioLoaded = async (event: CustomEvent<{ file: File }>) => {
            const file = event.detail?.file;
            if (!file) return;

            setIsDetecting(true);
            
            try {
                // 检测调性
                const result = await keyDetector.detectKeyFromFile(file, {
                    analysisDuration: 30  // 只分析前30秒，提高性能
                });
                
                setDetectedKey(result);
                console.log('检测到调性:', result.fullKey);
            } catch (error) {
                console.error('调性检测失败:', error);
            } finally {
                setIsDetecting(false);
            }
        };

        window.addEventListener('audio-loaded' as any, handleAudioLoaded as any);
        
        return () => {
            window.removeEventListener('audio-loaded' as any, handleAudioLoaded as any);
        };
    }, []);

    return (
        <footer className="app-footer">
            {/* ... 现有代码 ... */}
            
            {/* 显示检测结果 */}
            {detectedKey && (
                <div className="key-detection-result">
                    <span className="key-label">调性:</span>
                    <span className="key-value">{detectedKey.fullKey}</span>
                    {isDetecting && <span className="detecting-indicator">检测中...</span>}
                </div>
            )}
        </footer>
    );
};
```

### 2. 在 Player 页面显示调性信息

修改 `src/components/player.tsx`：

```typescript
import { useEffect, useState, useContext } from 'react';
import { appContext } from './app.context';

export const Player: React.FC<IPlayerProps> = ({ state, dispatch }) => {
    const { lang } = useContext(appContext);
    const [currentKey, setCurrentKey] = useState<string>('');

    // 监听调性变化事件
    useEffect(() => {
        const handleKeyDetected = (event: CustomEvent<{ key: string }>) => {
            setCurrentKey(event.detail.key);
        };

        window.addEventListener('key-detected' as any, handleKeyDetected as any);
        
        return () => {
            window.removeEventListener('key-detected' as any, handleKeyDetected as any);
        };
    }, []);

    return (
        <div className="player-container">
            {/* 显示当前调性 */}
            {currentKey && (
                <div className="player-key-display">
                    <span>{lang.player?.currentKey || '当前调性'}: {currentKey}</span>
                </div>
            )}
            
            {/* ... 现有的歌词显示代码 ... */}
        </div>
    );
};
```

---

## 🔧 第三步：高级用法

### 1. 批量检测播放列表中的歌曲调性

```typescript
import { keyDetector } from '../utils/key-detector';
import { playlistManager } from '../utils/playlist-manager';

// 批量检测所有歌曲的调性
async function detectAllTracksKeys() {
    const tracks = await playlistManager.getAllTracks();
    const results = [];

    for (const track of tracks) {
        try {
            if (track.file) {
                const result = await keyDetector.detectKeyFromFile(track.file);
                results.push({
                    trackName: track.name,
                    ...result
                });
                
                // 保存结果到 IndexedDB
                await playlistManager.updateTrackKey(track.id, result);
            }
        } catch (error) {
            console.error(`Failed to detect key for ${track.name}:`, error);
        }
    }

    return results;
}
```

### 2. 实时流式分析（边播放边检测）

```typescript
import { keyDetector } from '../utils/key-detector';
import { audioRef } from '../utils/audiomodule';

// 在音频播放时进行实时分析
async function startRealTimeKeyDetection() {
    if (!audioRef.current) return;

    const audioContext = new AudioContext();
    const source = audioContext.createMediaElementSource(audioRef.current);
    
    // 分析前10秒的音频
    const result = await keyDetector.detectKeyStreaming(
        audioContext,
        source,
        10  // 分析时长（秒）
    );
    
    console.log('实时检测结果:', result);
}
```

### 3. 与简谱转调工具集成

在 `src/components/tune.tsx` 中自动识别原曲调性：

```typescript
import { useEffect } from 'react';
import { keyDetector } from '../utils/key-detector';

export const Tune: React.FC<{...}> = ({ lrcState, lrcDispatch }) => {
    const [autoDetectedKey, setAutoDetectedKey] = useState<string>('C');

    // 当组件加载时，尝试从音频元数据或缓存中获取调性
    useEffect(() => {
        const loadDetectedKey = async () => {
            // 从 localStorage 或 IndexedDB 读取之前检测的结果
            const savedKey = localStorage.getItem('last-detected-key');
            if (savedKey) {
                setAutoDetectedKey(savedKey);
                setFromKey(savedKey);  // 自动设置原调
            }
        };

        loadDetectedKey();
    }, []);

    // 当检测到新调性时更新
    useEffect(() => {
        const handleKeyDetected = (event: CustomEvent<{ key: string }>) => {
            const detectedKey = event.detail.key;
            setAutoDetectedKey(detectedKey);
            setFromKey(detectedKey);  // 自动设置为原调
            
            // 保存到 localStorage
            localStorage.setItem('last-detected-key', detectedKey);
        };

        window.addEventListener('key-detected' as any, handleKeyDetected as any);
        
        return () => {
            window.removeEventListener('key-detected' as any, handleKeyDetected as any);
        };
    }, []);

    return (
        // ... 现有的 JSX 代码
    );
};
```

---

## 🎨 第四步：添加 UI 样式

在 `src/components/footer.css` 中添加：

```css
.key-detection-result {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 12px;
    background: rgba(var(--theme-rgb), 0.1);
    border-radius: 4px;
    font-size: 0.9rem;
}

.key-label {
    color: var(--text-secondary);
}

.key-value {
    color: var(--theme-color);
    font-weight: 600;
}

.detecting-indicator {
    color: var(--text-muted);
    font-size: 0.8rem;
    animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
}
```

在 `src/components/player.css` 中添加：

```css
.player-key-display {
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 8px 16px;
    background: rgba(0, 0, 0, 0.6);
    color: white;
    border-radius: 20px;
    font-size: 1rem;
    backdrop-filter: blur(10px);
    z-index: 100;
}
```

---

## 📝 第五步：更新语言文件

在 `src/languages/zh-CN.json` 中添加：

```json
{
    "player": {
        "currentKey": "当前调性",
        "keyDetection": "调性检测"
    },
    "footer": {
        "detectingKey": "检测调性中...",
        "keyDetected": "已检测调性"
    }
}
```

---

## ⚙️ 配置选项

### 调整分析参数

```typescript
// 快速检测（适合实时场景）
const result = await keyDetector.detectKeyFromFile(file, {
    analysisDuration: 10  // 只分析前10秒
});

// 精确检测（适合离线处理）
const result = await keyDetector.detectKeyFromFile(file, {
    analysisDuration: 60  // 分析前60秒，更准确
});
```

---

## 🐛 常见问题

### 1. 模块找不到错误

**问题**: `找不到模块"@mtg/essentia.js"`

**解决**: 
```bash
pnpm install @mtg/essentia.js
```

### 2. WebAssembly 加载失败

**问题**: Essentia 初始化失败

**解决**: 确保你的服务器正确配置了 `.wasm` 文件的 MIME 类型：

```nginx
# nginx 配置
location ~* \.wasm$ {
    types {
        application/wasm wasm;
    }
}
```

### 3. 内存占用过高

**问题**: 分析大文件时浏览器卡顿

**解决**: 
- 减少 `analysisDuration` 参数
- 使用流式分析而不是完整文件分析
- 在 Web Worker 中运行检测

---

## 🎯 完整工作流程

```
用户选择音频文件
    ↓
Footer 组件接收文件
    ↓
调用 keyDetector.detectKeyFromFile()
    ↓
Essentia.js 分析音频（WebAssembly）
    ↓
返回调性结果 { key, scale, strength }
    ↓
触发 'key-detected' 事件
    ↓
Player/Tune 组件接收并显示
    ↓
保存到 IndexedDB（可选）
```

---

## 📊 性能优化建议

1. **缓存检测结果**: 将检测结果保存到 IndexedDB，避免重复分析
2. **异步加载**: 在后台线程进行分析，不阻塞 UI
3. **采样优化**: 只分析音频的前 30 秒通常足够准确
4. **懒加载**: 只在用户需要时才初始化 Essentia

---

## 🔗 相关资源

- Essentia.js 官方文档: https://mtg.github.io/essentia.js/
- Essentia GitHub: https://github.com/MTG/essentia
- Web Audio API: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API

---

现在你可以开始集成了！需要我帮你实现具体的某个部分吗？
