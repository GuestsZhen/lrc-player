import { convertTimeToTag, formatText, type ILyric } from "@lrc-maker/lrc-parser";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { type Action, ActionType } from "../hooks/useLrc.js";
import { webAudioPlayer } from "../utils/web-audio-player.js";
import { appContext } from "./app.context.js";
import { Curser } from "./curser.js";
import { PlaySVG, PauseSVG, PlaylistSVG, SettingsSVG } from "./svg.js";
import { simpleKeyDetector, type KeyDetectionResult } from "../utils/simple-key-detector.js";

// 存储当前加载的音频文件，用于调性检测
let currentAudioFile: File | null = null;

interface IPlayerProps {
    state: any;
    dispatch: React.Dispatch<Action>;
}

export const PlayerSoundTouch: React.FC<IPlayerProps> = ({ state, dispatch }) => {
    const { currentIndex, lyric } = state;
    const { prefState } = useContext(appContext);
    
    // UI 状态
    const [showTime, _setShowTime] = useState(false);
    const [fontSize, setFontSize] = useState(() => {
        return Number(sessionStorage.getItem("player-font-size")) || 1.3;
    });
    const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('center');
    const [backgroundColor, setBackgroundColor] = useState(() => {
        const savedColor = sessionStorage.getItem('player-bg-color');
        if (savedColor) return savedColor;
        const themeMode = localStorage.getItem('preferences') 
            ? JSON.parse(localStorage.getItem('preferences') || '{}').themeMode 
            : 0;
        return themeMode === 1 ? '#ededed' : '#2e2e2e';
    });
    const [lyricColor, setLyricColor] = useState(() => {
        const savedColor = sessionStorage.getItem('player-lyric-color');
        if (savedColor) return savedColor;
        const themeMode = localStorage.getItem('preferences') 
            ? JSON.parse(localStorage.getItem('preferences') || '{}').themeMode 
            : 0;
        return themeMode === 1 ? '#eeeeee' : '#ffffff';
    });
    const [subLyricOpacity, setSubLyricOpacity] = useState(() => {
        return Number(sessionStorage.getItem('player-sub-opacity')) || 0.3;
    });
    
    // 播放控制状态
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [audioFileName, setAudioFileName] = useState<string>('');
    const [isAudioInitialized, setIsAudioInitialized] = useState(false);  // 音频是否已初始化
    
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

    // 持久化设置
    useEffect(() => {
        sessionStorage.setItem('player-bg-color', backgroundColor);
        localStorage.setItem('player-bg-color', backgroundColor);
    }, [backgroundColor]);
    
    useEffect(() => {
        sessionStorage.setItem('player-lyric-color', lyricColor);
        localStorage.setItem('player-lyric-color', lyricColor);
    }, [lyricColor]);

    useEffect(() => {
        sessionStorage.setItem('player-sub-opacity', subLyricOpacity.toString());
        localStorage.setItem('player-sub-opacity', subLyricOpacity.toString());
    }, [subLyricOpacity]);

    useEffect(() => {
        sessionStorage.setItem("player-show-time", showTime.toString());
    }, [showTime]);

    useEffect(() => {
        sessionStorage.setItem("player-font-size", fontSize.toString());
    }, [fontSize]);

    // 监听事件
    useEffect(() => {
        const handleFontSizeChange = (event: CustomEvent<number>) => {
            setFontSize(event.detail);
        };
        const handleColorChange = (event: CustomEvent<string>) => {
            setLyricColor(event.detail);
        };
        const handleBgColorChange = (event: CustomEvent<string>) => {
            setBackgroundColor(event.detail);
        };
        const handleAlignChange = (event: CustomEvent<'left' | 'center' | 'right'>) => {
            setTextAlign(event.detail);
        };
        const handleOpacityChange = (event: CustomEvent<number>) => {
            setSubLyricOpacity(prev => Math.min(Math.max(prev + event.detail, 0.1), 1.0));
        };
        
        window.addEventListener('player-font-size-update' as any, handleFontSizeChange as any);
        window.addEventListener('player-lyric-color-change' as any, handleColorChange as any);
        window.addEventListener('player-bg-color-change' as any, handleBgColorChange as any);
        window.addEventListener('player-text-align-change' as any, handleAlignChange as any);
        window.addEventListener('player-sub-opacity-change' as any, handleOpacityChange as any);
        
        return () => {
            window.removeEventListener('player-font-size-update' as any, handleFontSizeChange as any);
            window.removeEventListener('player-lyric-color-change' as any, handleColorChange as any);
            window.removeEventListener('player-bg-color-change' as any, handleBgColorChange as any);
            window.removeEventListener('player-text-align-change' as any, handleAlignChange as any);
            window.removeEventListener('player-sub-opacity-change' as any, handleOpacityChange as any);
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

    // 点击歌词跳转
    const onLineClick = useCallback(
        (ev: React.MouseEvent<HTMLLIElement>) => {
            ev.stopPropagation();
            const target = ev.currentTarget;
            const key = Number.parseInt(target.dataset.key!, 10);
            const lineTime = lyric[key]?.time;
            
            if (lineTime !== undefined) {
                seekTo(lineTime);
            }
        },
        [lyric]
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
        
        window.addEventListener('trigger-st-key-detection' as any, handleStKeyDetection as any);
        window.addEventListener('st-adjust-pitch' as any, handleStAdjustPitch as any);
        window.addEventListener('st-reset-pitch' as any, handleStResetPitch as any);
        window.addEventListener('st-adjust-speed' as any, handleStAdjustSpeed as any);
        window.addEventListener('st-reset-speed' as any, handleStResetSpeed as any);
        window.addEventListener('st-toggle-vocal-removal' as any, handleStToggleVocalRemoval as any);
        
        return () => {
            window.removeEventListener('trigger-st-key-detection' as any, handleStKeyDetection as any);
            window.removeEventListener('st-adjust-pitch' as any, handleStAdjustPitch as any);
            window.removeEventListener('st-reset-pitch' as any, handleStResetPitch as any);
            window.removeEventListener('st-adjust-speed' as any, handleStAdjustSpeed as any);
            window.removeEventListener('st-reset-speed' as any, handleStResetSpeed as any);
            window.removeEventListener('st-toggle-vocal-removal' as any, handleStToggleVocalRemoval as any);
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
                    height: '100px',
                    minHeight: '100px',
                    zIndex: 233,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
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
                    
                    {/* 左侧：文件按钮 + 当前时间 */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        {/* 载入文件按钮 - 使用 PlaylistSVG，45px */}
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="ripple glow loadaudio-button"
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
                                opacity: 0.7
                            }}
                        >
                            <div style={{ transform: 'scale(1.875)', transformOrigin: 'center' }}>
                                <PlaylistSVG />
                            </div>
                        </button>
                        
                        {/* 当前时间 */}
                        {audioFileName && (
                            <div style={{ 
                                fontSize: '0.9rem',
                                fontVariantNumeric: 'tabular-nums',
                                minWidth: '40px',
                                textAlign: 'left'
                            }}>
                                {formatTime(currentTime)}
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
                            color: isAudioInitialized ? '#eeeeee' : '#666',
                            cursor: isAudioInitialized ? 'pointer' : 'not-allowed',
                            transition: 'all 0.2s ease',
                            position: 'absolute',
                            left: '50%',
                            top: '50%',
                            transform: 'translate(-50%, -50%)'
                        }}
                        title={!isAudioInitialized ? '等待音频加载...' : (isPlaying ? '暂停' : '播放')}
                    >
                        <div style={{ transform: 'scale(3.33)', transformOrigin: 'center' }}>
                            {isPlaying ? <PauseSVG /> : <PlaySVG />}
                        </div>
                    </button>
                    
                    {/* 右侧：总时长 + 设置按钮 */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        {audioFileName && (
                            <div style={{ 
                                fontSize: '0.9rem',
                                fontVariantNumeric: 'tabular-nums',
                                minWidth: '40px',
                                textAlign: 'right'
                            }}>
                                {formatTime(duration)}
                            </div>
                        )}
                        
                        {/* 设置按钮 - 链接到 preferences 页面 */}
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
                                textDecoration: 'none'
                            }}
                            title="速度设置"
                        >
                            <div style={{ transform: 'scale(1.875)', transformOrigin: 'center' }}>
                                <SettingsSVG />
                            </div>
                        </a>
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
