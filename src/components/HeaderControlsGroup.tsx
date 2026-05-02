/**
 * 右上角控制按钮组组件
 * 包含 Player、全屏、文字设置、ST歌曲调整、歌曲调整等所有播放器相关控制按钮
 */

import React, { useRef } from 'react';
import ROUTER from "#const/router.json" assert { type: "json" };
import { prependHash } from "../utils/router.js";
import { PlayerSettingsPanel } from "./PlayerSettingsPanel.js";
import { MusicsetSTPanel } from './MusicsetSTPanel.js';
import { MusicsetPanel } from './MusicsetPanel.js';
import { isAndroidNative } from '../utils/platform-detector.js';

interface EQBand {
    index: number;
    freq: number;
    level: number;
    minLevel: number;
    maxLevel: number;
}

interface HeaderControlsGroupProps {
    // 页面状态
    isPlayerPage: boolean;
    isPlayerSoundTouchPage: boolean;
    isPreferencesPage: boolean;
    isLrcUtilsPage: boolean;
    isSynchronizerPage: boolean;
    isTunePage: boolean;
    
    // 多语言
    lang: any;
    
    // 全屏状态
    isFullscreen: boolean;
    onToggleFullscreen: () => void;
    
    // 文字设置面板
    showPlayerSettings: boolean;
    isPlayerSettingsHiding: boolean;
    playerSettingsMenuRef: React.RefObject<HTMLDivElement>;
    onClosePlayerSettings: () => void;
    
    // ST歌曲调整状态
    showStKeyMenu: boolean;
    isStKeyHiding: boolean;
    stKeyMenuRef: React.RefObject<HTMLDivElement>;
    isStDetectingKey: boolean;
    stDetectedKey: string | null;
    stPlaybackSpeed: number;
    stVocalRemoval: boolean;
    onReDetectST: () => void;
    onAdjustPitchST: (semitones: number) => void;
    onResetPitchST: () => void;
    getCurrentKeyST: () => string;
    onAdjustSpeedST: (delta: number) => void;
    onResetSpeedST: () => void;
    onSpeedSliderChangeST: (speed: number) => void;
    onToggleVocalRemovalST: () => void;
    
    // 歌曲调整状态
    showKeyDetectionMenu: boolean;
    isKeyDetectionHiding: boolean;
    keyDetectionMenuRef: React.RefObject<HTMLDivElement>;
    isDetectingKey: boolean;
    detectedKey: string | null;
    onReDetect: () => void;
    onAdjustPitch: (semitones: number) => void;
    onResetPitch: () => void;
    onAdjustSpeed: (delta: number) => void;
    onResetSpeed: () => void;
    onSpeedSliderChange: (speed: number) => void;
    onToggleEQPanel: () => void;
    
    // EQ 弹窗状态
    showEQModal: boolean;
    eqBands: EQBand[];
    onCloseEQModal: () => void;
    onToggleVocalRemovalEQ: () => void;
    onAdjustEQBand: (bandIndex: number, level: number) => void;
    
    // SVG 图标组件
    EditorSVG: React.FC;
    TuneSVG: React.FC;
    SynchronizerSVG: React.FC;
    PlaySVG: React.FC;
    FullscreenSVG: React.FC;
    FullscreenExitSVG: React.FC;
    SettingsTSVG: React.FC;
    MusicKeySVG: React.FC;
    
    // 回调函数
    onTogglePlayerSettings?: () => void;
    onToggleKeyDetectionMenu?: () => void;
    onToggleStKeyMenu?: () => void;
}

