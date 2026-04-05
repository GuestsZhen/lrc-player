import ROUTER from "#const/router.json" assert { type: "json" };
import { useContext, useEffect, useState, useCallback } from "react";
import { prependHash } from "../utils/router.js";
import { appContext } from "./app.context.js";
import { PlaySVG, EditorSVG, FullscreenSVG, FullscreenExitSVG, TuneSVG, SynchronizerSVG, SettingsTSVG, PlaylistSVG } from "./svg.js";

export const Header: React.FC = () => {
    const { lang } = useContext(appContext);
    
    // 音频文件路径状态
    const [audioFileName, setAudioFileName] = useState<string>('');
    const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
    
    // 判断当前是否在 Player 页面
    const [isPlayerPage, setIsPlayerPage] = useState(() => {
        return location.hash.includes(ROUTER.player);
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
            setIsPlayerPage(location.hash.includes(ROUTER.player));
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
    
    // 全屏状态
    const [isFullscreen, setIsFullscreen] = useState(false);
    
    // Player 设置菜单状态
    const [showPlayerSettings, setShowPlayerSettings] = useState(false);
    const [isHiding, setIsHiding] = useState(false);
    
    // 文件列表面板显示状态
    const [showFileListPanel, setShowFileListPanel] = useState(false);
    
    // Player 字体大小
    const [playerFontSize, setPlayerFontSize] = useState(() => {
        return Number(sessionStorage.getItem("player-font-size")) || 1.3;
    });
    
    // Player 副行透明度
    const [playerSubLyricOpacity, setPlayerSubLyricOpacity] = useState(() => {
        return Number(sessionStorage.getItem('player-sub-opacity')) || 0.3;
    });

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
                    console.log('iOS device detected in Header');
                    
                    // 尝试标准 API (iOS 16.4+)
                    if (element.requestFullscreen) {
                        try {
                            await element.requestFullscreen();
                            return;
                        } catch (e) {
                            console.log('Standard API failed on iOS');
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
            console.error('Fullscreen error:', error);
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
    
    // 关闭 Player 设置菜单（带动画）
    const closePlayerSettingsMenu = useCallback(() => {
        setIsHiding(true);
        setTimeout(() => {
            setShowPlayerSettings(false);
            setIsHiding(false);
        }, 300);
    }, []);
    
    // 切换 Player 设置菜单
    const togglePlayerSettingsMenu = useCallback(() => {
        if (showPlayerSettings && !isHiding) {
            closePlayerSettingsMenu();
        } else {
            setShowPlayerSettings(true);
            setIsHiding(false);
        }
    }, [showPlayerSettings, isHiding, closePlayerSettingsMenu]);
    
    // 监听打开设置菜单事件
    useEffect(() => {
        const handleToggleSettings = () => {
            togglePlayerSettingsMenu();
        };
        
        window.addEventListener('toggle-player-settings' as any, handleToggleSettings as any);
        return () => window.removeEventListener('toggle-player-settings' as any, handleToggleSettings as any);
    }, [togglePlayerSettingsMenu]);
    
    // 监听副行透明度变化事件（从 Player 组件）
    useEffect(() => {
        const handleOpacityChange = (event: CustomEvent<number>) => {
            const delta = event.detail;
            setPlayerSubLyricOpacity(prev => {
                const newValue = Math.min(Math.max(prev + delta, 0.1), 1.0);
                sessionStorage.setItem('player-sub-opacity', newValue.toString());
                return newValue;
            });
        };
        
        window.addEventListener('player-sub-opacity-change' as any, handleOpacityChange as any);
        return () => window.removeEventListener('player-sub-opacity-change' as any, handleOpacityChange as any);
    }, []);
    
    // 监听字体大小变化事件（从 Player 组件）
    useEffect(() => {
        const handleFontSizeChange = (event: CustomEvent<number>) => {
            const newSize = event.detail;
            setPlayerFontSize(newSize);
        };
        
        window.addEventListener('player-font-size-update' as any, handleFontSizeChange as any);
        return () => window.removeEventListener('player-font-size-update' as any, handleFontSizeChange as any);
    }, []);
    
    // 点击其他区域时关闭文字设定菜单（带动画）
    useEffect(() => {
        if (!showPlayerSettings || isHiding) return;
        
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Element;
            // 如果点击的不是菜单区域，关闭菜单
            if (!target.closest('.player-settings-menu')) {
                closePlayerSettingsMenu();
            }
        };
        
        document.addEventListener('mousedown', handleClickOutside);
        
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showPlayerSettings, isHiding]);

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
    
    // 切换文件列表面板
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
                
                // 更新状态
                setAudioFileName(files.length === 1 ? files[0].name : `${files.length} 个文件`);
                setSelectedFiles(fileNames);
                
                // 触发事件通知 Content 组件
                window.dispatchEvent(new CustomEvent('files-selected', {
                    detail: { fileNames }
                }));
                
                // 注意：不再触发 header-file-open 事件，只记录文件路径，不自动载入
            }
        };
        input.click();
    }, []);
    
    // 监听来自其他组件的文件路径更新
    useEffect(() => {
        const handleFileUpdate = (event: Event) => {
            const customEvent = event as CustomEvent<{ fileName: string }>;
            if (customEvent.detail?.fileName) {
                setAudioFileName(customEvent.detail.fileName);
            }
        };
        
        window.addEventListener('audio-file-update' as any, handleFileUpdate as any);
        return () => window.removeEventListener('audio-file-update' as any, handleFileUpdate as any);
    }, []);

    return (
        <>
            {/* 左上角打开文件按钮 */}
            <div className="header-left-controls">
                <button 
                    className="header-control-button file-list-btn"
                    onClick={toggleFileListPanel}
                    title="文件列表"
                >
                    <PlaylistSVG />
                </button>
            </div>
            
            {/* 音频文件路径显示 */}
            {audioFileName && (
                <div className="header-audio-file-name">
                    <span>{audioFileName}</span>
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
                {/* Editor 按钮 - 在 Preferences、Lrc-utils、Synchronizer 和 Tune 页面不显示在第一位 */}
                {!isPreferencesPage && !isLrcUtilsPage && !isSynchronizerPage && !isTunePage && (
                    <a 
                        className="header-control-button"
                        href={prependHash(ROUTER.editor)}
                        title={lang.header.editor}
                    >
                        <EditorSVG />
                    </a>
                )}
                
                {/* Tune 按钮 - 在 Player、Preferences、Lrc-utils、Synchronizer 和 Tune 页面隐藏 */}
                {!isPlayerPage && !isPreferencesPage && !isLrcUtilsPage && !isSynchronizerPage && !isTunePage && (
                    <a 
                        className="header-control-button"
                        href={prependHash(ROUTER.tune)}
                        title={lang.header.tune}
                    >
                        <TuneSVG />
                    </a>
                )}
                
                {/* Synchronizer 按钮 - 在 Player、Preferences、Lrc-utils、Synchronizer 和 Tune 页面隐藏 */}
                {!isPlayerPage && !isPreferencesPage && !isLrcUtilsPage && !isSynchronizerPage && !isTunePage && (
                    <a 
                        className="header-control-button"
                        href={prependHash(ROUTER.synchronizer)}
                        title={lang.header.synchronizer}
                    >
                        <SynchronizerSVG />
                    </a>
                )}
                
                {/* Editor 按钮在 Preferences、Lrc-utils、Synchronizer 和 Tune 页面移动到中间位置 */}
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
                    
                    {/* 全屏按钮 - 只在 Player 页面显示 */}
                    {isPlayerPage && (
                        <button 
                            className="header-control-button fullscreen-btn"
                            onClick={toggleFullscreen}
                            title={isFullscreen ? lang.header.exitFullscreen : lang.header.fullscreen}
                        >
                            {isFullscreen ? <FullscreenExitSVG /> : <FullscreenSVG />}
                        </button>
                    )}
                    
                    {/* Player 页面的字体设置按钮 - 只在 Player 页面显示 */}
                    {/* 文字设定按钮 */}
                    {isPlayerPage && (
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
                                <div className={`player-settings-menu${isHiding ? ' menu-hiding' : ''}`}>
                                    {/* 文字设定菜单 */}
                                    <div className="player-settings-group">
                                        <div className="player-settings-label">{lang.header.fontSize}</div>
                                        <div className="player-settings-options">
                                            <button 
                                                className="player-setting-btn"
                                                onClick={() => {
                                                    const newSize = Math.min(playerFontSize + 0.1, 2.5);
                                                    setPlayerFontSize(newSize);
                                                    window.dispatchEvent(new CustomEvent('player-font-size-update', { detail: newSize }));
                                                }}
                                                title={lang.header.increaseFont}
                                            >
                                                A+
                                            </button>
                                            <button 
                                                className="player-setting-btn"
                                                disabled
                                                title={lang.header.currentFontSize}
                                                style={{ minWidth: '60px', cursor: 'default' }}
                                            >
                                                {(playerFontSize * 10).toFixed(0)}
                                            </button>
                                            <button 
                                                className="player-setting-btn"
                                                onClick={() => {
                                                    const newSize = Math.max(playerFontSize - 0.1, 0.8);
                                                    setPlayerFontSize(newSize);
                                                    window.dispatchEvent(new CustomEvent('player-font-size-update', { detail: newSize }));
                                                }}
                                                title={lang.header.decreaseFont}
                                            >
                                                A-
                                            </button>
                                        </div>
                                    </div>
                                    <div className="player-settings-group">
                                        <div className="player-settings-label">{lang.header.textAlign}</div>
                                        <div className="player-settings-options">
                                            <button 
                                                className="player-setting-btn"
                                                onClick={() => window.dispatchEvent(new CustomEvent('player-text-align-change', { detail: 'left' }))}
                                                title={lang.header.alignLeft}
                                            >
                                                {lang.header.left}
                                            </button>
                                            <button 
                                                className="player-setting-btn"
                                                onClick={() => window.dispatchEvent(new CustomEvent('player-text-align-change', { detail: 'center' }))}
                                                title={lang.header.alignCenter}
                                            >
                                                {lang.header.center}
                                            </button>
                                            <button 
                                                className="player-setting-btn"
                                                onClick={() => window.dispatchEvent(new CustomEvent('player-text-align-change', { detail: 'right' }))}
                                                title={lang.header.alignRight}
                                            >
                                                {lang.header.right}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="player-settings-group">
                                        <div className="player-settings-label">{lang.header.bgColor}</div>
                                        <div className="player-settings-color-picker">
                                            <input
                                                type="color"
                                                value="#2e2e2e"
                                                onChange={(e) => window.dispatchEvent(new CustomEvent('player-bg-color-change', { detail: e.target.value }))}
                                                className="player-color-input"
                                                title={lang.header.selectBgColor}
                                            />
                                            <div className="player-color-preview" style={{ backgroundColor: '#2e2e2e' }}>
                                                #2e2e2e
                                            </div>
                                        </div>
                                    </div>
                                    <div className="player-settings-group">
                                        <div className="player-settings-label">{lang.header.lyricColor}</div>
                                        <div className="player-settings-color-picker">
                                            <input
                                                type="color"
                                                value="#ffffff"
                                                onChange={(e) => window.dispatchEvent(new CustomEvent('player-lyric-color-change', { detail: e.target.value }))}
                                                className="player-color-input"
                                                title={lang.header.selectLyricColor}
                                            />
                                            <div className="player-color-preview" style={{ backgroundColor: '#ffffff', color: '#000000' }}>
                                                #ffffff
                                            </div>
                                        </div>
                                    </div>
                                    <div className="player-settings-group">
                                        <div className="player-settings-label">{lang.header.subOpacity}</div>
                                        <div className="player-settings-options">
                                            <button 
                                                className="player-setting-btn"
                                                onClick={() => window.dispatchEvent(new CustomEvent('player-sub-opacity-change', { detail: -0.1 }))}
                                                title={lang.header.decreaseOpacity}
                                            >
                                                -
                                            </button>
                                            <button 
                                                className="player-setting-btn"
                                                disabled
                                                title={lang.header.currentOpacity}
                                                style={{ minWidth: '60px', cursor: 'default' }}
                                            >
                                                {Math.round(playerSubLyricOpacity * 100)}%
                                            </button>
                                            <button 
                                                className="player-setting-btn"
                                                onClick={() => window.dispatchEvent(new CustomEvent('player-sub-opacity-change', { detail: 0.1 }))}
                                                title={lang.header.increaseOpacity}
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};
