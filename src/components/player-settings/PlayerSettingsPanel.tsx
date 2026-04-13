import React from 'react';
import { usePlayerSettings } from '../../stores/playerSettings.js';

interface PlayerSettingsPanelProps {
  onClose: () => void;
  isHiding?: boolean;
  lang: any;
}

/**
 * Player 设置面板组件
 * 包含字体大小、背景颜色、歌词颜色、副行透明度等设置
 */
export const PlayerSettingsPanel: React.FC<PlayerSettingsPanelProps> = ({ 
  onClose,
  isHiding = false,
  lang,
}) => {
  const {
    fontSize,
    bgColor,
    lyricColor,
    subOpacity,
    setFontSize,
    setBgColor,
    setLyricColor,
    setSubOpacity,
  } = usePlayerSettings();

  return (
    <div className={`player-settings-menu${isHiding ? ' menu-hiding' : ''}`}>
      {/* 字体大小设置 */}
      <div className="player-settings-group">
        <div className="player-settings-label">{lang.header.fontSize}</div>
        <div className="player-settings-options">
          <button 
            className="player-setting-btn"
            onClick={() => setFontSize(fontSize + 0.1)}
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
            {(fontSize * 10).toFixed(0)}
          </button>
          <button 
            className="player-setting-btn"
            onClick={() => setFontSize(fontSize - 0.1)}
            title={lang.header.decreaseFont}
          >
            A-
          </button>
        </div>
      </div>

      {/* 文字对齐 */}
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

      {/* 背景颜色 */}
      <div className="player-settings-group">
        <div className="player-settings-label">{lang.header.bgColor}</div>
        <div className="player-settings-color-picker">
          <input
            type="color"
            value={bgColor}
            onChange={(e) => setBgColor(e.target.value)}
            className="player-color-input"
            title={lang.header.selectBgColor}
          />
          <div className="player-color-preview" style={{ backgroundColor: bgColor }}>
            {bgColor}
          </div>
        </div>
      </div>

      {/* 歌词颜色 */}
      <div className="player-settings-group">
        <div className="player-settings-label">{lang.header.lyricColor}</div>
        <div className="player-settings-color-picker">
          <input
            type="color"
            value={lyricColor}
            onChange={(e) => setLyricColor(e.target.value)}
            className="player-color-input"
            title={lang.header.selectLyricColor}
          />
          <div className="player-color-preview" style={{ backgroundColor: lyricColor, color: '#000000' }}>
            {lyricColor}
          </div>
        </div>
      </div>

      {/* 副行透明度 */}
      <div className="player-settings-group">
        <div className="player-settings-label">{lang.header.subOpacity}</div>
        <div className="player-settings-options">
          <button 
            className="player-setting-btn"
            onClick={() => setSubOpacity(subOpacity - 0.1)}
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
            {Math.round(subOpacity * 100)}%
          </button>
          <button 
            className="player-setting-btn"
            onClick={() => setSubOpacity(subOpacity + 0.1)}
            title={lang.header.increaseOpacity}
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
};