export const HeaderControlsGroup: React.FC<HeaderControlsGroupProps> = ({
    isPlayerPage,
    isPlayerSoundTouchPage,
    isPreferencesPage,
    isLrcUtilsPage,
    isSynchronizerPage,
    isTunePage,
    lang,
    isFullscreen,
    onToggleFullscreen,
    showPlayerSettings,
    isPlayerSettingsHiding,
    playerSettingsMenuRef,
    onClosePlayerSettings,
    showStKeyMenu,
    isStKeyHiding,
    stKeyMenuRef,
    isStDetectingKey,
    stDetectedKey,
    stPlaybackSpeed,
    stVocalRemoval,
    onReDetectST,
    onAdjustPitchST,
    onResetPitchST,
    getCurrentKeyST,
    onAdjustSpeedST,
    onResetSpeedST,
    onSpeedSliderChangeST,
    onToggleVocalRemovalST,
    showKeyDetectionMenu,
    isKeyDetectionHiding,
    keyDetectionMenuRef,
    isDetectingKey,
    detectedKey,
    onReDetect,
    onAdjustPitch,
    onResetPitch,
    onAdjustSpeed,
    onResetSpeed,
    onSpeedSliderChange,
    onToggleEQPanel,
    showEQModal,
    eqBands,
    onCloseEQModal,
    onToggleVocalRemovalEQ,
    onAdjustEQBand,
    EditorSVG,
    TuneSVG,
    SynchronizerSVG,
    PlaySVG,
    FullscreenSVG,
    FullscreenExitSVG,
    SettingsTSVG,
    MusicKeySVG,
    onTogglePlayerSettings,
    onToggleKeyDetectionMenu,
    onToggleStKeyMenu
}) => {
    return (
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
                
                {/* 全屏按钮 - 在 Player 和 Player-SoundTouch 页面显示（Android 下隐藏） */}
                {(isPlayerPage || isPlayerSoundTouchPage) && !isAndroidNative() && (
                    <button 
                        className="header-control-button fullscreen-btn"
                        onClick={onToggleFullscreen}
                        title={isFullscreen ? lang.header.exitFullscreen : lang.header.fullscreen}
                    >
                        {isFullscreen ? <FullscreenExitSVG /> : <FullscreenSVG />}
                    </button>
                )}
                
                {/* Player 页面的字体设置按钮 - 在 Player 和 Player-SoundTouch 页面显示 */}
                {/* 文字设定按钮 */}
                {(isPlayerPage || isPlayerSoundTouchPage) && (
                    <div style={{ position: 'relative' }}>
                        <button 
                            className="player-control-button"
                            onClick={onTogglePlayerSettings}
                            title={lang.header.fontSettings}
                        >
                            <SettingsTSVG />
                        </button>
                        {showPlayerSettings && (
                            <div ref={playerSettingsMenuRef}>
                                <PlayerSettingsPanel 
                                    onClose={onClosePlayerSettings}
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
                            onClick={onToggleStKeyMenu}
                            title="ST歌曲调整"
                        >
                            <MusicKeySVG />
                        </button>
                        
                        {/* ST歌曲调整菜单 - 使用独立组件 */}
                        <MusicsetSTPanel
                            showStKeyMenu={showStKeyMenu}
                            isStKeyHiding={isStKeyHiding}
                            stKeyMenuRef={stKeyMenuRef}
                            isStDetectingKey={isStDetectingKey}
                            stDetectedKey={stDetectedKey}
                            onReDetect={onReDetectST}
                            onAdjustPitch={onAdjustPitchST}
                            onResetPitch={onResetPitchST}
                            getCurrentKey={getCurrentKeyST}
                            onAdjustSpeed={onAdjustSpeedST}
                            onResetSpeed={onResetSpeedST}
                            playbackSpeed={stPlaybackSpeed}
                            onSpeedSliderChange={onSpeedSliderChangeST}
                            vocalRemovalEnabled={stVocalRemoval}
                            onToggleVocalRemoval={onToggleVocalRemovalST}
                        />
                    </div>
                )}
                
                {/* 歌曲调整按钮 - 在 Player 和 Synchronizer 页面显示 */}
                {(isPlayerPage || isSynchronizerPage) && (
                    <div style={{ position: 'relative' }}>
                        <button 
                            className="player-control-button key-detection-btn"
                            onClick={onToggleKeyDetectionMenu}
                            title={lang.header.keyDetection || '歌曲调整'}
                        >
                            <MusicKeySVG />
                            {detectedKey && <span className="key-badge">{detectedKey.split(' ')[0]}</span>}
                        </button>
                        
                        {/* 歌曲调整菜单 - 使用独立组件 */}
                        <MusicsetPanel
                            showKeyDetectionMenu={showKeyDetectionMenu}
                            isKeyDetectionHiding={isKeyDetectionHiding}
                            keyDetectionMenuRef={keyDetectionMenuRef}
                            lang={lang}
                            isDetectingKey={isDetectingKey}
                            detectedKey={detectedKey}
                            onReDetect={onReDetect}
                            onAdjustPitch={onAdjustPitch}
                            onResetPitch={onResetPitch}
                            getCurrentKey={getCurrentKeyST}
                            onAdjustSpeed={onAdjustSpeed}
                            onResetSpeed={onResetSpeed}
                            playbackSpeed={stPlaybackSpeed}
                            onSpeedSliderChange={onSpeedSliderChange}
                            onToggleEQPanel={onToggleEQPanel}
                        />
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
    );
};
