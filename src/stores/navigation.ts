import { create } from 'zustand';

interface NavigationState {
  // 全屏状态
  isFullscreen: boolean;
  // Editor 菜单显示状态
  showEditorMenu: boolean;
  // Player 设置菜单显示状态
  showPlayerSettings: boolean;
  // 调性检测菜单显示状态
  showKeyDetectionMenu: boolean;
  // ST 歌曲调整菜单显示状态
  showStKeyMenu: boolean;
  // 动画隐藏状态
  isHiding: boolean;
  // 关闭超时ID（用于清除pending的timeout）
  closeTimeouts: {
    keyDetection?: number;
    playerSettings?: number;
    stKey?: number;
  };
  
  // Actions
  setIsFullscreen: (isFullscreen: boolean) => void;
  toggleEditorMenu: () => void;
  closeEditorMenu: () => void;
  togglePlayerSettings: () => void;
  closePlayerSettings: () => void;
  toggleKeyDetectionMenu: () => void;
  closeKeyDetectionMenu: () => void;
  toggleStKeyMenu: () => void;
  closeStKeyMenu: () => void;
  closeAllMenus: () => void;
}

/**
 * 导航状态管理
 */
export const useNavigation = create<NavigationState>((set) => ({
  isFullscreen: false,
  showEditorMenu: false,
  showPlayerSettings: false,
  showKeyDetectionMenu: false,
  showStKeyMenu: false,
  isHiding: false,
  closeTimeouts: {},
  
  setIsFullscreen: (isFullscreen) => set({ isFullscreen }),
  
  toggleEditorMenu: () => set((state) => ({ 
    showEditorMenu: !state.showEditorMenu 
  })),
  
  closeEditorMenu: () => set({ showEditorMenu: false }),
  
  togglePlayerSettings: () => set((state) => {
    // ✅ 简化逻辑：直接切换状态，不使用动画
    return { showPlayerSettings: !state.showPlayerSettings, isHiding: false };
  }),
  
  closePlayerSettings: () => set({ showPlayerSettings: false, isHiding: false }),
  
  toggleKeyDetectionMenu: () => set((state) => {
    // ✅ 简化逻辑：直接切换状态，不使用动画
    return { showKeyDetectionMenu: !state.showKeyDetectionMenu, isHiding: false };
  }),
  
  closeKeyDetectionMenu: () => set({ showKeyDetectionMenu: false, isHiding: false }),
  
  toggleStKeyMenu: () => set((state) => {
    // ✅ 简化逻辑：直接切换状态，不使用动画
    return { showStKeyMenu: !state.showStKeyMenu, isHiding: false };
  }),
  
  closeStKeyMenu: () => set({ showStKeyMenu: false, isHiding: false }),
  
  closeAllMenus: () => set({
    showEditorMenu: false,
    showPlayerSettings: false,
    showKeyDetectionMenu: false,
    showStKeyMenu: false,
    isHiding: false,
  }),
}));
