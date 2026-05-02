/**
 * ST歌曲调整面板组件
 * 用于 SoundTouch 播放器的调性检测、音高调节、速度调节和去人声功能
 */

import React from 'react';

interface MusicsetSTPanelProps {
    showStKeyMenu: boolean;
    isStKeyHiding: boolean;
    stKeyMenuRef: React.RefObject<HTMLDivElement>;
    isStDetectingKey: boolean;
    stDetectedKey: string | null;
    onReDetect: () => void;
    onAdjustPitch: (semitones: number) => void;
    onResetPitch: () => void; zh
    getCurrentKey: () => string;
    onAdjustSpeed: (delta: number) => void;
    onResetSpeed: () => void;
    playbackSpeed: number;
    onSpeedSliderChange: (speed: number) => void;
    vocalRemovalEnabled: boolean;
    onToggleVocalRemoval: () => void;
}

export const MusicsetSTPanel: React.FC<MusicsetSTPanelProps> = ({
    showStKeyMenu,
    isStKeyHiding,
    stKeyMenuRef,
    isStDetectingKey,
    stDetectedKey,
    onReDetect,
    onAdjustPitch,
    onResetPitch,
    getCurrentKey,
    onAdjustSpeed,
    onResetSpeed,
    playbackSpeed,
    onSpeedSliderChange,
    vocalRemovalEnabled,
    onToggleVocalRemoval
}) => {
    if (!showStKeyMenu) return null;

    return (
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
                            onClick={onReDetect}
                        >
                            重新检测
                        </button>
                    </div>
                ) : (
                    <div className="no-key-detected">
                        <button 
                            className="start-detect-btn"
                            onClick={onReDetect}
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
            
            {/* 去人声（伴奏模式） */}
            <div className="player-settings-group">
                <div className="player-settings-label">去人声（伴奏模式）</div>
                <div 
                    className="player-settings-options"
                    onClick={(e) => {
                        e.stopPropagation();
                    }}
                >
                    <label 
                        className="toggle-switch" 
                        title="使用相位抵消法去除居中人声，仅播放伴奏"
                    >
                        <input 
                            type="checkbox" 
                            checked={vocalRemovalEnabled}
                            onChange={(e) => {
                                onToggleVocalRemoval();
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                            }}
                        />
                        <span className="toggle-switch-label"></span>
                    </label>
                </div>
            </div>
        </div>
    );
};
