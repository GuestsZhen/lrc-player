/**
 * 歌曲调整面板组件
 * 用于 Android ExoPlayer 的调性检测、音高调节、速度调节和 EQ 均衡器
 */

import React from 'react';
import { isAndroidNative } from '../utils/platform-detector.js';

interface MusicsetPanelProps {
    showKeyDetectionMenu: boolean;
    isKeyDetectionHiding: boolean;
    keyDetectionMenuRef: React.RefObject<HTMLDivElement>;
    lang: any;
    isDetectingKey: boolean;
    detectedKey: string | null;
    onReDetect: () => void;
    onAdjustPitch: (semitones: number) => void;
    onResetPitch: () => void;
    getCurrentKey: () => string;
    onAdjustSpeed: (delta: number) => void;
    onResetSpeed: () => void;
    playbackSpeed: number;
    onSpeedSliderChange: (speed: number) => void;
    onToggleEQPanel: () => void;
}

export const MusicsetPanel: React.FC<MusicsetPanelProps> = ({
    showKeyDetectionMenu,
    isKeyDetectionHiding,
    keyDetectionMenuRef,
    lang,
    isDetectingKey,
    detectedKey,
    onReDetect,
    onAdjustPitch,
    onResetPitch,
    getCurrentKey,
    onAdjustSpeed,
    onResetSpeed,
    playbackSpeed,
    onSpeedSliderChange,
    onToggleEQPanel
}) => {
    if (!showKeyDetectionMenu) return null;

    return (
        <div className={`key-detection-menu${isKeyDetectionHiding ? ' menu-hiding' : ''}`} ref={keyDetectionMenuRef}>
            {/* 调性检测 */}
            <div className="player-settings-group">
                <div className="player-settings-label">{lang.header.keyDetection || '歌曲调整'}</div>
                
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
                            onClick={onReDetect}
                        >
                            {lang.header.reDetect || '重新检测'}
                        </button>
                    </div>
                ) : (
                    <div className="no-key-detected">
                        <button 
                            className="start-detect-btn"
                            onClick={onReDetect}
                        >
                            {lang.header.detectKeyButton || '调性检测'}
                        </button>
                    </div>
                )}
            </div>
            
            {/* Android 模式下显示音高调节、速度调节、EQ 均衡器 */}
            {isAndroidNative() && (
                <>
                    {/* 音高调节 */}
                    <div className="player-settings-group">
                        <div className="player-settings-label">音高调节</div>
                        <div className="player-settings-options">
                            <button 
                                className="player-setting-btn"
                                onClick={() => onAdjustPitch(-1)}
                                title="降低一个半音"
                            >
                                -
                            </button>
                            <button 
                                className="player-setting-btn"
                                onClick={onResetPitch}
                                title="重置为原调"
                                style={{ minWidth: '50px' }}
                            >
                                {getCurrentKey()}
                            </button>
                            <button 
                                className="player-setting-btn"
                                onClick={() => onAdjustPitch(1)}
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
                                onClick={() => onAdjustSpeed(-0.05)}
                                title="降低速度 0.05x"
                                disabled={playbackSpeed <= 0.5}
                            >
                                -
                            </button>
                            <button 
                                className="player-setting-btn"
                                onClick={onResetSpeed}
                                title="重置为正常速度"
                                style={{ minWidth: '60px' }}
                            >
                                {playbackSpeed.toFixed(2)}x
                            </button>
                            <button 
                                className="player-setting-btn"
                                onClick={() => onAdjustSpeed(0.05)}
                                title="升高速度 0.05x"
                                disabled={playbackSpeed >= 2.0}
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
                                value={Math.log(playbackSpeed)}
                                onChange={(e) => {
                                    const logValue = parseFloat(e.target.value);
                                    const newSpeed = Math.exp(logValue);
                                    const clampedSpeed = Math.max(0.5, Math.min(2.0, newSpeed));
                                    onSpeedSliderChange(clampedSpeed);
                                }}
                                title={`当前速度: ${playbackSpeed.toFixed(2)}x`}
                            />
                        </div>
                    </div>
                    
                    {/* EQ 均衡器按钮 */}
                    <div className="player-settings-group">
                        <button 
                            className="start-detect-btn"
                            onClick={onToggleEQPanel}
                            style={{
                                width: '100%',
                                padding: '12px',
                                fontSize: '1rem',
                                fontWeight: '500',
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 2px 8px rgba(102, 126, 234, 0.3)';
                            }}
                        >
                            EQ 均衡器
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};
