import { convertTimeToTag, formatText, type ILyric } from "@lrc-maker/lrc-parser";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { type Action, ActionType } from "../hooks/useLrc.js";
import { webAudioPlayer } from "../utils/web-audio-player.js";
import { appContext } from "./app.context.js";
import { Curser } from "./curser.js";
import { PlaySVG, PauseSVG, SettingsSVG } from "./svg.js";
import { simpleKeyDetector, type KeyDetectionResult } from "../utils/simple-key-detector.js";
import { usePlayerSettings } from "../stores/playerSettings.js";

// 存储当前加载的音频文件，用于调性检测
let currentAudioFile: File | null = null;

interface IPlayerProps {
    state: any;
    dispatch: React.Dispatch<Action>;
}

export const PlayerSoundTouch: React.FC<IPlayerProps> = ({ state, dispatch }) => {
    const { currentIndex, lyric } = state;
    const { prefState } = useContext(appContext);
    
    // 使用新的 Player Settings Store
    const playerSettings = usePlayerSettings();
    
    // UI 状态
    const [showTime, _setShowTime] = useState(false);
    const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('center');
    
    // === 从 Store 获取的值（兼容旧代码）===
    const fontSize = playerSettings.fontSize;
    const setFontSize = playerSettings.setFontSize;
    const backgroundColor = playerSettings.bgColor;
    const setBackgroundColor = playerSettings.setBgColor;
    const lyricColor = playerSettings.lyricColor;
    const setLyricColor = playerSettings.setLyricColor;
    const subLyricOpacity = playerSettings.subOpacity;
    const setSubLyricOpacity = playerSettings.setSubOpacity;
    // ========================================
    
    // 播放控制状态
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [audioFileName, setAudioFileName] = useState<string>('');
    const [isAudioInitialized, setIsAudioInitialized] = useState(false);  // 音频是否已初始化
    
    // 进度条拖拽状态
    const [isSeeking, setIsSeeking] = useState(false);
    const [seekTime, setSeekTime] = useState(0);
    
    // 音高和速度调节
    const [pitchSemitones, setPitchSemitones] = useState(0);
    const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
    
    // 去人声（伴奏模式）状态
    const [vocalRemoval, setVocalRemoval] = useState(false);
    
    // 调性检测状态
    const [detectedKey, setDetectedKey] = useState<string>('');
    const [isDetectingKey, setIsDetectingKey] = useState(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const ul = useRef<HTMLUListElement>(null);
    
    // 辅助函数：获取文件名（不含扩展名）
    const getBaseName = (fileName: string): string => {
        return fileName.substring(0, fileName.lastIndexOf('.'));
    };
    
    // 辅助函数：查找匹配的 LRC 文件
    const findMatchingLrcFile = (audioFileName: string, files: File[]): File | null => {
        const audioBaseName = getBaseName(audioFileName).toLowerCase();
        
        for (const file of files) {
            if (file.name.toLowerCase().endsWith('.lrc')) {
                const lrcBaseName = getBaseName(file.name).toLowerCase();
                if (lrcBaseName === audioBaseName) {
                    return file;
                }
            }
        }
        
        return null;
    };

    // 设置 html 元素背景色为用户选择的颜色（仅在 Player-SoundTouch 页面）
    useEffect(() => {
        const originalHtmlBgColor = document.documentElement.style.backgroundColor;
        document.documentElement.style.setProperty('background-color', backgroundColor, 'important');
        
        return () => {
            // 组件卸载时恢复原来的背景色
            document.documentElement.style.backgroundColor = originalHtmlBgColor;
        };
    }, [backgroundColor]);

    useEffect(() => {
        sessionStorage.setItem("player-show-time", showTime.toString());
    }, [showTime]);

    useEffect(() => {
        sessionStorage.setItem("player-font-size", fontSize.toString());
    }, [fontSize]);

    // 监听事件
    useEffect(() => {
        const handleAlignChange = (event: CustomEvent<'left' | 'center' | 'right'>) => {
            setTextAlign(event.detail);
        };
        
        // 注意：字体大小已由 usePlayerSettings Store 自动处理，无需手动监听
        window.addEventListener('player-text-align-change' as any, handleAlignChange as any);
        
        return () => {
            window.removeEventListener('player-text-align-change' as any, handleAlignChange as any);
        };
    }, []);

    // 初始化 Web Audio Player
    useEffect(() => {
        webAudioPlayer.setTimeUpdateCallback((time) => {
            setCurrentTime(time);
            dispatch({ type: ActionType.refresh, payload: time });
        });
        
        webAudioPlayer.setEndedCallback(() => {
            setIsPlaying(false);
            setCurrentTime(0);
        });
        
        return () => {
            webAudioPlayer.destroy();
        };
    }, [dispatch]);

    // 自动滚动到当前行
    useEffect(() => {
        // 如果 currentIndex 无效或歌词为空，不执行滚动
        if (currentIndex === Infinity || currentIndex < 0 || lyric.length === 0) {
            return;
        }
        
        const line = ul.current?.children[currentIndex];
        if (!line || !ul.current) {
            return;
        }
        
        requestAnimationFrame(() => {
            const container = ul.current;
            if (!container) return;
            
            const lineRect = line.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            const targetPositionFromTop = viewportHeight * 0.3;
            const lineCenterY = lineRect.top - containerRect.top + (lineRect.height / 2);
            const targetOffset = targetPositionFromTop - containerRect.top;
            const scrollOffset = lineCenterY - targetOffset;
            const currentScrollTop = container.scrollTop;
            const newScrollTop = currentScrollTop + scrollOffset;
            
            // 确保 newScrollTop 不为负数且在合理范围内
            const maxScrollTop = container.scrollHeight - container.clientHeight;
            const validScrollTop = Math.max(0, Math.min(newScrollTop, maxScrollTop));
            
            // 只有当偏移量超过一定阈值时才滚动（避免微小抖动）
            if (Math.abs(scrollOffset) > 5) {
                container.scrollTo({
                    top: validScrollTop,
                    behavior: 'smooth'
                });
            }
        });
    }, [currentIndex, lyric]);

    // 修复 iOS Safari/Chrome 歌词不显示的渲染 Bug
    // 当歌词数据更新后，强制触发重新渲染
    useEffect(() => {
        if (lyric.length > 0 && ul.current) {
            // 通过微小的 transform 变化触发 iOS 重绘
            const el = ul.current;
            el.style.transform = 'translateZ(0)';
            // 在下一帧恢复
            requestAnimationFrame(() => {
                el.style.transform = 'translateZ(0.1px)';
            });
        }
    }, [lyric.length]);
    
    // 额外修复：当歌词数组内容变化时也触发重绘
    useEffect(() => {
        if (lyric.length > 0 && ul.current) {
            const el = ul.current;
            // 使用 setAttribute 触发 iOS 重绘
            el.setAttribute('data-repaint', Date.now().toString());
        }
    }, [lyric]);

    // 文件选择处理
    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;
        
        // 分离音频文件和 LRC 文件
        const audioFiles = Array.from(files).filter(file => 
            file.type.startsWith('audio/') || 
            ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.m4a', '.wma', '.ape', '.opus', '.ncm'].some(ext => 
                file.name.toLowerCase().endsWith(ext)
            )
        );
        
        const lrcFiles = Array.from(files).filter(file => file.name.toLowerCase().endsWith('.lrc'));
        
        if (audioFiles.length === 0) {
            alert('未找到音频文件');
            return;
        }
        
        // 使用第一个音频文件
        const audioFile = audioFiles[0];
        
        // 查找匹配的 LRC 文件
        const matchingLrc = findMatchingLrcFile(audioFile.name, lrcFiles);
        
        try {
            setAudioFileName(audioFile.name);
            currentAudioFile = audioFile; // 保存文件引用用于调性检测
            setIsAudioInitialized(false);  // 重置初始化状态
            
            await webAudioPlayer.init({
                audioFile: audioFile,
                initialPitch: pitchSemitones,
                initialSpeed: playbackSpeed
            });
            
            // ✅ 关键修复：设置时间更新回调，同步 React 状态并更新歌词索引
            webAudioPlayer.setTimeUpdateCallback((time: number) => {
                setCurrentTime(time);
                dispatch({ type: ActionType.refresh, payload: time });
            });
            
            setDuration(webAudioPlayer.getDuration());
            setIsAudioInitialized(true);  // 标记为已初始化
            
            // 如果有匹配的 LRC 文件，触发歌词加载
            if (matchingLrc) {
                // 通过事件通知父组件加载 LRC
                window.dispatchEvent(new CustomEvent('load-lrc-file', {
                    detail: { lrcFile: matchingLrc }
                }));
            }
            
            // 不自动播放，等待用户点击播放按钮
        } catch (error) {
            console.error('[PlayerSoundTouch] Failed to load file:', error);
            alert('音频文件加载失败');
            setIsAudioInitialized(false);  // 初始化失败，重置状态
        }
        
        // 清空 input，允许重复选择同一文件
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // 播放/暂停切换
    const togglePlay = () => {
        if (!audioFileName) {
            alert('请先选择音频文件');
            return;
        }
        
        // 直接使用 webAudioPlayer 的状态，避免 React 状态异步更新的问题
        const isCurrentlyPlaying = webAudioPlayer.getIsPlaying();
        
        if (isCurrentlyPlaying) {
            webAudioPlayer.pause();
            setIsPlaying(false);
        } else {
            // 从 webAudioPlayer 获取当前时间，而不是使用 React 状态
            const currentTime = webAudioPlayer.getCurrentTime();
            webAudioPlayer.play(currentTime);
            setIsPlaying(true);
        }
    };

    // 跳转到指定时间
    const seekTo = (time: number) => {
        webAudioPlayer.seek(time);
        setCurrentTime(time);
    };

    // 进度条拖动处理
    const handleProgressChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const newTime = parseFloat(e.target.value);
        seekTo(newTime);
    }, [seekTo]);

    const handleProgressInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const newTime = parseFloat(e.target.value);
        setSeekTime(newTime);
    }, []);

    const handleProgressMouseUp = useCallback(() => {
        if (seekTime !== currentTime) {
            seekTo(seekTime);
        }
    }, [seekTime, currentTime, seekTo]);

    // 点击歌词跳转
    const onLineClick = useCallback(
        (ev: React.MouseEvent<HTMLLIElement>) => {
            ev.stopPropagation();
            const key = parseInt(ev.currentTarget.dataset.key || '0', 10);
            const lineTime = lyric[key]?.time;
            
            if (lineTime !== undefined && !isNaN(lineTime)) {
                seekTo(lineTime);
            } else {
                console.warn('[PlayerSoundTouch] 无效的时间值');
            }
        },
        [seekTo, lyric]
    );

    // 调节音高
    const adjustPitch = (delta: number) => {
        const newPitch = Math.max(-12, Math.min(12, pitchSemitones + delta));
        setPitchSemitones(newPitch);
        webAudioPlayer.setPitch(newPitch);
        // 同步到 Header
        window.dispatchEvent(new CustomEvent('st-pitch-change', { detail: newPitch }));
    };

    // 调节速度
    const adjustSpeed = (delta: number) => {
        const newSpeed = Math.max(0.5, Math.min(2.0, playbackSpeed + delta));
        setPlaybackSpeed(newSpeed);
        webAudioPlayer.setSpeed(newSpeed);
        // 同步到 Header
        window.dispatchEvent(new CustomEvent('st-speed-change', { detail: newSpeed }));
    };

    // 切换去人声（伴奏模式）
    const toggleVocalRemoval = () => {
        const newState = !vocalRemoval;
        setVocalRemoval(newState);
        webAudioPlayer.setVocalRemoval(newState);
        // 同步到 Header
        window.dispatchEvent(new CustomEvent('st-vocal-removal-change', { detail: newState }));
    };

    // 调性检测
    const detectKey = async () => {
        if (!currentAudioFile) {
            alert('请先加载音频文件');
            return;
        }
        
        setIsDetectingKey(true);
        // 同步到 Header
        window.dispatchEvent(new CustomEvent('st-key-detection-start'));
        
        try {
            // 从当前播放时间点开始检测
            const result: KeyDetectionResult = await simpleKeyDetector.detectKeyFromFile(currentAudioFile, currentTime);
            setDetectedKey(result.fullKey);
            // 同步到 Header
            window.dispatchEvent(new CustomEvent('st-key-detection-result', { detail: result.fullKey }));
        } catch (error) {
            console.error('[PlayerSoundTouch] Key detection failed:', error);
            alert('调性检测失败：' + (error instanceof Error ? error.message : '未知错误'));
        } finally {
            setIsDetectingKey(false);
        }
    };

    // 监听来自 Header 的 ST歌曲调整命令
    useEffect(() => {
        const handleStKeyDetection = () => {
            detectKey();
        };
        
        const handleStAdjustPitch = (event: CustomEvent<number>) => {
            adjustPitch(event.detail);
        };
        
        const handleStResetPitch = () => {
            setPitchSemitones(0);
            webAudioPlayer.setPitch(0);
            window.dispatchEvent(new CustomEvent('st-pitch-change', { detail: 0 }));
        };
        
        const handleStAdjustSpeed = (event: CustomEvent<number>) => {
            adjustSpeed(event.detail);
        };
        
        const handleStResetSpeed = () => {
            setPlaybackSpeed(1.0);
            webAudioPlayer.setSpeed(1.0);
            window.dispatchEvent(new CustomEvent('st-speed-change', { detail: 1.0 }));
        };
        
        const handleStToggleVocalRemoval = () => {
            toggleVocalRemoval();
        };
        
        // 监听来自 Header 的打开文件事件
        const handleTriggerFileOpen = () => {
            if (fileInputRef.current) {
                fileInputRef.current.click();
            }
        };
        
        window.addEventListener('trigger-st-key-detection' as any, handleStKeyDetection as any);
        window.addEventListener('st-adjust-pitch' as any, handleStAdjustPitch as any);
        window.addEventListener('st-reset-pitch' as any, handleStResetPitch as any);
        window.addEventListener('st-adjust-speed' as any, handleStAdjustSpeed as any);
        window.addEventListener('st-reset-speed' as any, handleStResetSpeed as any);
        window.addEventListener('st-toggle-vocal-removal' as any, handleStToggleVocalRemoval as any);
        window.addEventListener('trigger-st-file-open' as any, handleTriggerFileOpen as any);
        
        return () => {
            window.removeEventListener('trigger-st-key-detection' as any, handleStKeyDetection as any);
            window.removeEventListener('st-adjust-pitch' as any, handleStAdjustPitch as any);
            window.removeEventListener('st-reset-pitch' as any, handleStResetPitch as any);
            window.removeEventListener('st-adjust-speed' as any, handleStAdjustSpeed as any);
            window.removeEventListener('st-reset-speed' as any, handleStResetSpeed as any);
            window.removeEventListener('st-toggle-vocal-removal' as any, handleStToggleVocalRemoval as any);
            window.removeEventListener('trigger-st-file-open' as any, handleTriggerFileOpen as any);
        };
    }, [detectKey, adjustPitch, adjustSpeed, toggleVocalRemoval]);

    // 格式化时间
    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // 根据检测到的调和半音偏移计算当前调
    const getCurrentKey = (): string => {
        if (!detectedKey) {
            // 如果没有检测到调，显示半音数
            return pitchSemitones > 0 ? `+${pitchSemitones}` : pitchSemitones.toString();
        }
        
        // 提取基础调（如 "C" from "C Major"）
        const baseKey = detectedKey.split(' ')[0];
        
        // 定义所有调的顺序（包括升降号）
        const keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        
        // 找到基础调的索引
        const baseIndex = keys.indexOf(baseKey);
        if (baseIndex === -1) {
            // 如果找不到，返回原始格式
            return `${baseKey}${pitchSemitones > 0 ? '+' : ''}${pitchSemitones}`;
        }
        
        // 计算新的调索引（处理循环）
        const newIndex = (baseIndex + pitchSemitones + 12) % 12;
        
        return keys[newIndex];
    };

    const LyricLineIter = useCallback(
        (line: Readonly<ILyric>, index: number) => {
            const highlight = index === currentIndex;
            return (
                <LyricLine
                    key={index}
                    index={index}
                    line={line}
                    highlight={highlight}
                    showTime={showTime}
                    prefState={prefState}
                    onClick={onLineClick}
                    opacity={1}
                />
            );
        },
        [currentIndex, showTime, prefState, onLineClick],
    );

    return (
        <div 
            className="player-container player-soundtouch-container"
            style={{ backgroundColor }}
        >
            {/* 文件选择和播放控制 - 参考 lrc-audio 样式 */}
            <div className="soundtouch-controls" style={{
                    position: 'fixed',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    width: '100%',
                    height: '110px',
                    minHeight: '110px',
                    zIndex: 233,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    padding: '10px 20px env(safe-area-inset-bottom) 20px',
                    backgroundColor: '#202020cc',  // var(--semi-black-color)
                    color: '#eeeeee',  // var(--white)
                    fontSize: '14px',
                    userSelect: 'none'
                }}>
                    <input
                        ref={fileInputRef}
                        type="file"
                        // 不设置 accept 属性，允许选择所有文件类型（iOS Chrome 兼容）
                        multiple
                        onChange={handleFileSelect}
                        style={{ display: 'none' }}
                    />
                    
                    {/* 进度条 - 顶部 */}
                    {audioFileName && duration > 0 && (
                        <div style={{ 
                            width: '100%',
                            padding: '0 10px'
                        }}>
                            <div className="slider timeline-slider" style={{ width: '100%' }}>
                                <progress value={duration > 0 ? currentTime / duration : 0} />
                                <input
                                    type="range"
                                    className="timeline"
                                    min={0}
                                    max={duration}
                                    step={1}
                                    value={isSeeking ? seekTime : currentTime}
                                    onChange={handleProgressChange}
                                    onInput={handleProgressInput}
                                    onMouseUp={handleProgressMouseUp}
                                    onTouchEnd={handleProgressMouseUp}
                                    style={{ 
                                        width: '100%'
                                    }}
                                />
                            </div>
                        </div>
                    )}
                    
                    {/* 底部控制按钮区域 */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '100%'
                    }}>
                        {/* 左侧：当前时间 */}
                        <div style={{ 
                            flex: 1,
                            display: 'flex',
                            justifyContent: 'flex-end',
                            paddingRight: '20px'
                        }}>
                            {audioFileName && (
                                <div style={{ 
                                    fontSize: '0.9rem',
                                    fontVariantNumeric: 'tabular-nums',
                                    minWidth: '50px',
                                    textAlign: 'right'
                                }}>
                                    {formatTime(isSeeking ? seekTime : currentTime)}
                                </div>
                            )}
                        </div>
                    
                        {/* 播放/暂停按钮 - 居中 */}
                        <button 
                            onClick={togglePlay}
                            disabled={!isAudioInitialized}
                            className="ripple glow"
                            style={{
                                width: '80px',
                                height: '80px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: 'none',
                                border: 'none',
                                color: '#eeeeee',
                                cursor: isAudioInitialized ? 'pointer' : 'not-allowed',
                                transition: 'all 0.2s ease',
                                opacity: isAudioInitialized ? 1 : 0.5
                            }}
                            title={!isAudioInitialized ? '等待音频加载...' : (isPlaying ? '暂停' : '播放')}
                        >
                            <div style={{ transform: 'scale(3.33)', transformOrigin: 'center' }}>
                                {isPlaying ? <PauseSVG /> : <PlaySVG />}
                            </div>
                        </button>
                        
                        {/* 右侧：总时长 + 设置按钮 */}
                        <div style={{ 
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            paddingLeft: '20px'
                        }}>
                            {audioFileName && (
                                <div style={{ 
                                    fontSize: '0.9rem',
                                    fontVariantNumeric: 'tabular-nums',
                                    minWidth: '50px',
                                    textAlign: 'left'
                                }}>
                                    {formatTime(duration)}
                                </div>
                            )}
                            
                            {/* 设置按钮 - 使用 marginLeft: 'auto' 始终靠右 */}
                            <a 
                                href="#/preferences/"
                                className="ripple glow"
                                style={{
                                    width: '45px',
                                    height: '45px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background: 'none',
                                    border: 'none',
                                    color: '#eeeeee',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    opacity: 0.7,
                                    textDecoration: 'none',
                                    marginLeft: 'auto'  // ✅ 关键：始终推到最右边
                                }}
                                title="速度设置"
                            >
                                <div style={{ transform: 'scale(1.875)', transformOrigin: 'center' }}>
                                    <SettingsSVG />
                                </div>
                            </a>
                        </div>
                    </div>
                </div>
            {/* 控制面板始终显示，无关闭按钮 */}
            {/* 歌词列表 */}
            <ul 
                ref={ul} 
                className="player-lyric-list" 
                style={{ 
                    fontSize: `${fontSize}rem`, 
                    textAlign,
                    ['--player-bg-color' as any]: backgroundColor,
                    ['--player-lyric-color' as any]: lyricColor,
                    ['--player-sub-opacity' as any]: subLyricOpacity
                }}
            >
                {state.lyric.map(LyricLineIter)}
            </ul>
        </div>
    );
};

