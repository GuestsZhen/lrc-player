import { create } from 'zustand';
import { Preferences } from '@capacitor/preferences';

interface PlayerSettingsState {
  // 字体大小
  fontSize: number;
  // 背景颜色
  bgColor: string;
  // 歌词颜色
  lyricColor: string;
  // 副行透明度
  subOpacity: number;
  // 对齐方式
  textAlign: 'left' | 'center' | 'right';
  
  // Actions
  setFontSize: (size: number) => Promise<void>;
  setBgColor: (color: string) => Promise<void>;
  setLyricColor: (color: string) => Promise<void>;
  setSubOpacity: (opacity: number) => Promise<void>;
  setTextAlign: (align: 'left' | 'center' | 'right') => Promise<void>;
  resetToDefaults: () => Promise<void>;
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
 * 使用 Capacitor Preferences API 实现跨平台持久化存储
 */
export const usePlayerSettings = create<PlayerSettingsState>((set) => ({
  // 初始状态从 Capacitor Preferences 读取（异步初始化在下方处理）
  fontSize: 1.3, // 默认值，会在 initializeSettings 中更新
  bgColor: '#2e2e2e', // 默认值
  lyricColor: '#ffffff', // 默认值
  subOpacity: 0.3, // 默认值
  textAlign: 'center', // 默认值
  
  setFontSize: async (size) => {
    const newSize = Math.min(Math.max(size, 0.8), 2.5);
    await Preferences.set({ key: 'player-font-size', value: String(newSize) });
    // 通知其他组件
    window.dispatchEvent(new CustomEvent('player-font-size-update', { detail: newSize }));
    set({ fontSize: newSize });
  },
  
  setBgColor: async (color) => {
    try {
      await Preferences.set({ key: 'player-bg-color', value: color });
      
      window.dispatchEvent(new CustomEvent('player-bg-color-change', { detail: color }));
      set({ bgColor: color });
    } catch (error) {
      // 保存背景色失败处理
    }
  },
  
  setLyricColor: async (color) => {
    try {
      await Preferences.set({ key: 'player-lyric-color', value: color });
      
      window.dispatchEvent(new CustomEvent('player-lyric-color-change', { detail: color }));
      set({ lyricColor: color });
    } catch (error) {
      // 保存歌词颜色失败处理
    }
  },
  
  setSubOpacity: async (opacity) => {
    const state = usePlayerSettings.getState();
    const newOpacity = Math.min(Math.max(opacity, 0.1), 1.0);
    await Preferences.set({ key: 'player-sub-opacity', value: String(newOpacity) });
    window.dispatchEvent(new CustomEvent('player-sub-opacity-change', { detail: newOpacity - state.subOpacity }));
    set({ subOpacity: newOpacity });
  },
  
  setTextAlign: async (align) => {
    await Preferences.set({ key: 'player-text-align', value: align });
    window.dispatchEvent(new CustomEvent('player-text-align-change', { detail: align }));
    set({ textAlign: align });
  },
  
  resetToDefaults: async () => {
    const defaults: PlayerSettingsState = {
      fontSize: 1.3,
      bgColor: getDefaultBgColor(),
      lyricColor: getDefaultLyricColor(),
      subOpacity: 0.3,
      textAlign: 'center',
      setFontSize: async () => {},
      setBgColor: async () => {},
      setLyricColor: async () => {},
      setSubOpacity: async () => {},
      setTextAlign: async () => {},
      resetToDefaults: async () => {},
    };
    
    await Preferences.set({ key: 'player-font-size', value: String(defaults.fontSize) });
    await Preferences.set({ key: 'player-bg-color', value: defaults.bgColor });
    await Preferences.set({ key: 'player-lyric-color', value: defaults.lyricColor });
    await Preferences.set({ key: 'player-sub-opacity', value: String(defaults.subOpacity) });
    await Preferences.set({ key: 'player-text-align', value: defaults.textAlign });
    
    set({
      fontSize: defaults.fontSize,
      bgColor: defaults.bgColor,
      lyricColor: defaults.lyricColor,
      subOpacity: defaults.subOpacity,
      textAlign: defaults.textAlign,
    });
  },
}));

/**
 * 异步初始化设置（在应用启动时调用）
 */
export const initializePlayerSettings = async () => {
  try {
    const [fontSizeResult, bgColorResult, lyricColorResult, subOpacityResult, textAlignResult] = await Promise.all([
      Preferences.get({ key: 'player-font-size' }),
      Preferences.get({ key: 'player-bg-color' }),
      Preferences.get({ key: 'player-lyric-color' }),
      Preferences.get({ key: 'player-sub-opacity' }),
      Preferences.get({ key: 'player-text-align' }),
    ]);
    
    const defaultBgColor = getDefaultBgColor();
    const defaultLyricColor = getDefaultLyricColor();
    
    // 验证背景颜色
    let finalBgColor = bgColorResult.value || defaultBgColor;
    if (bgColorResult.value) {
      const hex = bgColorResult.value.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      
      if (brightness > 200) {
        finalBgColor = defaultBgColor;
        await Preferences.set({ key: 'player-bg-color', value: defaultBgColor });
      }
    }
    
    const settings = {
      fontSize: Number(fontSizeResult.value) || 1.3,
      bgColor: finalBgColor,
      lyricColor: lyricColorResult.value || defaultLyricColor,
      subOpacity: Number(subOpacityResult.value) || 0.3,
      textAlign: (textAlignResult.value as 'left' | 'center' | 'right') || 'center',
    };
    
    usePlayerSettings.setState(settings);
  } catch (error) {
    // 初始化设置失败处理
  }
};
