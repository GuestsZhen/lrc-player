import { create } from 'zustand';

interface PlayerSettingsState {
  // 字体大小
  fontSize: number;
  // 背景颜色
  bgColor: string;
  // 歌词颜色
  lyricColor: string;
  // 副行透明度
  subOpacity: number;
  
  // Actions
  setFontSize: (size: number) => void;
  setBgColor: (color: string) => void;
  setLyricColor: (color: string) => void;
  setSubOpacity: (opacity: number) => void;
  resetToDefaults: () => void;
}

const getDefaultBgColor = () => {
  const themeMode = localStorage.getItem('preferences') 
    ? JSON.parse(localStorage.getItem('preferences') || '{}').themeMode 
    : 0;
  return themeMode === 1 ? '#ededed' : '#2e2e2e';
};

const getDefaultLyricColor = () => {
  const themeMode = localStorage.getItem('preferences') 
    ? JSON.parse(localStorage.getItem('preferences') || '{}').themeMode 
    : 0;
  return themeMode === 1 ? '#eeeeee' : '#ffffff';
};

/**
 * Player 设置状态管理
 */
export const usePlayerSettings = create<PlayerSettingsState>((set) => ({
  // 初始状态从 sessionStorage 读取
  fontSize: Number(sessionStorage.getItem("player-font-size")) || 1.3,
  bgColor: (() => {
    const stored = sessionStorage.getItem('player-bg-color');
    const defaultColor = getDefaultBgColor();
    
    // 验证存储的颜色是否有效（应该是深色系）
    let finalColor = stored || defaultColor;
    
    // 如果存储的颜色是浅色（亮度 > 200），则使用默认深色
    if (stored) {
      const hex = stored.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      
      if (brightness > 200) {
        finalColor = defaultColor;
        sessionStorage.setItem('player-bg-color', defaultColor);
      }
    }
    
    return finalColor;
  })(),
  lyricColor: sessionStorage.getItem('player-lyric-color') || getDefaultLyricColor(),
  subOpacity: Number(sessionStorage.getItem('player-sub-opacity')) || 0.3,
  
  setFontSize: (size) => set((state) => {
    const newSize = Math.min(Math.max(size, 0.8), 2.5);
    sessionStorage.setItem("player-font-size", String(newSize));
    // 通知其他组件
    window.dispatchEvent(new CustomEvent('player-font-size-update', { detail: newSize }));
    return { fontSize: newSize };
  }),
  
  setBgColor: (color) => set(() => {
    sessionStorage.setItem('player-bg-color', color);
    window.dispatchEvent(new CustomEvent('player-bg-color-change', { detail: color }));
    return { bgColor: color };
  }),
  
  setLyricColor: (color) => set(() => {
    sessionStorage.setItem('player-lyric-color', color);
    window.dispatchEvent(new CustomEvent('player-lyric-color-change', { detail: color }));
    return { lyricColor: color };
  }),
  
  setSubOpacity: (opacity) => set((state) => {
    const newOpacity = Math.min(Math.max(opacity, 0.1), 1.0);
    sessionStorage.setItem('player-sub-opacity', String(newOpacity));
    window.dispatchEvent(new CustomEvent('player-sub-opacity-change', { detail: newOpacity - state.subOpacity }));
    return { subOpacity: newOpacity };
  }),
  
  resetToDefaults: () => set(() => {
    const defaults = {
      fontSize: 1.3,
      bgColor: getDefaultBgColor(),
      lyricColor: getDefaultLyricColor(),
      subOpacity: 0.3,
    };
    
    sessionStorage.setItem("player-font-size", String(defaults.fontSize));
    sessionStorage.setItem('player-bg-color', defaults.bgColor);
    sessionStorage.setItem('player-lyric-color', defaults.lyricColor);
    sessionStorage.setItem('player-sub-opacity', String(defaults.subOpacity));
    
    return defaults;
  }),
}));
