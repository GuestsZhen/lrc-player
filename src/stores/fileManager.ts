import { create } from 'zustand';
import { playlistManager } from '../utils/playlist-manager.js';

interface FileManagerState {
  // 所有选中的文件
  selectedFiles: string[];
  // 当前播放的文件
  currentPlayingFile: string;
  // 当前播放文件的索引
  currentPlayingIndex: number;
  // 文件对象映射
  fileObjects: Map<string, File>;
  // LRC 文件映射 (fileName -> lrcFile)
  lrcFileMap: Map<string, File>;
  // 搜索关键词
  searchQuery: string;
  // 文件列表面板显示状态
  showFileListPanel: boolean;
  // 播放模式：0=顺序播放，1=随机播放，2=单曲循环
  playMode: number;
  
  // Actions
  setSelectedFiles: (files: string[]) => void;
  setCurrentPlayingFile: (fileName: string) => void;
  setCurrentPlayingIndex: (index: number) => void;
  setFileObjects: (fileMap: Map<string, File>) => void;
  setLrcFileMap: (lrcMap: Map<string, File>) => void;
  setSearchQuery: (query: string) => void;
  setShowFileListPanel: (show: boolean) => void;
  setPlayMode: (mode: number) => void;
  addFiles: (files: File[], lrcFiles?: File[]) => Promise<void>;
  removeFile: (fileName: string) => void;
  clearAllFiles: () => void;
  playFile: (fileName: string) => void;
  playNext: () => string | null;  // 返回下一首文件名
  playPrevious: () => string | null;  // 返回上一首文件名
}

/**
 * 文件管理状态管理
 */
