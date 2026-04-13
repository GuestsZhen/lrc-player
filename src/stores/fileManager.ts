import { create } from 'zustand';
import { playlistManager } from '../utils/playlist-manager.js';

interface FileManagerState {
  // 所有选中的文件
  selectedFiles: string[];
  // 当前播放的文件
  currentPlayingFile: string;
  // 文件对象映射
  fileObjects: Map<string, File>;
  // 搜索关键词
  searchQuery: string;
  // 文件列表面板显示状态
  showFileListPanel: boolean;
  
  // Actions
  setSelectedFiles: (files: string[]) => void;
  setCurrentPlayingFile: (fileName: string) => void;
  setFileObjects: (fileMap: Map<string, File>) => void;
  setSearchQuery: (query: string) => void;
  setShowFileListPanel: (show: boolean) => void;
  addFiles: (files: File[], lrcFiles?: File[]) => Promise<void>;
  removeFile: (fileName: string) => void;
  clearAllFiles: () => void;
  playFile: (fileName: string) => void;
}

/**
 * 文件管理状态管理
 */
export const useFileManager = create<FileManagerState>((set, get) => ({
  selectedFiles: [],
  currentPlayingFile: '',
  fileObjects: new Map(),
  searchQuery: '',
  showFileListPanel: false,
  
  setSelectedFiles: (files) => set({ selectedFiles: files }),
  
  setCurrentPlayingFile: (fileName) => set({ currentPlayingFile: fileName }),
  
  setFileObjects: (fileMap) => set({ fileObjects: fileMap }),
  
  setSearchQuery: (query) => set({ searchQuery: query }),
  
  setShowFileListPanel: (show) => set({ showFileListPanel: show }),
  
  addFiles: async (files, lrcFiles = []) => {
    const fileNames = files.map(f => f.name);
    const newFileMap = new Map(get().fileObjects);
    
    // 添加新文件到映射
    files.forEach(file => {
      newFileMap.set(file.name, file);
    });
    
    set({ 
      selectedFiles: [...get().selectedFiles, ...fileNames],
      fileObjects: newFileMap,
      searchQuery: '' // 清空搜索
    });
    
    // 触发事件通知其他组件
    window.dispatchEvent(new CustomEvent('files-selected', {
      detail: { fileNames }
    }));
    
    // 为每个音频文件查找匹配的 LRC 文件并添加到播放列表
    const audioFiles = files.filter(file => 
      file.type.startsWith('audio/') || 
      ['.ncm', '.qmcflac', '.qmc0', '.qmc1', '.qmc2', '.qmc3', '.qmcogg'].some(ext => 
        file.name.toLowerCase().endsWith(ext)
      )
    );
    
    const tracks = audioFiles.map(file => {
      const baseName = file.name.substring(0, file.name.lastIndexOf('.'));
      let matchedLrc: File | undefined;
      
      for (const lrcFile of lrcFiles) {
        const lrcBaseName = lrcFile.name.substring(0, lrcFile.name.lastIndexOf('.'));
        if (lrcBaseName === baseName) {
          matchedLrc = lrcFile;
          break;
        }
      }
      
      return { file, lrcFile: matchedLrc };
    });
    
    // 发送事件通知 Footer 添加这些文件到播放列表
    if (tracks.length > 0) {
      window.dispatchEvent(new CustomEvent('add-files-to-playlist', {
        detail: { tracks }
      }));
    }
  },
  
  removeFile: (fileName) => {
    const newSelectedFiles = get().selectedFiles.filter(f => f !== fileName);
    const newFileObjects = new Map(get().fileObjects);
    newFileObjects.delete(fileName);
    
    set({ 
      selectedFiles: newSelectedFiles,
      fileObjects: newFileObjects,
    });
    
    // 如果删除的是当前播放的文件，清空当前播放
    if (fileName === get().currentPlayingFile) {
      set({ currentPlayingFile: '' });
    }
    
    // 从 IndexedDB 中移除
    playlistManager.deleteTrack(fileName).catch((err: unknown) => {
      console.error('从播放列表移除文件失败:', err);
    });
    
    // 通知 Footer 组件更新播放列表
    window.dispatchEvent(new CustomEvent('remove-file-from-playlist', {
      detail: { fileName }
    }));
  },
  
  clearAllFiles: () => {
    set({
      selectedFiles: [],
      currentPlayingFile: '',
      fileObjects: new Map(),
      searchQuery: '',
    });
    
    // 清理 IndexedDB 中的所有 tracks
    playlistManager.clearAllTracks().catch(err => {
      console.error('清理播放列表失败:', err);
    });
  },
  
  playFile: (fileName) => {
    const file = get().fileObjects.get(fileName);
    if (!file) {
      console.warn(`文件 ${fileName} 不存在`);
      return;
    }
    
    // 查找同名的 LRC 文件
    let lrcFile: File | undefined;
    const baseName = fileName.substring(0, fileName.lastIndexOf('.'));
    
    for (const [name, fileObj] of get().fileObjects) {
      if (name.toLowerCase().endsWith('.lrc')) {
        const lrcBaseName = name.substring(0, name.lastIndexOf('.'));
        if (lrcBaseName === baseName) {
          lrcFile = fileObj;
          break;
        }
      }
    }
    
    // 更新当前播放文件
    set({ currentPlayingFile: fileName });
    
    // 保存到 IndexedDB
    const id = `${fileName}-${file.size}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const name = fileName.substring(0, fileName.lastIndexOf('.'));
    playlistManager.saveTrack({ id, name, fileName, file, lrcFile }).catch(err => {
      console.error('保存音轨失败:', err);
    });
    
    // 触发事件通知 Footer 组件播放该文件
    window.dispatchEvent(new CustomEvent('play-file-from-list', {
      detail: { file, lrcFile }
    }));
  },
}));
