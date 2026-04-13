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
export const useNavigation = create<NavigationState>((set, get) => ({
  isFullscreen: false,
  showEditorMenu: false,
  showPlayerSettings: false,
  showKeyDetectionMenu: false,
  showStKeyMenu: false,
  isHiding: false,
  
  setIsFullscreen: (isFullscreen) => set({ isFullscreen }),
  
  toggleEditorMenu: () => set((state) => ({ 
    showEditorMenu: !state.showEditorMenu 
  })),
  
  closeEditorMenu: () => set({ showEditorMenu: false }),
  
  togglePlayerSettings: () => set((state) => {
    if (state.showPlayerSettings && !state.isHiding) {
      get().closePlayerSettings();
      return {};
    }
    return { showPlayerSettings: true, isHiding: false };
  }),
  
  closePlayerSettings: () => set((state) => {
    if (state.isHiding) return {};
    
    set({ isHiding: true });
    setTimeout(() => {
      set({ showPlayerSettings: false, isHiding: false });
    }, 300);
    
    return {};
  }),
  
  toggleKeyDetectionMenu: () => set((state) => {
    if (state.showKeyDetectionMenu && !state.isHiding) {
      get().closeKeyDetectionMenu();
      return {};
    }
    return { showKeyDetectionMenu: true, isHiding: false };
  }),
  
  closeKeyDetectionMenu: () => set((state) => {
    if (state.isHiding) return {};
    
    set({ isHiding: true });
    setTimeout(() => {
      set({ showKeyDetectionMenu: false, isHiding: false });
    }, 300);
    
    return {};
  }),
  
  toggleStKeyMenu: () => set((state) => {
    if (state.showStKeyMenu && !state.isHiding) {
      get().closeStKeyMenu();
      return {};
    }
    return { showStKeyMenu: true, isHiding: false };
  }),
  
  closeStKeyMenu: () => set((state) => {
    if (state.isHiding) return {};
    
    set({ isHiding: true });
    setTimeout(() => {
      set({ showStKeyMenu: false, isHiding: false });
    }, 300);
    
    return {};
  }),
  
  closeAllMenus: () => set({
    showEditorMenu: false,
    showPlayerSettings: false,
    showKeyDetectionMenu: false,
    showStKeyMenu: false,
    isHiding: false,
  }),
}));
