import React, { useState } from 'react';
import { SketchPicker, ColorResult } from 'react-color';
import { usePlayerSettings } from '../stores/playerSettings.js';

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
    textAlign,
    setFontSize,
    setBgColor,
    setLyricColor,
    setSubOpacity,
    setTextAlign,
  } = usePlayerSettings();

  // ✅ 颜色选择器状态
  const [showBgColorPicker, setShowBgColorPicker] = useState(false);
  const [showLyricColorPicker, setShowLyricColorPicker] = useState(false);

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
            onClick={() => setTextAlign('left')}
            title={lang.header.alignLeft}
          >
            {lang.header.left}
          </button>
          <button 
            className="player-setting-btn"
            onClick={() => setTextAlign('center')}
            title={lang.header.alignCenter}
          >
            {lang.header.center}
          </button>
          <button 
            className="player-setting-btn"
            onClick={() => setTextAlign('right')}
            title={lang.header.alignRight}
          >
            {lang.header.right}
          </button>
        </div>
      </div>

      {/* 背景颜色 */}
      <div className="player-settings-group" style={{ position: 'relative' }}>
        <div className="player-settings-label">{lang.header.bgColor}</div>
        <div 
          className="player-settings-color-picker" 
          onClick={() => setShowBgColorPicker(!showBgColorPicker)}
          style={{ cursor: 'pointer' }}
        >
          <div 
            className="player-color-preview" 
            style={{ 
              backgroundColor: bgColor,
              width: '100%',
              height: '40px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#000000',
              fontWeight: 'bold',
              fontSize: '0.9rem',
              border: '2px solid rgba(255, 255, 255, 0.2)',
            }}
          >
            {bgColor}
          </div>
        </div>
        
        {/* ✅ 背景颜色选择器 */}
        {showBgColorPicker && (
          <div 
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 10000,
            }}
          >
            {/* 遮罩层 */}
            <div 
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                zIndex: 9999,
              }}
              onClick={() => setShowBgColorPicker(false)}
              onTouchStart={(e) => {
                // 只有在遮罩层上触摸才关闭，不阻止颜色选择器的触摸
                if (e.target === e.currentTarget) {
                  setShowBgColorPicker(false);
                }
              }}
            />
            {/* ✅ 颜色选择器容器 */}
            <div 
              style={{
                position: 'relative',
                zIndex: 10001,
                touchAction: 'none', // ✅ 防止浏览器拦截触摸事件
              }}
            >
              <SketchPicker 
                color={bgColor}
                onChange={async (color: ColorResult) => {
                  try {
                    await setBgColor(color.hex);
                  } catch (err) {
                    // 设置背景颜色失败处理
                  }
                }}
                styles={{
                  default: {
                    picker: {
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                      borderRadius: '8px',
                      touchAction: 'none', // ✅ 确保内部元素也能响应触摸
                    }
                  }
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* 歌词颜色 */}
      <div className="player-settings-group" style={{ position: 'relative' }}>
        <div className="player-settings-label">{lang.header.lyricColor}</div>
        <div 
          className="player-settings-color-picker" 
          onClick={() => setShowLyricColorPicker(!showLyricColorPicker)}
          style={{ cursor: 'pointer' }}
        >
          <div 
            className="player-color-preview" 
            style={{ 
              backgroundColor: lyricColor,
              width: '100%',
              height: '40px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#000000',
              fontWeight: 'bold',
              fontSize: '0.9rem',
              border: '2px solid rgba(255, 255, 255, 0.2)',
            }}
          >
            {lyricColor}
          </div>
        </div>
        
        {/* ✅ 歌词颜色选择器 */}
        {showLyricColorPicker && (
          <div 
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 10000,
            }}
          >
            {/* 遮罩层 */}
            <div 
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                zIndex: 9999,
              }}
              onClick={() => setShowLyricColorPicker(false)}
              onTouchStart={(e) => {
                // 只有在遮罩层上触摸才关闭，不阻止颜色选择器的触摸
                if (e.target === e.currentTarget) {
                  setShowLyricColorPicker(false);
                }
              }}
            />
            {/* ✅ 颜色选择器容器 */}
            <div 
              style={{
                position: 'relative',
                zIndex: 10001,
                touchAction: 'none', // ✅ 防止浏览器拦截触摸事件
              }}
            >
              <SketchPicker 
                color={lyricColor}
                onChange={async (color: ColorResult) => {
                  try {
                    await setLyricColor(color.hex);
                  } catch (err) {
                    // 设置歌词颜色失败处理
                  }
                }}
                styles={{
                  default: {
                    picker: {
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                      borderRadius: '8px',
                      touchAction: 'none', // ✅ 确保内部元素也能响应触摸
                    }
                  }
                }}
              />
            </div>
          </div>
        )}
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
