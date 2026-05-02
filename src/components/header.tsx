import ROUTER from "#const/router.json" assert { type: "json" };
import { useContext, useEffect, useState, useCallback, useRef } from "react";
import { prependHash } from "../utils/router.js";
import { appContext } from "./app.context.js";
import { usePlayerSettings } from "../stores/playerSettings.js";
import { useNavigation } from "../stores/navigation.js";
import { PlayerSettingsPanel } from "./PlayerSettingsPanel.js";
import { MusicsetSTPanel } from './MusicsetSTPanel.js';
import { MusicsetPanel } from './MusicsetPanel.js';
import { EQModal } from './EQModal.js';
import { HeaderControlsGroup } from './HeaderControlsGroup.js';
import { PlaySVG, EditorSVG, FullscreenSVG, FullscreenExitSVG, TuneSVG, SynchronizerSVG, SettingsTSVG, PlaylistSVG, MusicKeySVG } from "./svg.js";

import { isAndroidNative } from '../utils/platform-detector.js';
import { MSFileListPanel } from './MSFileListPanel.js';
import { AudioFileAdapter } from '../utils/audio-file-adapter.js';
import type { AudioTrack } from '../utils/mediastore-plugin.js';
import { getDisplayKey } from '../utils/key-calculator.js';
import { toggleFullscreen as toggleFullscreenHelper, getFullscreenStatus } from '../utils/fullscreen-helper.js';
import { useSTEventListeners } from '../hooks/useSTEventListeners.js';
import { HeaderLeftControls } from './HeaderLeftControls.js';