interface ILyricLineProps {
    line: ILyric;
    index: number;
    highlight: boolean;
    showTime: boolean;
    prefState: any;
    onClick: (ev: React.MouseEvent<HTMLLIElement>) => void;
    opacity?: number;
}

const LyricLine: React.FC<ILyricLineProps> = ({ line, index, highlight, showTime, prefState, onClick, opacity = 1 }) => {
    const lineTime = convertTimeToTag(line.time, prefState.fixed);
    const lineText = formatText(line.text, prefState.spaceStart, prefState.spaceEnd);

    const renderLyricText = (text: string) => {
        const slashIndex = text.indexOf('/');
        
        if (slashIndex === -1) {
            return <span className="player-line-text">{text}</span>;
        } else {
            const firstPart = text.substring(0, slashIndex);
            const secondPart = text.substring(slashIndex + 1);
            
            return (
                <div className="player-line-text-container">
                    <span className="player-line-text-main">{firstPart}</span>
                    <span className="player-line-text-sub">{secondPart}</span>
                </div>
            );
        }
    };

    return (
        <li 
            key={index} 
            data-key={index} 
            className={`player-line ${highlight ? 'highlight' : ''}`}
            onClick={onClick}
            style={{ 
                cursor: 'pointer',
                opacity: highlight ? 1 : opacity
            }}
        >
            {highlight && showTime && <Curser fixed={prefState.fixed} />}
            {showTime && line.time !== undefined && (
                <time className="player-line-time">{lineTime}</time>
            )}
            {renderLyricText(lineText)}
        </li>
    );
};
