import { useState, useEffect } from 'react';
import ROUTER from '#const/router.json';

interface PageState {
  isPlayerPage: boolean;
  isPlayerSoundTouchPage: boolean;
  isPreferencesPage: boolean;
  isLrcUtilsPage: boolean;
  isSynchronizerPage: boolean;
  isTunePage: boolean;
  isEditorPage: boolean;
  isGistPage: boolean;
  isHomePage: boolean;
}

/**
 * 页面检测 Hook
 * 监听路由变化，返回当前页面状态
 */
export function usePageDetection(): PageState {
  const [pages, setPages] = useState<PageState>(() => checkCurrentPage());

  useEffect(() => {
    const checkRoute = () => {
      setPages(checkCurrentPage());
    };

    window.addEventListener('hashchange', checkRoute);
    
    // Capacitor 环境中，hash 可能延迟设置，添加延迟检查
    const timer1 = setTimeout(checkRoute, 100);
    const timer2 = setTimeout(checkRoute, 500);
    
    return () => {
      window.removeEventListener('hashchange', checkRoute);
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  return pages;
}

function checkCurrentPage(): PageState {
  const hash = location.hash;
  
  return {
    isPlayerPage: hash.includes(ROUTER.player) && !hash.includes(ROUTER.playerSoundTouchJS),
    isPlayerSoundTouchPage: hash.includes(ROUTER.playerSoundTouchJS),
    isPreferencesPage: hash.includes(ROUTER.preferences),
    isLrcUtilsPage: hash.includes(ROUTER.lrcutils),
    isSynchronizerPage: hash.includes(ROUTER.synchronizer),
    isTunePage: hash.includes(ROUTER.tune),
    isEditorPage: hash.includes(ROUTER.editor),
    isGistPage: hash.includes(ROUTER.gist),
    isHomePage: hash === '' || hash === '#' || hash.includes(ROUTER.home),
  };
}