export const Header: React.FC = () => {
    const { lang } = useContext(appContext);
    
    const playerSettings = usePlayerSettings();
    const navigation = useNavigation();
    
    const [isPlayerPage, setIsPlayerPage] = useState(() => {
        return location.hash.includes(ROUTER.player) && !location.hash.includes(ROUTER.playerSoundTouchJS);
    });
    
    const [isPlayerSoundTouchPage, setIsPlayerSoundTouchPage] = useState(() => {
        return location.hash.includes(ROUTER.playerSoundTouchJS);
    });
    
    const [isPreferencesPage, setIsPreferencesPage] = useState(() => {
        return location.hash.includes(ROUTER.preferences);
    });
    
    const [isLrcUtilsPage, setIsLrcUtilsPage] = useState(() => {
        return location.hash.includes(ROUTER.lrcutils);
    });
    
    const [isSynchronizerPage, setIsSynchronizerPage] = useState(() => {
        return location.hash.includes(ROUTER.synchronizer);
    });
    
    const [isTunePage, setIsTunePage] = useState(() => {
        return location.hash.includes(ROUTER.tune);
    });
    
    useEffect(() => {
        const checkRoute = () => {
            setIsPlayerPage(location.hash.includes(ROUTER.player) && !location.hash.includes(ROUTER.playerSoundTouchJS));
            setIsPlayerSoundTouchPage(location.hash.includes(ROUTER.playerSoundTouchJS));
            setIsPreferencesPage(location.hash.includes(ROUTER.preferences));
            setIsLrcUtilsPage(location.hash.includes(ROUTER.lrcutils));
            setIsSynchronizerPage(location.hash.includes(ROUTER.synchronizer));
            setIsTunePage(location.hash.includes(ROUTER.tune));
        };
        
        checkRoute();
        window.addEventListener('hashchange', checkRoute);
        return () => window.removeEventListener('hashchange', checkRoute);
    }, []);
    
    const [showEditorMenu, setShowEditorMenu] = useState(false);
    const [showFileListPanel, setShowFileListPanel] = useState(false);
    const [showMSPanel, setShowMSPanel] = useState(false);
        
    const isFullscreen = navigation.isFullscreen;
    const setIsFullscreen = navigation.setIsFullscreen;
    
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
    
    const [stDetectedKey, setStDetectedKey] = useState<string>('');
    const [isStDetectingKey, setIsStDetectingKey] = useState(false);
    
    const [stPitchSemitones, setStPitchSemitones] = useState(0);
    
    const [stPlaybackSpeed, setStPlaybackSpeed] = useState(1.0);
    
    const [stVocalRemoval, setStVocalRemoval] = useState(false);
    
    const [showEQPanel, setShowEQPanel] = useState(false);
    const [eqBands, setEqBands] = useState<Array<{ index: number; freq: number; level: number; minLevel: number; maxLevel: number }>>([]);
    
    const [showEQModal, setShowEQModal] = useState(false);
    
    // 使用 ST 事件监听器 Hook
    useSTEventListeners({
        setIsStDetectingKey,
        setStDetectedKey,
        setStPitchSemitones,
        setStPlaybackSpeed,
        setStVocalRemoval,
        setShowEQPanel,
        setShowEQModal,
        setEqBands
    });
    
    const getStCurrentKey = (): string => {
        return getDisplayKey(stDetectedKey, stPitchSemitones);
    };

    const toggleFullscreen = async () => {
        const isCurrentlyFullscreen = getFullscreenStatus();
        await toggleFullscreenHelper(isCurrentlyFullscreen);
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
    
    const handleToggleEQPanel = async () => {
        if (!showEQModal) {
            setShowEQModal(true);
            setShowEQPanel(true);
            
            if (eqBands.length === 0) {
                try {
                    const { getEQBands } = await import('../utils/exoplayer-plugin.js');
                    const eqData = await getEQBands();
                    if (eqData && eqData.bands && eqData.bands.length > 0) {
                        setEqBands(eqData.bands);
                    }
                } catch (error) {
                    console.error('Failed to get EQ bands:', error);
                }
            }
        } else {
            setShowEQModal(false);
            setShowEQPanel(false);
        }
    };
    
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
        
    const handlePlayMSTrack = useCallback((_trackIndex: number) => {
        // MSFileListPanel 现在直接发送 'play-ms-playlist' 事件
        // 这个函数保留仅为接口兼容
    }, []);

    return (
        <>
            {/* 左上角控制按钮 - 使用独立组件 */}
            <HeaderLeftControls
                isPlayerSoundTouchPage={isPlayerSoundTouchPage}
                onOpenSTFile={() => window.dispatchEvent(new CustomEvent('trigger-st-file-open'))}
                onOpenMSLibrary={() => setShowMSPanel(true)}
                onToggleFileList={toggleFileListPanel}
            />
            
            {/* Preferences 页面标题 */}
            {isPreferencesPage && (
                <div className="header-page-title">
                    <h1>{lang.app.fullname}</h1>
                </div>
            )}
            
            {/* 右上角控制按钮区域 - 使用独立组件 */}
            <HeaderControlsGroup
                isPlayerPage={isPlayerPage}
                isPlayerSoundTouchPage={isPlayerSoundTouchPage}
                isPreferencesPage={isPreferencesPage}
                isLrcUtilsPage={isLrcUtilsPage}
                isSynchronizerPage={isSynchronizerPage}
                isTunePage={isTunePage}
                lang={lang}
                isFullscreen={isFullscreen}
                onToggleFullscreen={toggleFullscreen}
                showPlayerSettings={showPlayerSettings}
                isPlayerSettingsHiding={isPlayerSettingsHiding}
                playerSettingsMenuRef={playerSettingsMenuRef}
                onClosePlayerSettings={closePlayerSettingsMenu}
                showStKeyMenu={showStKeyMenu}
                isStKeyHiding={isStKeyHiding}
                stKeyMenuRef={stKeyMenuRef}
                isStDetectingKey={isStDetectingKey}
                stDetectedKey={stDetectedKey}
                stPlaybackSpeed={stPlaybackSpeed}
                stVocalRemoval={stVocalRemoval}
                onReDetectST={() => window.dispatchEvent(new CustomEvent('trigger-st-key-detection'))}
                onAdjustPitchST={(semitones) => window.dispatchEvent(new CustomEvent('st-adjust-pitch', { detail: semitones }))}
                onResetPitchST={() => window.dispatchEvent(new CustomEvent('st-reset-pitch'))}
                getCurrentKeyST={getStCurrentKey}
                onAdjustSpeedST={(delta) => window.dispatchEvent(new CustomEvent('st-adjust-speed', { detail: delta }))}
                onResetSpeedST={() => window.dispatchEvent(new CustomEvent('st-reset-speed'))}
                onSpeedSliderChangeST={(speed) => window.dispatchEvent(new CustomEvent('st-adjust-speed-to', { detail: speed }))}
                onToggleVocalRemovalST={() => window.dispatchEvent(new CustomEvent('st-toggle-vocal-removal'))}
                showKeyDetectionMenu={showKeyDetectionMenu}
                isKeyDetectionHiding={isKeyDetectionHiding}
                keyDetectionMenuRef={keyDetectionMenuRef}
                isDetectingKey={isDetectingKey}
                detectedKey={detectedKey}
                onReDetect={() => window.dispatchEvent(new CustomEvent('trigger-key-detection'))}
                onAdjustPitch={(semitones) => window.dispatchEvent(new CustomEvent('st-adjust-pitch', { detail: semitones }))}
                onResetPitch={() => window.dispatchEvent(new CustomEvent('st-reset-pitch'))}
                onAdjustSpeed={(delta) => window.dispatchEvent(new CustomEvent('st-adjust-speed', { detail: delta }))}
                onResetSpeed={() => window.dispatchEvent(new CustomEvent('st-reset-speed'))}
                onSpeedSliderChange={(speed) => window.dispatchEvent(new CustomEvent('st-adjust-speed-to', { detail: speed }))}
                onToggleEQPanel={handleToggleEQPanel}
                showEQModal={showEQModal}
                eqBands={eqBands}
                onCloseEQModal={() => setShowEQModal(false)}
                onToggleVocalRemovalEQ={() => window.dispatchEvent(new CustomEvent('st-toggle-vocal-removal'))}
                onAdjustEQBand={(bandIndex, level) => {
                    window.dispatchEvent(new CustomEvent('st-adjust-eq-band', { 
                        detail: { bandIndex, level } 
                    }));
                }}
                EditorSVG={EditorSVG}
                TuneSVG={TuneSVG}
                SynchronizerSVG={SynchronizerSVG}
                PlaySVG={PlaySVG}
                FullscreenSVG={FullscreenSVG}
                FullscreenExitSVG={FullscreenExitSVG}
                SettingsTSVG={SettingsTSVG}
                MusicKeySVG={MusicKeySVG}
                onTogglePlayerSettings={togglePlayerSettingsMenu}
                onToggleKeyDetectionMenu={() => setShowKeyDetectionMenu(!showKeyDetectionMenu)}
                onToggleStKeyMenu={() => setShowStKeyMenu(!showStKeyMenu)}
            />
            
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
            
            {/* ✅ 独立 EQ 弹窗 - 使用独立组件 */}
            <EQModal
                showEQModal={showEQModal}
                eqBands={eqBands}
                stVocalRemoval={stVocalRemoval}
                onClose={() => setShowEQModal(false)}
                onToggleVocalRemoval={() => window.dispatchEvent(new CustomEvent('st-toggle-vocal-removal'))}
                onAdjustEQBand={(bandIndex, level) => {
                    window.dispatchEvent(new CustomEvent('st-adjust-eq-band', { 
                        detail: { bandIndex, level } 
                    }));
                }}
            />
        </>
    );
};
