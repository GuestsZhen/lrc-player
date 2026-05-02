/**
 * Header 左上角控制按钮组件
 * 根据页面和平台显示不同的按钮
 */

import React from 'react';
import { PlaylistSVG } from './svg.js';
import { isAndroidNative } from '../utils/platform-detector.js';

interface HeaderLeftControlsProps {
    isPlayerSoundTouchPage: boolean;
    onOpenSTFile: () => void;
    onOpenMSLibrary: () => void;
    onToggleFileList: () => void;
}

export const HeaderLeftControls: React.FC<HeaderLeftControlsProps> = ({
    isPlayerSoundTouchPage,
    onOpenSTFile,
    onOpenMSLibrary,
    onToggleFileList
}) => {
    if (isPlayerSoundTouchPage) {
        return (
            <div className="header-left-controls">
                <button 
                    className="header-control-button file-list-btn"
                    onClick={onOpenSTFile}
                    title="打开文件"
                >
                    <PlaylistSVG />
                </button>
            </div>
        );
    }
    
    return (
        <div className="header-left-controls">
            {isAndroidNative() ? (
                <button 
                    className="header-control-button file-list-btn"
                    onClick={onOpenMSLibrary}
                    title="打开音乐库"
                >
                    <PlaylistSVG />
                </button>
            ) : (
                <button 
                    className="header-control-button file-list-btn"
                    onClick={onToggleFileList}
                    title="文件列表"
                >
                    <PlaylistSVG />
                </button>
            )}
        </div>
    );
};