export const useFileManager = create<FileManagerState>((set, get) => ({
  selectedFiles: [],
  currentPlayingFile: '',
  currentPlayingIndex: -1,
  fileObjects: new Map(),
  lrcFileMap: new Map(),
  searchQuery: '',
  showFileListPanel: false,
  playMode: 0,  // 0=顺序，1=随机，2=单曲循环
  
  setSelectedFiles: (files) => set({ selectedFiles: files }),
  
  setCurrentPlayingFile: (fileName) => {
    const audioFiles = get().selectedFiles.filter(name => {
      const lowerName = name.toLowerCase();
      return ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.m4a', '.wma', '.ape', '.opus', '.ncm', '.qmcflac', '.qmc0', '.qmc1', '.qmc2', '.qmc3', '.qmcogg'].some(ext => lowerName.endsWith(ext));
    });
    const index = audioFiles.indexOf(fileName);
    set({ currentPlayingFile: fileName, currentPlayingIndex: index });
  },
  
  setCurrentPlayingIndex: (index) => {
    const audioFiles = get().selectedFiles.filter(name => {
      const lowerName = name.toLowerCase();
      return ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.m4a', '.wma', '.ape', '.opus', '.ncm', '.qmcflac', '.qmc0', '.qmc1', '.qmc2', '.qmc3', '.qmcogg'].some(ext => lowerName.endsWith(ext));
    });
    if (index >= 0 && index < audioFiles.length) {
      set({ currentPlayingIndex: index, currentPlayingFile: audioFiles[index] });
    }
  },
  
  setFileObjects: (fileMap) => set({ fileObjects: fileMap }),
  
  setLrcFileMap: (lrcMap) => set({ lrcFileMap: lrcMap }),
  
  setSearchQuery: (query) => set({ searchQuery: query }),
  
  setShowFileListPanel: (show) => set({ showFileListPanel: show }),
  
  setPlayMode: (mode) => set({ playMode: mode }),
  
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
    const wasPlaying = fileName === get().currentPlayingFile;
    const currentIndex = get().selectedFiles.indexOf(fileName);
    
    const newSelectedFiles = get().selectedFiles.filter(f => f !== fileName);
    const newFileObjects = new Map(get().fileObjects);
    newFileObjects.delete(fileName);
    
    set({ 
      selectedFiles: newSelectedFiles,
      fileObjects: newFileObjects,
    });
    
    // 如果删除的是当前播放的文件，清空当前播放
    if (wasPlaying) {
      set({ currentPlayingFile: '' });
    }
    
    // 从 IndexedDB 中移除
    playlistManager.deleteTrack(fileName).catch((_err: unknown) => {
      // 删除失败处理
    });
    
    // 通知 Footer 组件更新播放列表
    window.dispatchEvent(new CustomEvent('remove-file-from-playlist', {
      detail: { fileName, wasPlaying, currentIndex, newFileCount: newSelectedFiles.length }
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
    playlistManager.clearAllTracks().catch(_err => {
      // 清理失败处理
    });
    
    // ✅ 通知 Footer 组件清空播放列表并停止播放
    window.dispatchEvent(new CustomEvent('clear-playlist'));
  },
  
  playFile: (fileName) => {
    const file = get().fileObjects.get(fileName);
    if (!file) {
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
    playlistManager.saveTrack({ id, name, fileName, file, lrcFile }).catch(_err => {
      // 保存失败处理
    });
    
    // 触发事件通知 Footer 组件播放该文件
    window.dispatchEvent(new CustomEvent('play-file-from-list', {
      detail: { file, lrcFile }
    }));
  },
  
  // 播放下一首
  playNext: () => {
    const state = get();
    const audioFiles = state.selectedFiles.filter(name => {
      const lowerName = name.toLowerCase();
      return ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.m4a', '.wma', '.ape', '.opus', '.ncm', '.qmcflac', '.qmc0', '.qmc1', '.qmc2', '.qmc3', '.qmcogg'].some(ext => lowerName.endsWith(ext));
    });
    
    if (audioFiles.length === 0) return null;
    
    let nextIndex: number;
    
    if (state.playMode === 2) {
      // 单曲循环
      nextIndex = state.currentPlayingIndex;
    } else if (state.playMode === 1) {
      // 随机播放
      if (audioFiles.length === 1) {
        nextIndex = 0;
      } else {
        do {
          nextIndex = Math.floor(Math.random() * audioFiles.length);
        } while (nextIndex === state.currentPlayingIndex);
      }
    } else {
      // 顺序播放
      nextIndex = (state.currentPlayingIndex + 1) % audioFiles.length;
    }
    
    const nextFileName = audioFiles[nextIndex];
    set({ currentPlayingIndex: nextIndex, currentPlayingFile: nextFileName });
    
    // 触发播放事件
    const file = state.fileObjects.get(nextFileName);
    if (file) {
      const lrcFile = state.lrcFileMap.get(nextFileName);
      window.dispatchEvent(new CustomEvent('play-file-from-list', {
        detail: { file, lrcFile }
      }));
    }
    
    return nextFileName;
  },
  
  // 播放上一首
  playPrevious: () => {
    const state = get();
    const audioFiles = state.selectedFiles.filter(name => {
      const lowerName = name.toLowerCase();
      return ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.m4a', '.wma', '.ape', '.opus', '.ncm', '.qmcflac', '.qmc0', '.qmc1', '.qmc2', '.qmc3', '.qmcogg'].some(ext => lowerName.endsWith(ext));
    });
    
    if (audioFiles.length === 0) return null;
    
    let prevIndex: number;
    
    if (state.playMode === 2) {
      // 单曲循环
      prevIndex = state.currentPlayingIndex;
    } else if (state.playMode === 1) {
      // 随机播放
      if (audioFiles.length === 1) {
        prevIndex = 0;
      } else {
        do {
          prevIndex = Math.floor(Math.random() * audioFiles.length);
        } while (prevIndex === state.currentPlayingIndex);
      }
    } else {
      // 顺序播放
      prevIndex = (state.currentPlayingIndex - 1 + audioFiles.length) % audioFiles.length;
    }
    
    const prevFileName = audioFiles[prevIndex];
    set({ currentPlayingIndex: prevIndex, currentPlayingFile: prevFileName });
    
    // 触发播放事件
    const file = state.fileObjects.get(prevFileName);
    if (file) {
      const lrcFile = state.lrcFileMap.get(prevFileName);
      window.dispatchEvent(new CustomEvent('play-file-from-list', {
        detail: { file, lrcFile }
      }));
    }
    
    return prevFileName;
  },
}));
