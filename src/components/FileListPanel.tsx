import React, { useRef, useEffect, useCallback } from 'react';
import { useFileManager } from '../stores/fileManager.js';
import { FolderSVG, DeleteSVG } from './svg.js';
import './FileListPanel.css';

interface FileListPanelProps {
  onClose: () => void;
  lang: any;
}

/**
 * 文件列表面板组件
 * 显示所有音频文件，支持搜索、播放、删除等操作
 */
export const FileListPanel: React.FC<FileListPanelProps> = ({ onClose, lang }) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const [isHiding, setIsHiding] = React.useState(false);
  
  const {
    selectedFiles,
    currentPlayingFile,
    searchQuery,
    setSearchQuery,
    playFile,
    removeFile,
    clearAllFiles,
  } = useFileManager();
  
  // ✅ 点击面板外部区域时关闭面板（带动画）
  useEffect(() => {
    if (isHiding) {
      return;
    }
    
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      // 如果点击的不是面板区域，关闭面板
      if (panelRef.current && !panelRef.current.contains(target)) {
        closePanel();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isHiding]);
  
  // 关闭面板（带动画）
  const closePanel = useCallback(() => {
    setIsHiding(true);
    // 等待淡出动画完成后关闭
    setTimeout(() => {
      onClose();
    }, 300); // 与 CSS 动画时间一致
  }, [onClose, isHiding]);

  // 判断是否为音频文件
  const isAudioFile = (fileName: string): boolean => {
    const audioExtensions = ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.m4a', '.wma', '.ape', '.opus'];
    const lowerName = fileName.toLowerCase();
    return audioExtensions.some(ext => lowerName.endsWith(ext));
  };

  // 移除文件扩展名
  const removeExtension = (fileName: string): string => {
    const lastDotIndex = fileName.lastIndexOf('.');
    return lastDotIndex > 0 ? fileName.substring(0, lastDotIndex) : fileName;
  };

  // 过滤后的音频文件列表
  const audioFiles = selectedFiles.filter(isAudioFile);
  
  // 搜索过滤后的音频文件
  const filteredAudioFiles = searchQuery
    ? audioFiles.filter(file => file.toLowerCase().includes(searchQuery.toLowerCase()))
    : audioFiles;

  // 处理打开文件
  const handleOpenFile = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files && files.length > 0) {
        const audioFiles = Array.from(files).filter(file => 
          file.type.startsWith('audio/') || 
          ['.ncm', '.qmcflac', '.qmc0', '.qmc1', '.qmc2', '.qmc3', '.qmcogg'].some(ext => 
            file.name.toLowerCase().endsWith(ext)
          )
        );
        
        const lrcFiles = Array.from(files).filter(file => file.name.toLowerCase().endsWith('.lrc'));
        
        // 通过 store 添加文件
        import('../stores/fileManager.js').then(({ useFileManager }) => {
          const store = useFileManager.getState();
          store.addFiles(audioFiles, lrcFiles);
        });
      }
    };
    input.click();
  };

  return (
    <div className={`selected-files-panel${isHiding ? ' menu-hiding' : ''}`} ref={panelRef}>
      <div className="selected-files-header">
        <span>{lang.playlist?.title || '文件列表'}</span>
        <div className="header-actions">
          {selectedFiles.length > 0 && (
            <button 
              className="clear-files-action-btn"
              onClick={clearAllFiles}
              title={lang.playlist?.clearPlaylist || '清除文件列表'}
            >
              <DeleteSVG />
            </button>
          )}
          <button 
            className="close-files-btn"
            onClick={onClose}
            title={lang.playlist?.close || '关闭'}
          >
            ✕
          </button>
        </div>
      </div>
      
      {/* 音频文件列表 */}
      {audioFiles.length > 0 ? (
        <>
          <ul className="selected-files-list">
            {filteredAudioFiles.map((fileName, index) => {
              const displayName = removeExtension(fileName);
              const isPlaying = fileName === currentPlayingFile;
              
              return (
                <li 
                  key={index} 
                  className={`selected-file-item ${isPlaying ? 'playing' : ''}`}
                >
                  <div 
                    className="file-name-wrapper"
                    onClick={() => playFile(fileName)}
                    style={{ flex: 1, cursor: 'pointer' }}
                  >
                    <span 
                      className="file-name file-name-marquee" 
                      title={displayName}
                    >
                      {displayName}
                    </span>
                  </div>
                  <button
                    className="remove-file-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(fileName);
                    }}
                    title="删除此歌曲"
                  >
                    ✕
                  </button>
                </li>
              );
            })}
          </ul>
          
          {/* 底部搜索框 */}
          <div className="file-search-box">
            <button
              className="file-search-open-btn"
              onClick={handleOpenFile}
              title="打开文件"
            >
              <FolderSVG />
            </button>
            <input
              type="text"
              className="file-search-input"
              placeholder={lang.playlist?.searchPlaceholder || '搜索歌曲...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                className="file-search-clear"
                onClick={() => setSearchQuery('')}
                title={lang.playlist?.clearSearch || '清除搜索'}
              >
                ✕
              </button>
            )}
          </div>
        </>
      ) : (
        <div className="no-audio-files">
          <p>{lang.playlist?.noTracks || '暂无音频文件'}</p>
          <button 
            className="open-file-from-panel-btn"
            onClick={handleOpenFile}
          >
            {lang.playlist?.openFile || '打开文件'}
          </button>
        </div>
      )}
    </div>
  );
};
