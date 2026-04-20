import React from 'react';
import ROUTER from '#const/router.json';
import { prependHash } from '../utils/router.js';
import { EditorSVG, TuneSVG, SynchronizerSVG } from './svg.js';

interface NavigationButtonsProps {
  isPlayerPage: boolean;
  isPlayerSoundTouchPage: boolean;
  isPreferencesPage: boolean;
  isLrcUtilsPage: boolean;
  isSynchronizerPage: boolean;
  isTunePage: boolean;
  lang: any;
}

/**
 * 导航按钮组件
 * 根据当前页面显示不同的导航按钮
 */
export const NavigationButtons: React.FC<NavigationButtonsProps> = ({
  isPlayerPage,
  isPlayerSoundTouchPage,
  isPreferencesPage,
  isLrcUtilsPage,
  isSynchronizerPage,
  isTunePage,
  lang,
}) => {
  // Editor 按钮 - 在 Preferences、Lrc-utils、Synchronizer、Tune 和 Player-SoundTouch 页面不显示在第一位
  const showEditorFirst = !isPreferencesPage && !isLrcUtilsPage && !isSynchronizerPage && !isTunePage && !isPlayerSoundTouchPage;
  
  // Tune 按钮 - 在 Player、Preferences、Lrc-utils、Synchronizer、Tune 和 Player-SoundTouch 页面隐藏
  const showTune = !isPlayerPage && !isPreferencesPage && !isLrcUtilsPage && !isSynchronizerPage && !isTunePage && !isPlayerSoundTouchPage;
  
  // Synchronizer 按钮 - 在 Player、Preferences、Lrc-utils、Synchronizer、Tune 和 Player-SoundTouch 页面隐藏
  const showSynchronizer = !isPlayerPage && !isPreferencesPage && !isLrcUtilsPage && !isSynchronizerPage && !isTunePage && !isPlayerSoundTouchPage;
  
  // Editor 按钮在 Preferences、Lrc-utils、Synchronizer 和 Tune 页面移动到中间位置
  const showEditorMiddle = isPreferencesPage || isLrcUtilsPage || isSynchronizerPage || isTunePage;

  return (
    <div className="header-navigation">
      {showEditorFirst && (
        <a 
          className="header-control-button"
          href={prependHash(ROUTER.editor)}
          title={lang.header.editor}
        >
          <EditorSVG />
        </a>
      )}
      
      {showTune && (
        <a 
          className="header-control-button"
          href={prependHash(ROUTER.tune)}
          title={lang.header.tune}
        >
          <TuneSVG />
        </a>
      )}
      
      {showSynchronizer && (
        <a 
          className="header-control-button"
          href={prependHash(ROUTER.synchronizer)}
          title={lang.header.synchronizer}
        >
          <SynchronizerSVG />
        </a>
      )}
      
      {showEditorMiddle && (
        <a 
          className="header-control-button"
          href={prependHash(ROUTER.editor)}
          title={lang.header.editor}
        >
          <EditorSVG />
        </a>
      )}
    </div>
  );
};
