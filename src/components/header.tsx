import ROUTER from "#const/router.json" assert { type: "json" };
import { useContext, useEffect, useState, useCallback, useRef } from "react";
import { prependHash } from "../utils/router.js";
import { appContext } from "./app.context.js";
import { usePlayerSettings } from "../stores/playerSettings.js";
import { useNavigation } from "../stores/navigation.js";
import { PlayerSettingsPanel } from "./PlayerSettingsPanel.js";  // ✅ 从根目录导入
import { PlaySVG, EditorSVG, FullscreenSVG, FullscreenExitSVG, TuneSVG, SynchronizerSVG, SettingsTSVG, PlaylistSVG, MusicKeySVG } from "./svg.js";
// Capacitor Android 迁移相关
import { isAndroidNative } from '../utils/platform-detector.js';
import { MSFileListPanel } from './MSFileListPanel.js';
import { AudioFileAdapter } from '../utils/audio-file-adapter.js';
import type { AudioTrack } from '../utils/mediastore-plugin.js';

export const Header: React.FC = () => {
    // ✅ 调试日志：确认组件加载
    
    const { lang } = useContext(appContext);
    
    // 使用新的 Stores
    const playerSettings = usePlayerSettings();
    const navigation = useNavigation();
    
    // 判断当前是否在 Player 页面（不包括 player-soundtouch）
    const [isPlayerPage, setIsPlayerPage] = useState(() => {
        return location.hash.includes(ROUTER.player) && !location.hash.includes(ROUTER.playerSoundTouchJS);
    });
    
    // 判断当前是否在 Player-SoundTouch 页面
    const [isPlayerSoundTouchPage, setIsPlayerSoundTouchPage] = useState(() => {
        return location.hash.includes(ROUTER.playerSoundTouchJS);
    });
    
    // 判断当前是否在 Preferences 页面
    const [isPreferencesPage, setIsPreferencesPage] = useState(() => {
        return location.hash.includes(ROUTER.preferences);
    });
    
    // 判断当前是否在 Lrc-utils 页面
    const [isLrcUtilsPage, setIsLrcUtilsPage] = useState(() => {
        return location.hash.includes(ROUTER.lrcutils);
    });
    
    // 判断当前是否在 Synchronizer 页面
    const [isSynchronizerPage, setIsSynchronizerPage] = useState(() => {
        return location.hash.includes(ROUTER.synchronizer);
    });
    
    // 判断当前是否在 Tune 页面
    const [isTunePage, setIsTunePage] = useState(() => {
        return location.hash.includes(ROUTER.tune);
    });
    
    // 监听路由变化，更新状态
    useEffect(() => {
        const checkRoute = () => {
            setIsPlayerPage(location.hash.includes(ROUTER.player) && !location.hash.includes(ROUTER.playerSoundTouchJS));
            setIsPlayerSoundTouchPage(location.hash.includes(ROUTER.playerSoundTouchJS));
            setIsPreferencesPage(location.hash.includes(ROUTER.preferences));
            setIsLrcUtilsPage(location.hash.includes(ROUTER.lrcutils));
            setIsSynchronizerPage(location.hash.includes(ROUTER.synchronizer));
            setIsTunePage(location.hash.includes(ROUTER.tune));
        };
        
        // 初始检查一次
        checkRoute();
        
        // 监听 hashchange 事件
        window.addEventListener('hashchange', checkRoute);
        
        // 清理监听器
        return () => window.removeEventListener('hashchange', checkRoute);
    }, []);
    
    // 控制 Editor 菜单显示
    const [showEditorMenu, setShowEditorMenu] = useState(false);
    
    // 文件列下面板显示状态
    const [_showFileListPanel, setShowFileListPanel] = useState(false);
    
    // Android 音乐库面板显示状态
    const [showMSPanel, setShowMSPanel] = useState(false);
        
    // === 从 Store 获取的值（兼容旧代码）===
    const isFullscreen = navigation.isFullscreen;
    const setIsFullscreen = navigation.setIsFullscreen;
    const playerFontSize = playerSettings.fontSize;
    const setPlayerFontSize = playerSettings.setFontSize;
    const playerSubLyricOpacity = playerSettings.subOpacity;
    const playerBgColor = playerSettings.bgColor;
    const setPlayerBgColor = playerSettings.setBgColor;
    const playerLyricColor = playerSettings.lyricColor;
    const setPlayerLyricColor = playerSettings.setLyricColor;
    
    // 文字设置面板本地状态
    const [showPlayerSettings, setShowPlayerSettings] = useState(false);
    const [isPlayerSettingsHiding, setIsPlayerSettingsHiding] = useState(false);
    const playerSettingsMenuRef = useRef<HTMLDivElement>(null);
    const closePlayerSettingsMenu = useCallback(() => {
        setIsPlayerSettingsHiding(true);
        setTimeout(() => {
            setShowPlayerSettings(false);
            setIsPlayerSettingsHiding(false);
        }, 300);
    }, []);
    const togglePlayerSettingsMenu = useCallback(() => {
        if (showPlayerSettings && !isPlayerSettingsHiding) {
            closePlayerSettingsMenu();
        } else {
            setShowPlayerSettings(true);
            setIsPlayerSettingsHiding(false);
        }
    }, [showPlayerSettings, isPlayerSettingsHiding, closePlayerSettingsMenu]);
    
    // 兼容旧的事件系统
    const setPlayerSubLyricOpacity = (updater: ((prev: number) => number) | number) => {
        if (typeof updater === 'function') {
            const newValue = updater(playerSettings.subOpacity);
            playerSettings.setSubOpacity(newValue);
        } else {
            playerSettings.setSubOpacity(updater);
        }
    };
    // ST 菜单相关（保留本地 state）
    const [showStKeyMenu, setShowStKeyMenu] = useState(false);
    const [isStKeyHiding, setIsStKeyHiding] = useState(false);
    const stKeyMenuRef = useRef<HTMLDivElement>(null);
    const closeStKeyMenu = useCallback(() => {
        setIsStKeyHiding(true);
        setTimeout(() => {
            setShowStKeyMenu(false);
            setIsStKeyHiding(false);
        }, 300);
    }, []);
    // ========================================
    
    // 调性检测结果
    const [detectedKey, setDetectedKey] = useState<string>('');
    const [isDetectingKey, setIsDetectingKey] = useState(false);
    const [showKeyDetectionMenu, setShowKeyDetectionMenu] = useState(false);
    const [isKeyDetectionHiding, setIsKeyDetectionHiding] = useState(false);
    const keyDetectionMenuRef = useRef<HTMLDivElement>(null);
    const closeKeyDetectionMenuLocal = useCallback(() => {
        setIsKeyDetectionHiding(true);
        setTimeout(() => {
            setShowKeyDetectionMenu(false);
            setIsKeyDetectionHiding(false);
        }, 300);
    }, []);
    
    // ST (SoundTouch) 调性检测结果
    const [stDetectedKey, setStDetectedKey] = useState<string>('');
    const [isStDetectingKey, setIsStDetectingKey] = useState(false);
    // showStKeyMenu 已在兼容层中定义
    
    // ST 音高调节状态（半音数）
    const [stPitchSemitones, setStPitchSemitones] = useState(0);
    
    // ST 速度调节状态
    const [stPlaybackSpeed, setStPlaybackSpeed] = useState(1.0);
    
    // 根据检测到的调和半音偏移计算当前调
    const getStCurrentKey = (): string => {
        
        if (!stDetectedKey) {
            // 如果没有检测到调，显示半音数
            const result = stPitchSemitones === 0 ? '原调' : (stPitchSemitones > 0 ? `+${stPitchSemitones}` : stPitchSemitones.toString());
            return result;
        }
        
        // 提取基础调（如 "C" from "C Major"）
        const baseKey = stDetectedKey.split(' ')[0];
        
        // 定义所有调的顺序（包括升降号）
        const keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        
        // 找到基础调的索引
        const baseIndex = keys.indexOf(baseKey);
        if (baseIndex === -1) {
            // 如果找不到，返回原始格式
            const result = `${baseKey}${stPitchSemitones > 0 ? '+' : ''}${stPitchSemitones}`;
            return result;
        }
        
        // 计算新的调索引（处理循环）
        const newIndex = (baseIndex + stPitchSemitones + 12) % 12;
        const result = keys[newIndex];
        
        return result;
    };
    
    // 音高调节状态（半音数）
    const [_pitchSemitones, _setPitchSemitones] = useState(0);
    
    // 速度调节状态
    const [_playbackRate, _setPlaybackRate] = useState(1.0);

    // 切换全屏 - 兼容 iOS
    const toggleFullscreen = async () => {
        try {
            const element = document.documentElement;
            
            // 检测是否为 iOS 设备
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
            
            // 检查是否已经在全屏模式
            const isCurrentlyFullscreen = !!(document.fullscreenElement || 
                                            (document as any).webkitFullscreenElement ||
                                            (document as any).msFullscreenElement);
            
            if (!isCurrentlyFullscreen) {
                // iOS 设备特殊处理
                if (isIOS) {
                    // 尝试标准 API (iOS 16.4+)
                    if (element.requestFullscreen) {
                        try {
                            await element.requestFullscreen();
                            return;
                        } catch {
                        }
                    }
                    
                    // iOS 不支持，提示用户
                    alert('iOS 浏览器限制：\n\n要获得最佳全屏体验，请：\n1. 点击分享按钮 📤\n2. 选择“添加到主屏幕”\n3. 从主屏幕打开应用');
                    return;
                }
                
                // 非 iOS 设备
                if (element.requestFullscreen) {
                    await element.requestFullscreen();
                } else if ((element as any).webkitRequestFullscreen) {
                    await (element as any).webkitRequestFullscreen();
                } else if ((element as any).msRequestFullscreen) {
                    await (element as any).msRequestFullscreen();
                }
            } else {
                // 退出全屏
                if (document.exitFullscreen) {
                    await document.exitFullscreen();
                } else if ((document as any).webkitExitFullscreen) {
                    await (document as any).webkitExitFullscreen();
                } else if ((document as any).msExitFullscreen) {
                    await (document as any).msExitFullscreen();
                }
            }
        } catch (error) {
            // 全屏切换失败处理
        }
    };

    // 监听全屏状态变化 - 兼容 iOS
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!(document.fullscreenElement || 
                              (document as any).webkitFullscreenElement ||
                              (document as any).msFullscreenElement));
        };
        
        // 监听多种全屏事件
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.addEventListener('msfullscreenchange', handleFullscreenChange);
        
        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
            document.removeEventListener('msfullscreenchange', handleFullscreenChange);
        };
    }, []);
    
    // 注意：closePlayerSettingsMenu, closeKeyDetectionMenu, togglePlayerSettingsMenu
    // 已从 useNavigation Store 中获取
    
    // 监听打开设置菜单事件
    useEffect(() => {
        const handleToggleSettings = () => {
            togglePlayerSettingsMenu();
        };
        
        window.addEventListener('toggle-player-settings' as any, handleToggleSettings as any);
        return () => window.removeEventListener('toggle-player-settings' as any, handleToggleSettings as any);
    }, [togglePlayerSettingsMenu]);
    
    // 注意：字体大小、背景颜色、歌词颜色、副行透明度的变化
    // 已由 usePlayerSettings Store 自动处理，无需手动监听事件
    
    // 监听调性检测完成事件
    useEffect(() => {
        const handleKeyDetected = (event: CustomEvent<{ fullKey: string; isDetecting: boolean }>) => {
            if (event.detail) {
                setDetectedKey(event.detail.fullKey || '');
                setIsDetectingKey(event.detail.isDetecting || false);
            }
        };
        
        window.addEventListener('key-detection-update' as any, handleKeyDetected as any);
        return () => window.removeEventListener('key-detection-update' as any, handleKeyDetected as any);
    }, []);
    
    // ✅ 已移除点击外部关闭功能
    
    // ✅ 点击外部区域关闭调性检测菜单（带动画）
    useEffect(() => {
        if (!showKeyDetectionMenu || isKeyDetectionHiding) {
            return;
        }
        
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            
            if (keyDetectionMenuRef.current && !keyDetectionMenuRef.current.contains(target)) {
                closeKeyDetectionMenuLocal();
            }
        };
        
        document.addEventListener('mousedown', handleClickOutside);
        
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showKeyDetectionMenu, isKeyDetectionHiding, closeKeyDetectionMenuLocal]);
    
    // 注意：closeStKeyMenu 已在兼容层中定义
    
    // ✅ 已移除点击外部关闭功能
    
    // ✅ 点击外部区域关闭 ST 歌曲调整菜单（带动画）
    useEffect(() => {
        if (!showStKeyMenu || isStKeyHiding) return;
        
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            if (stKeyMenuRef.current && !stKeyMenuRef.current.contains(target)) {
                closeStKeyMenu();
            }
        };
        
        document.addEventListener('mousedown', handleClickOutside);
        
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showStKeyMenu, isStKeyHiding, closeStKeyMenu]);
    
    // 监听 ST歌曲调整菜单切换事件（从 player-soundtouch.tsx）
    useEffect(() => {
        const handleToggleStKeyMenu = () => {
            setShowStKeyMenu(prev => !prev);
        };
        
        window.addEventListener('toggle-st-key-menu' as any, handleToggleStKeyMenu as any);
        return () => window.removeEventListener('toggle-st-key-menu' as any, handleToggleStKeyMenu as any);
    }, []);
    
    // 监听 ST调性检测状态更新
    useEffect(() => {
        const handleStKeyDetectionStart = () => {
            setIsStDetectingKey(true);
        };
        
        const handleStKeyDetectionResult = (event: CustomEvent<string>) => {
            setStDetectedKey(event.detail);
            setIsStDetectingKey(false);
        };
        
        window.addEventListener('st-key-detection-start' as any, handleStKeyDetectionStart as any);
        window.addEventListener('st-key-detection-result' as any, handleStKeyDetectionResult as any);
        return () => {
            window.removeEventListener('st-key-detection-start' as any, handleStKeyDetectionStart as any);
            window.removeEventListener('st-key-detection-result' as any, handleStKeyDetectionResult as any);
        };
    }, []);
    
    // ✅ 监听普通调性检测事件（player 页面）并同步到 ST 状态
    useEffect(() => {
        const handleKeyDetectionUpdate = (event: CustomEvent<{ fullKey: string; isDetecting: boolean }>) => {
            const { fullKey, isDetecting } = event.detail;
            
            if (isDetecting) {
                setIsStDetectingKey(true);
            } else {
                setIsStDetectingKey(false);
                // ✅ 无论是否有值，都更新（包括清空）
                setStDetectedKey(fullKey || '');
            }
        };
        
        window.addEventListener('key-detection-update' as any, handleKeyDetectionUpdate as any);
        return () => window.removeEventListener('key-detection-update' as any, handleKeyDetectionUpdate as any);
    }, []);
    
    // 监听 ST音高调节状态更新
    useEffect(() => {
        const handleStPitchChange = (event: CustomEvent<number>) => {
            setStPitchSemitones(event.detail);
        };
        
        window.addEventListener('st-pitch-change' as any, handleStPitchChange as any);
        return () => window.removeEventListener('st-pitch-change' as any, handleStPitchChange as any);
    }, []);
    
    // 监听 ST速度调节状态更新
    useEffect(() => {
        const handleStSpeedChange = (event: CustomEvent<number>) => {
            setStPlaybackSpeed(event.detail);
        };
        
        window.addEventListener('st-speed-change' as any, handleStSpeedChange as any);
        return () => window.removeEventListener('st-speed-change' as any, handleStSpeedChange as any);
    }, []);
    
    // ✅ Android 模式下处理音高调节、速度调节、去人声事件
    useEffect(() => {
        const isAndroid = isAndroidNative();
        
        if (!isAndroid) {
            return; // Web 模式不需要
        }
        
        
        // 导入 ExoPlayer 控制函数
        import('../utils/playback-control.js').then(({ setExoPlayerPitch, setExoPlayerSpeed }) => {
            // 音高调节（半音）
            const handleAdjustPitch = async (event: CustomEvent<number>) => {
                const semitones = event.detail;
                
                // ✅ 使用函数式更新，避免闭包问题
                setStPitchSemitones(prevSemitones => {
                    const newSemitones = prevSemitones + semitones;
                    
                    // 限制范围 -12 到 +12
                    const clampedSemitones = Math.max(-12, Math.min(12, newSemitones));
                    
                    // 计算 pitch 值（每个半音约 1.05946 倍）
                    const pitch = Math.pow(1.05946, clampedSemitones);
                    
                    // 异步调用 ExoPlayer
                    setExoPlayerPitch(pitch).catch(console.error);
                    
                    // 通知 UI 更新
                    window.dispatchEvent(new CustomEvent('st-pitch-change', { detail: clampedSemitones }));
                    
                    return clampedSemitones;
                });
            };
            
            // 重置音高
            const handleResetPitch = async () => {
                setStPitchSemitones(0);
                await setExoPlayerPitch(1.0);
                window.dispatchEvent(new CustomEvent('st-pitch-change', { detail: 0 }));
            };
            
            // 速度调节
            const handleAdjustSpeed = async (event: CustomEvent<number>) => {
                const delta = event.detail;
                
                // ✅ 使用函数式更新，避免闭包问题，直接基于当前 state 计算
                setStPlaybackSpeed(prevSpeed => {
                    
                    const newSpeed = Math.max(0.5, Math.min(2.0, prevSpeed + delta));
                    
                    // 异步调用 ExoPlayer
                    setExoPlayerSpeed(newSpeed).then(() => {
                    }).catch(err => {
                    });
                    
                    // 通知 UI 更新
                    window.dispatchEvent(new CustomEvent('st-speed-change', { detail: newSpeed }));
                    
                    return newSpeed;
                });
            };
            
            // 重置速度
            const handleResetSpeed = async () => {
                setStPlaybackSpeed(1.0);
                await setExoPlayerSpeed(1.0);
                window.dispatchEvent(new CustomEvent('st-speed-change', { detail: 1.0 }));
            };
            
            // ✅ 直接设置速度（用于滑动条）
            const handleSetSpeed = async (event: CustomEvent<number>) => {
                const newSpeed = event.detail;
                setStPlaybackSpeed(newSpeed);
                await setExoPlayerSpeed(newSpeed);
                window.dispatchEvent(new CustomEvent('st-speed-change', { detail: newSpeed }));
            };
            
            // 注册事件监听器
            window.addEventListener('st-adjust-pitch' as any, handleAdjustPitch as any);
            window.addEventListener('st-reset-pitch' as any, handleResetPitch as any);
            window.addEventListener('st-adjust-speed' as any, handleAdjustSpeed as any);
            window.addEventListener('st-reset-speed' as any, handleResetSpeed as any);
            window.addEventListener('st-adjust-speed-to' as any, handleSetSpeed as any);
            
            return () => {
                window.removeEventListener('st-adjust-pitch' as any, handleAdjustPitch as any);
                window.removeEventListener('st-reset-pitch' as any, handleResetPitch as any);
                window.removeEventListener('st-adjust-speed' as any, handleAdjustSpeed as any);
                window.removeEventListener('st-reset-speed' as any, handleResetSpeed as any);
                window.removeEventListener('st-adjust-speed-to' as any, handleSetSpeed as any);
            };
        });
    }, []);  // ✅ 空依赖数组，只注册一次
    
    // ✅ 已移除点击外部关闭功能
    
    // ✅ 点击外部区域关闭文字设定菜单（带动画）
    useEffect(() => {
        if (!showPlayerSettings || isPlayerSettingsHiding) {
            return;
        }
        
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            
            if (playerSettingsMenuRef.current && !playerSettingsMenuRef.current.contains(target)) {
                closePlayerSettingsMenu();
            }
        };
        
        document.addEventListener('mousedown', handleClickOutside);
        
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showPlayerSettings, isPlayerSettingsHiding, closePlayerSettingsMenu]);

    // 点击其他区域时关闭 Editor 菜单
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (showEditorMenu) {
                const target = event.target as HTMLElement;
                if (!target.closest('.header-editor-menu')) {
                    setShowEditorMenu(false);
                }
            }
        };
        
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showEditorMenu]);
    
    // 切换文件列下面板
    const toggleFileListPanel = useCallback(() => {
        setShowFileListPanel(prev => {
            const newState = !prev;
            // 通知 Content 组件面板显示状态
            window.dispatchEvent(new CustomEvent('file-list-panel-toggle', {
                detail: { show: newState }
            }));
            return newState;
        });
    }, []);
        
    // 处理 Android 音乐库选中曲目的播放
    // ✅ Android 音乐库播放处理（不再使用，MSFileListPanel 直接发送事件）
    const handlePlayMSTrack = useCallback((_trackIndex: number) => {
        // MSFileListPanel 现在直接发送 'play-ms-playlist' 事件
        // 这个函数保留仅为接口兼容
    }, []);
    
    // 处理打开文件
    const handleOpenFile = useCallback(() => {
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = true; // 允许多选
        // 不设置 accept 属性，允许选择所有文件类型（Android Chrome 兼容）
        input.onchange = (e) => {
            const files = (e.target as HTMLInputElement).files;
            if (files && files.length > 0) {
                // 提取所有文件名
                const fileNames = Array.from(files).map(f => f.name);
                
                // 触发事件通知 Content 组件
                window.dispatchEvent(new CustomEvent('files-selected', {
                    detail: { fileNames }
                }));
                
                // 通知 Footer 组件添加文件到播放列表
                const audioFiles = Array.from(files).filter(file => 
                    file.type.startsWith('audio/') || 
                    ['.ncm', '.qmcflac', '.qmc0', '.qmc1', '.qmc2', '.qmc3', '.qmcogg'].some(ext => file.name.toLowerCase().endsWith(ext))
                );
                
                const lrcFiles = Array.from(files).filter(file => file.name.toLowerCase().endsWith('.lrc'));
                
                // 为每个音频文件查找匹配的 LRC 文件
                const tracks = audioFiles.map(file => {
                    const baseName = file.name.substring(0, file.name.lastIndexOf('.'));
                    let matchedLrc: File | undefined;
                    
                    for (const lrcFile of lrcFiles) {
                        const lrcBaseName = lrcFile.name.substring(0, lrcFile.name.lastIndexOf('.'));
                        if (lrcBaseName === baseName) {
                            matchedLrc = lrcFile;
                            break;
                        }
                    }
                    
                    return { file, lrcFile: matchedLrc };
                });
                
                // 发送事件通知 Footer 添加这些文件到播放列表
                if (tracks.length > 0) {
                    window.dispatchEvent(new CustomEvent('add-files-to-playlist', {
                        detail: { tracks }
                    }));
                }
            }
        };
        input.click();
    }, []);

    return (
        <>
            {/* 左上角按钮 - 根据页面显示不同按钮 */}
            {location.hash.includes('/player-soundtouch/') ? (
                // player-soundtouch 页面：显示打开文件按钮，触发 player-soundtouch 的文件选择
                <div className="header-left-controls">
                    <button 
                        className="header-control-button file-list-btn"
                        onClick={() => {
                            // 触发 player-soundtouch 页面的文件选择
                            window.dispatchEvent(new CustomEvent('trigger-st-file-open'));
                        }}
                        title="打开文件"
                    >
                        <PlaylistSVG />
                    </button>
                </div>
            ) : (
                // 其他页面：根据平台显示不同按钮
                <div className="header-left-controls">
                    {isAndroidNative() ? (
                        // Android: 打开音乐库
                        <button 
                            className="header-control-button file-list-btn"
                            onClick={() => {
                                setShowMSPanel(true);
                            }}
                            title="打开音乐库"
                        >
                            <PlaylistSVG />
                        </button>
                    ) : (
                        // Web: 打开文件列表
                        <button 
                            className="header-control-button file-list-btn"
                            onClick={toggleFileListPanel}
                            title="文件列表"
                        >
                            <PlaylistSVG />
                        </button>
                    )}
                </div>
            )}
            
            {/* Preferences 页面标题 */}
            {isPreferencesPage && (
                <div className="header-page-title">
                    <h1>{lang.app.fullname}</h1>
                </div>
            )}
            
            {/* 右上角控制按钮区域 */}
            <div className="header-controls-wrapper">
                {/* Editor 按钮 - 在 Preferences、Lrc-utils、Synchronizer、Tune 和 Player-SoundTouch 页面不显示在第一位 */}
                {!isPreferencesPage && !isLrcUtilsPage && !isSynchronizerPage && !isTunePage && !isPlayerSoundTouchPage && (
                    <a 
                        className="header-control-button"
                        href={prependHash(ROUTER.editor)}
                        title={lang.header.editor}
                    >
                        <EditorSVG />
                    </a>
                )}
                
                {/* Tune 按钮 - 在 Player、Preferences、Lrc-utils、Synchronizer、Tune 和 Player-SoundTouch 页面隐藏 */}
                {!isPlayerPage && !isPreferencesPage && !isLrcUtilsPage && !isSynchronizerPage && !isTunePage && !isPlayerSoundTouchPage && (
                    <a 
                        className="header-control-button"
                        href={prependHash(ROUTER.tune)}
                        title={lang.header.tune}
                    >
                        <TuneSVG />
                    </a>
                )}
                
                {/* Synchronizer 按钮 - 在 Player、Preferences、Lrc-utils、Synchronizer、Tune 和 Player-SoundTouch 页面隐藏 */}
                {!isPlayerPage && !isPreferencesPage && !isLrcUtilsPage && !isSynchronizerPage && !isTunePage && !isPlayerSoundTouchPage && (
                    <a 
                        className="header-control-button"
                        href={prependHash(ROUTER.synchronizer)}
                        title={lang.header.synchronizer}
                    >
                        <SynchronizerSVG />
                    </a>
                )}
                
                {/* Editor 按钮在 Preferences、Lrc-utils、Synchronizer 和 Tune 页面移动到中间位置（不包括 Player-SoundTouch） */}
                {(isPreferencesPage || isLrcUtilsPage || isSynchronizerPage || isTunePage) && (
                    <a 
                        className="header-control-button"
                        href={prependHash(ROUTER.editor)}
                        title={lang.header.editor}
                    >
                        <EditorSVG />
                    </a>
                )}
                
                {/* Player 和全屏按钮组 - 右边垂直排列 */}
                <div className="header-player-group">
                    {/* Player 按钮 */}
                    <a 
                        className="header-control-button player-btn"
                        href={prependHash(ROUTER.player)}
                        title={lang.header.player}
                    >
                        <PlaySVG />
                    </a>
                    
                    {/* 全屏按钮 - 在 Player 和 Player-SoundTouch 页面显示 */}
                    {(isPlayerPage || location.hash.includes(ROUTER.playerSoundTouchJS)) && (
                        <button 
                            className="header-control-button fullscreen-btn"
                            onClick={toggleFullscreen}
                            title={isFullscreen ? lang.header.exitFullscreen : lang.header.fullscreen}
                        >
                            {isFullscreen ? <FullscreenExitSVG /> : <FullscreenSVG />}
                        </button>
                    )}
                    
                    {/* Player 页面的字体设置按钮 - 在 Player 和 Player-SoundTouch 页面显示 */}
                    {/* 文字设定按钮 */}
                    {(isPlayerPage || location.hash.includes(ROUTER.playerSoundTouchJS)) && (
                        <div style={{ position: 'relative' }}>
                            <button 
                                className="player-control-button"
                                onClick={() => {
                                    // 触发 Player 页面的设置菜单（切换显示/隐藏）
                                    togglePlayerSettingsMenu();
                                }}
                                title={lang.header.fontSettings}
                            >
                                <SettingsTSVG />
                            </button>
                            {showPlayerSettings && (
                                <div ref={playerSettingsMenuRef}>
                                    <PlayerSettingsPanel 
                                        onClose={closePlayerSettingsMenu}
                                        isHiding={isPlayerSettingsHiding}
                                        lang={lang}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                    
                    {/* ST歌曲调整按钮 - 仅在 Player-SoundTouch 页面显示 */}
                    {isPlayerSoundTouchPage && (
                        <div style={{ position: 'relative' }}>
                            <button 
                                className="player-control-button key-detection-btn"
                                onClick={() => {
                                    // 触发 player-soundtouch 页面的 ST歌曲调整菜单
                                    window.dispatchEvent(new CustomEvent('toggle-st-key-menu'));
                                }}
                                title="ST歌曲调整"
                            >
                                <MusicKeySVG />
                            </button>
                            
                            {/* ST歌曲调整菜单 - 渲染在 Header 中，相对于按钮定位 */}
                            {showStKeyMenu && (
                                <div className={`key-detection-menu${isStKeyHiding ? ' menu-hiding' : ''}`} ref={stKeyMenuRef}>
                                    {/* 调性检测 */}
                                    <div className="player-settings-group">
                                        <div className="player-settings-label">ST歌曲调整</div>
                                        
                                        {isStDetectingKey ? (
                                            <div className="key-detecting">
                                                <div className="detecting-spinner"></div>
                                                <p>检测中...</p>
                                            </div>
                                        ) : stDetectedKey ? (
                                            <div className="key-result">
                                                <div className="key-display">
                                                    <span className="key-name">{stDetectedKey}</span>
                                                </div>
                                                <button 
                                                    className="re-detect-btn"
                                                    onClick={() => {
                                                        window.dispatchEvent(new CustomEvent('trigger-st-key-detection'));
                                                    }}
                                                >
                                                    重新检测
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="no-key-detected">
                                                <button 
                                                    className="start-detect-btn"
                                                    onClick={() => {
                                                        window.dispatchEvent(new CustomEvent('trigger-st-key-detection'));
                                                    }}
                                                >
                                                    调性检测
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* 音高调节 */}
                                    <div className="player-settings-group">
                                        <div className="player-settings-label">音高调节</div>
                                        <div className="player-settings-options">
                                            <button 
                                                className="player-setting-btn"
                                                onClick={() => window.dispatchEvent(new CustomEvent('st-adjust-pitch', { detail: -1 }))}
                                                title="降低一个半音"
                                            >
                                                -
                                            </button>
                                            <button 
                                                className="player-setting-btn"
                                                onClick={() => window.dispatchEvent(new CustomEvent('st-reset-pitch'))}
                                                title="重置为原调"
                                                style={{ minWidth: '50px' }}
                                            >
                                                {getStCurrentKey()}
                                            </button>
                                            <button 
                                                className="player-setting-btn"
                                                onClick={() => window.dispatchEvent(new CustomEvent('st-adjust-pitch', { detail: 1 }))}
                                                title="升高一个半音"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>
                                    
                                    {/* 速度调节 */}
                                    <div className="player-settings-group">
                                        <div className="player-settings-label">速度调节</div>
                                        <div className="player-settings-options">
                                            <button 
                                                className="player-setting-btn"
                                                onClick={() => window.dispatchEvent(new CustomEvent('st-adjust-speed', { detail: -0.05 }))}
                                                title="减慢速度 0.05x"
                                            >
                                                -
                                            </button>
                                            <button 
                                                className="player-setting-btn"
                                                onClick={() => window.dispatchEvent(new CustomEvent('st-reset-speed'))}
                                                title="重置为正常速度"
                                                style={{ minWidth: '60px' }}
                                            >
                                                {stPlaybackSpeed.toFixed(2)}x
                                            </button>
                                            <button 
                                                className="player-setting-btn"
                                                onClick={() => window.dispatchEvent(new CustomEvent('st-adjust-speed', { detail: 0.05 }))}
                                                title="加快速度 0.05x"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>
                                    
                                    {/* ✅ 去人声（伴奏模式）- 已禁用 */}
                                    {/* <div className="player-settings-group">
                                        <div className="player-settings-label">去人声（伴奏模式）</div>
                                        <div className="player-settings-options">
                                            <label className="toggle-switch" title="使用相位抵消法去除居中人声，仅播放伴奏">
                                                <input 
                                                    type="checkbox" 
                                                    checked={stVocalRemoval}
                                                    onChange={() => window.dispatchEvent(new CustomEvent('st-toggle-vocal-removal'))}
                                                />
                                                <span className="toggle-switch-label"></span>
                                            </label>
                                        </div>
                                    </div> */}
                                </div>
                            )}
                        </div>
                    )}
                    
                    {/* 歌曲调整按钮 - 在 Player 和 Synchronizer 页面显示 */}
                    {(isPlayerPage || isSynchronizerPage) && (
                        <div style={{ position: 'relative' }}>
                            <button 
                                className="player-control-button key-detection-btn"
                                onClick={() => {
                                    setShowKeyDetectionMenu(!showKeyDetectionMenu);
                                }}
                                title={lang.header.keyDetection || '调性识别'}
                            >
                                <MusicKeySVG />
                                {detectedKey && <span className="key-badge">{detectedKey.split(' ')[0]}</span>}
                            </button>
                            
                            {/* 歌曲调整菜单 */}
                            {showKeyDetectionMenu && (
                                <div className={`key-detection-menu${isKeyDetectionHiding ? ' menu-hiding' : ''}`} ref={keyDetectionMenuRef}>
                                    {/* 调性检测 */}
                                    <div className="player-settings-group">
                                        <div className="player-settings-label">{lang.header.keyDetection || '调性识别'}</div>
                                        
                                        {isDetectingKey ? (
                                            <div className="key-detecting">
                                                <div className="detecting-spinner"></div>
                                                <p>{lang.header.detectingKey || '检测中...'}</p>
                                            </div>
                                        ) : detectedKey ? (
                                            <div className="key-result">
                                                <div className="key-display">
                                                    <span className="key-name">{detectedKey}</span>
                                                </div>
                                                <button 
                                                    className="re-detect-btn"
                                                    onClick={() => {
                                                        window.dispatchEvent(new CustomEvent('trigger-key-detection'));
                                                    }}
                                                >
                                                    {lang.header.reDetect || '重新检测'}
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="no-key-detected">
                                                <button 
                                                    className="start-detect-btn"
                                                    onClick={() => {
                                                        window.dispatchEvent(new CustomEvent('trigger-key-detection'));
                                                    }}
                                                >
                                                    {lang.header.keyDetection || '调性检测'}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* ✅ Android 模式下显示音高调节、速度调节、去人声 */}
                                    {isAndroidNative() && (
                                        <>
                                            {/* 音高调节 */}
                                            <div className="player-settings-group">
                                                <div className="player-settings-label">音高调节</div>
                                                <div className="player-settings-options">
                                                    <button 
                                                        className="player-setting-btn"
                                                        onClick={() => window.dispatchEvent(new CustomEvent('st-adjust-pitch', { detail: -1 }))}
                                                        title="降低一个半音"
                                                    >
                                                        -
                                                    </button>
                                                    <button 
                                                        className="player-setting-btn"
                                                        onClick={() => window.dispatchEvent(new CustomEvent('st-reset-pitch'))}
                                                        title="重置为原调"
                                                        style={{ minWidth: '50px' }}
                                                    >
                                                        {getStCurrentKey()}
                                                    </button>
                                                    <button 
                                                        className="player-setting-btn"
                                                        onClick={() => window.dispatchEvent(new CustomEvent('st-adjust-pitch', { detail: 1 }))}
                                                        title="升高一个半音"
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                            </div>
                                            
                                            {/* 速度调节 */}
                                            <div className="player-settings-group">
                                                <div className="player-settings-label">速度调节</div>
                                                <div className="player-settings-options">
                                                    <button 
                                                        className="player-setting-btn"
                                                        onClick={() => {
                                                            window.dispatchEvent(new CustomEvent('st-adjust-speed', { detail: -0.05 }));
                                                        }}
                                                        title="降低速度 0.05x"
                                                        disabled={stPlaybackSpeed <= 0.5}
                                                    >
                                                        -
                                                    </button>
                                                    <button 
                                                        className="player-setting-btn"
                                                        onClick={() => {
                                                            window.dispatchEvent(new CustomEvent('st-reset-speed'));
                                                        }}
                                                        title="重置为正常速度"
                                                        style={{ minWidth: '60px' }}
                                                    >
                                                        {stPlaybackSpeed.toFixed(2)}x
                                                    </button>
                                                    <button 
                                                        className="player-setting-btn"
                                                        onClick={() => {
                                                            window.dispatchEvent(new CustomEvent('st-adjust-speed', { detail: 0.05 }));
                                                        }}
                                                        title="升高速度 0.05x"
                                                        disabled={stPlaybackSpeed >= 2.0}
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                                {/* 速度滑动条 */}
                                                <div className="speed-control-slider" style={{ marginTop: '8px' }}>
                                                    <input
                                                        type="range"
                                                        min="-0.693"
                                                        max="0.693"
                                                        step="any"
                                                        value={Math.log(stPlaybackSpeed)}
                                                        onChange={(e) => {
                                                            const logValue = parseFloat(e.target.value);
                                                            const newSpeed = Math.exp(logValue);
                                                            const clampedSpeed = Math.max(0.5, Math.min(2.0, newSpeed));
                                                            window.dispatchEvent(new CustomEvent('st-adjust-speed-to', { detail: clampedSpeed }));
                                                        }}
                                                        title={`当前速度: ${stPlaybackSpeed.toFixed(2)}x`}
                                                    />
                                                </div>
                                            </div>
                                            
                                            {/* ✅ 去人声（伴奏模式）- 已禁用 */}
                                            {/* <div className="player-settings-group">
                                                <div className="player-settings-label">去人声（伴奏模式）</div>
                                                <div className="player-settings-options">
                                                    <label className="toggle-switch" title="使用相位抵消法去除居中人声，仅播放伴奏">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={stVocalRemoval}
                                                            onChange={() => window.dispatchEvent(new CustomEvent('st-toggle-vocal-removal'))}
                                                        />
                                                        <span className="toggle-switch-label"></span>
                                                    </label>
                                                </div>
                                            </div> */}
                                        </>
                                    )}

                                </div>
                            )}
                        </div>
                    )}
                    
                    {/* ✅ ST 按钮 - 只在 Web 环境的 player 页面显示 */}
                    {isPlayerPage && !isAndroidNative() && (
                        <button 
                            className="header-control-button player-soundtouch-btn"
                            onClick={() => {
                                // 强制刷新页面以清除 player 页面的状态
                                window.location.hash = ROUTER.playerSoundTouchJS;
                                // 使用 reload 确保完全刷新
                                setTimeout(() => {
                                    window.location.reload();
                                }, 50);
                            }}
                            title="高级播放器（支持音高调节）"
                            style={{ fontSize: '0.7rem', fontWeight: 'bold', background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                            ST
                        </button>
                    )}
                </div>
            </div>
            
            {/* Android 特定的播放列表面板 */}
            {showMSPanel && (
                <MSFileListPanel
                    onPlayTrack={handlePlayMSTrack}
                    onClose={() => {
                        setShowMSPanel(false);
                    }}
                    lang={lang} // ✅ 传递多语言配置
                />
            )}
        </>
    );
};
