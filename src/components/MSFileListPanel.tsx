import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AudioFileAdapter } from '../utils/audio-file-adapter.js';
import { isAndroidNative } from '../utils/platform-detector.js';
import type { AudioTrack } from '../utils/mediastore-plugin.js';
import { MediaStore } from '../utils/mediastore-plugin.js';
import { FilePicker } from '@capawesome/capacitor-file-picker';
import { Preferences } from '@capacitor/preferences';
import './MSFileListPanel.css';

// ✅ 扩展 AudioTrack，添加文件夹路径信息
interface TrackWithFolder extends AudioTrack {
  folderPath?: string; // 所属文件夹路径
}

interface IMSFileListPanelProps {
  onPlayTrack: (trackIndex: number) => void;
  onClose: () => void;
  lang?: any; // ✅ 多语言支持
}

export const MSFileListPanel: React.FC<IMSFileListPanelProps> = ({
  onPlayTrack,
  onClose,
  lang,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const [isHiding, setIsHiding] = useState(false);
  const [tracks, setTracks] = useState<TrackWithFolder[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [currentPlayingFile, setCurrentPlayingFile] = useState<string>('');
  const [selectedFolders, setSelectedFolders] = useState<string[]>([]);
  const [selectedFolderTracks, setSelectedFolderTracks] = useState<number[]>([]); // ✅ 保存每个文件夹的歌曲数量
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set()); // ✅ 记录折叠的文件夹
  const [hoveredTrackIndex, setHoveredTrackIndex] = useState<number | null>(null); // ✅ 跟踪悬停的歌曲
  const [isInitialLoad, setIsInitialLoad] = useState(true); // ✅ 标记是否正在初始加载
  const [searchQuery, setSearchQuery] = useState(''); // ✅ 搜索关键词
  
  // ✅ 播放列表持久化存储键名
  const PLAYLIST_TRACKS_KEY = 'ms_playlist_tracks';
  const PLAYLIST_FOLDERS_KEY = 'ms_playlist_folders';
  
  // 只在 Android 原生环境中渲染
  if (!isAndroidNative()) {
    return null;
  }
  
  // 扫描音乐文件夹（支持单个或多个文件夹）
  const scanFolder = async (folderPaths?: string | string[]) => {
    setIsScanning(true);
    try {
      let allTracks: AudioTrack[] = [];
      let folderTrackCounts: number[] = [];
      
      if (!folderPaths) {
        // ✅ 如果没有传入参数，扫描 selectedFolders 中的所有文件夹
        if (selectedFolders.length === 0) {
          // ✅ 如果没有已选文件夹，不扫描任何音乐，显示空状态
          allTracks = [];
          folderTrackCounts = [];
        } else {
          // ✅ 扫描所有已选文件夹
          for (const folderPath of selectedFolders) {
            // SAF URI 转换
            let realPath = folderPath;
            if (folderPath.startsWith('content://com.android.externalstorage.documents/tree/')) {
              const decoded = decodeURIComponent(folderPath);
              const match = decoded.match(/primary:(.+)$/);
              if (match) {
                realPath = '/storage/emulated/0/' + match[1];
              }
            }
            
            const folderTracks = await AudioFileAdapter.loadAudioFiles(realPath);
            // ✅ 为每个音轨添加 folderPath
            const tracksWithFolder = folderTracks.map(track => ({ ...track, folderPath }));
            allTracks = [...allTracks, ...tracksWithFolder];
            folderTrackCounts.push(folderTracks.length);
          }
        }
      } else if (typeof folderPaths === 'string') {
        // 单个文件夹
        const audioTracks = await AudioFileAdapter.loadAudioFiles(folderPaths);
        allTracks = audioTracks.map(track => ({ ...track, folderPath: folderPaths }));
        folderTrackCounts = [audioTracks.length];
      } else {
        // 多个文件夹
        for (const folderPath of folderPaths) {
          let realPath = folderPath;
          if (folderPath.startsWith('content://com.android.externalstorage.documents/tree/')) {
            const decoded = decodeURIComponent(folderPath);
            const match = decoded.match(/primary:(.+)$/);
            if (match) {
              realPath = '/storage/emulated/0/' + match[1];
            }
          }
          
          const folderTracks = await AudioFileAdapter.loadAudioFiles(realPath);
          // ✅ 为每个音轨添加 folderPath
          const tracksWithFolder = folderTracks.map(track => ({ ...track, folderPath }));
          allTracks = [...allTracks, ...tracksWithFolder];
          folderTrackCounts.push(folderTracks.length);
        }
      }
      
      setTracks(allTracks);
      setSelectedFolderTracks(folderTrackCounts); // ✅ 保存每个文件夹的歌曲数量
    } catch (error) {
      // 扫描失败处理
    } finally {
      setIsScanning(false);
    }
  };
  
  // 刷新媒体库
  // ✅ 授权按钮 - 触发 MediaStore 查询以请求权限
  const refreshLibrary = async () => {
    setIsScanning(true);
    try {
      // 调用 scanAudioFiles 会触发系统权限请求
      const result = await MediaStore.scanAudioFiles();
        
      if (result.count === 0) {
        alert(lang?.msPlaylist?.noFilesFound || '未找到音频文件\n\n请检查：\n1. 是否已授予存储权限\n2. Music 文件夹中是否有音频文件');
      } else {
        alert(lang?.msPlaylist?.authSuccess || '授权成功！');
      }
    } catch (error) {
      alert(lang?.msPlaylist?.authFailed || '授权失败，请手动在系统设置中授予存储权限');
    } finally {
      setIsScanning(false);
    }
  };
  
  // 添加文件夹 - 让用户选择指定文件夹
  const handleAddFolder = async () => {
    try {
      const result = await FilePicker.pickDirectory();
      
      if (result.path) {
        // ✅ SAF URI 转换（参考 ANDROID-MEDIASTORE-DEBUG-GUIDE.md 第 543-558 行）
        let realFolderPath = result.path;
        if (result.path.startsWith('content://com.android.externalstorage.documents/tree/')) {
          const decoded = decodeURIComponent(result.path);
          const match = decoded.match(/primary:(.+)$/);
          if (match) {
            realFolderPath = '/storage/emulated/0/' + match[1];
          }
        }
        
        // 添加到已选文件夹列表（使用原始 URI）
        const newSelectedFolders = [...selectedFolders];
        if (!newSelectedFolders.includes(result.path)) {
          newSelectedFolders.push(result.path);
          setSelectedFolders(newSelectedFolders);
        }
        
        // ✅ 关键修复：添加文件夹后，扫描所有已选文件夹
        setIsScanning(true);
        try {
          let allTracks: AudioTrack[] = [];
          let folderTrackCounts: number[] = [];
          
          for (const folderPath of newSelectedFolders) {
            let realPath = folderPath;
            if (folderPath.startsWith('content://com.android.externalstorage.documents/tree/')) {
              const decoded = decodeURIComponent(folderPath);
              const match = decoded.match(/primary:(.+)$/);
              if (match) {
                realPath = '/storage/emulated/0/' + match[1];
              }
            }
            
            const folderTracks = await AudioFileAdapter.loadAudioFiles(realPath);
            // ✅ 为每个音轨添加 folderPath
            const tracksWithFolder = folderTracks.map(track => ({ ...track, folderPath }));
            allTracks = [...allTracks, ...tracksWithFolder];
            folderTrackCounts.push(folderTracks.length);
          }
          
          setTracks(allTracks);
          setSelectedFolderTracks(folderTrackCounts);
          
          alert((lang?.msPlaylist?.scanCompleted || '扫描完成！找到 {count} 首歌曲').replace('{count}', allTracks.length));
        } catch (error) {
          alert(lang?.msPlaylist?.scanFailed || '扫描失败，请检查权限');
        } finally {
          setIsScanning(false);
        }
      }
    } catch (error) {
      alert(lang?.msPlaylist?.scanFailed || '扫描失败，请检查权限');
      setIsScanning(false);
    }
  };
  
  // 移除文件夹
  const handleRemoveFolder = (folderPath: string) => {
    if (!confirm(lang?.msPlaylist?.confirmRemoveFolder || '确定要移除此文件夹吗？')) {
      return;
    }
    setSelectedFolders(prev => prev.filter(p => p !== folderPath));
    // ✅ 重新扫描剩余文件夹（会自动使用 updated selectedFolders）
    setTimeout(() => scanFolder(), 100);
  };
  
  // ✅ 从文件夹路径提取显示名称
  const getFolderDisplayName = (folderPath: string): string => {
    try {
      // 处理 content:// URI
      if (folderPath.startsWith('content://com.android.externalstorage.documents/tree/')) {
        const decoded = decodeURIComponent(folderPath);
        const match = decoded.match(/primary:(.+)$/);
        if (match) {
          // 返回最后一级文件夹名称
          const pathParts = match[1].split('/');
          return pathParts[pathParts.length - 1] || (lang?.msPlaylist?.unknownFolder || '未知文件夹');
        }
      }
      // 处理普通文件路径
      const parts = folderPath.split('/');
      if (parts.length >= 2) {
        return parts[parts.length - 1]; // 返回最后一级文件夹名
      }
      return folderPath; // 如果无法解析，返回原路径
    } catch (error) {
      return lang?.msPlaylist?.unknownFolder || '未知文件夹';
    }
  };
  
  // ✅ 按文件夹分组音轨（同时保留 folderPath）
  const groupTracksByFolder = (tracks: TrackWithFolder[]): Map<string, { tracks: TrackWithFolder[], folderPath: string }> => {
    const grouped = new Map<string, { tracks: TrackWithFolder[], folderPath: string }>();
    
    tracks.forEach(track => {
      // ✅ 使用实际的 folderPath，而不是从 filePath 推断
      const folderPath = track.folderPath || (lang?.msPlaylist?.unknownFolder || '未知文件夹');
      const folderName = getFolderDisplayName(folderPath);
      
      if (!grouped.has(folderName)) {
        grouped.set(folderName, { tracks: [], folderPath });
      }
      grouped.get(folderName)!.tracks.push(track);
    });
    
    return grouped;
  };
  
  // ✅ 过滤后的音轨列表（根据搜索关键词）
  const filteredTracks = searchQuery
    ? tracks.filter(track => {
        const trackName = (track.name || track.fileName || '').toLowerCase();
        return trackName.includes(searchQuery.toLowerCase());
      })
    : tracks;
  
  // ✅ 切换文件夹折叠状态
  const toggleFolderCollapse = (folderName: string) => {
    setCollapsedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderName)) {
        newSet.delete(folderName); // 展开
      } else {
        newSet.add(folderName); // 折叠
      }
      return newSet;
    });
  };
  
  // ✅ 删除文件夹
  const handleDeleteFolder = (folderPath: string, folderName: string) => {
    if (!confirm((lang?.msPlaylist?.confirmRemoveFolderWithName || '确定要移除文件夹「{name}」吗？').replace('{name}', folderName))) {
      return;
    }
    
    // ✅ 计算移除后的新文件夹列表
    const newFolders = selectedFolders.filter(p => p !== folderPath);
    
    // 更新状态
    setSelectedFolders(newFolders);
    
    // 如果移除了所有文件夹，清除持久化存储和 tracks
    if (newFolders.length === 0) {
      Preferences.remove({ key: PLAYLIST_FOLDERS_KEY });
      setTracks([]);
    } else {
      // ✅ 直接传入新的文件夹列表进行扫描，不依赖状态
      scanFolder(newFolders);
    }
  };
  
  // ✅ 删除单首歌曲
  const handleDeleteTrack = async (trackToDelete: TrackWithFolder) => {
    if (!confirm((lang?.msPlaylist?.confirmRemoveTrack || '确定要移除歌曲「{name}」吗？').replace('{name}', trackToDelete.name || trackToDelete.fileName))) {
      return;
    }
    
    // 从 tracks 中移除该歌曲
    const newTracks = tracks.filter(t => t !== trackToDelete);
    setTracks(newTracks);
    
    // ✅ 立即更新持久化存储
    try {
      await Preferences.set({
        key: PLAYLIST_TRACKS_KEY,
        value: JSON.stringify(newTracks)
      });
    } catch (error) {
      // 更新存储失败处理
    }
  };
  
  // 播放音轨
  const handlePlayTrack = async (track: TrackWithFolder) => {
    setCurrentPlayingFile(track.name || '');
    
    // ✅ 找到当前点击的歌曲索引
    const currentIndex = tracks.findIndex(t => t.id === track.id);
    
    // ✅ 发送自定义事件，传递整个音轨列表（AudioTrack[]）和当前索引
    // footer 会在需要时动态加载音频文件
    window.dispatchEvent(new CustomEvent('play-ms-playlist', {
      detail: { 
        tracks: tracks,  // 传递 AudioTrack 元数据，而不是 File 对象
        currentIndex: currentIndex,
        folderPaths: selectedFolders  // 传递文件夹路径，用于后续扫描
      }
    }));
    
    // ✅ 不再自动关闭面板，让用户可以继续选择其他歌曲
    // onClose();
  };
  
  // ✅ 保存播放列表到 Preferences
  const savePlaylist = useCallback(async () => {
    try {
      // ✅ 如果没有文件夹，清除所有持久化数据
      if (selectedFolders.length === 0) {
        await Preferences.remove({ key: PLAYLIST_TRACKS_KEY });
        await Preferences.remove({ key: PLAYLIST_FOLDERS_KEY });
        return;
      }
      
      // 保存音轨列表
      await Preferences.set({
        key: PLAYLIST_TRACKS_KEY,
        value: JSON.stringify(tracks)
      });
      
      // 保存文件夹列表
      await Preferences.set({
        key: PLAYLIST_FOLDERS_KEY,
        value: JSON.stringify(selectedFolders)
      });
    } catch (error) {
      // 保存播放列表失败处理
    }
  }, [tracks, selectedFolders]);
  
  // ✅ 从 Preferences 加载播放列表
  const loadPlaylist = useCallback(async () => {
    try {
      // ✅ 先尝试加载保存的 tracks 数据
      const tracksResult = await Preferences.get({ key: PLAYLIST_TRACKS_KEY });
      const foldersResult = await Preferences.get({ key: PLAYLIST_FOLDERS_KEY });
      
      if (foldersResult.value) {
        const loadedFolders: string[] = JSON.parse(foldersResult.value);
        setSelectedFolders(loadedFolders);
        
        // ✅ 如果有保存的 tracks 数据，直接使用
        if (tracksResult.value) {
          const loadedTracks: TrackWithFolder[] = JSON.parse(tracksResult.value);
          setTracks(loadedTracks);
        } else {
          // ✅ 没有保存的 tracks，才重新扫描文件夹
          setTimeout(() => {
            if (loadedFolders.length > 0) {
              scanFolder(loadedFolders);
            } else {
              setTracks([]);
              Preferences.remove({ key: PLAYLIST_TRACKS_KEY });
            }
          }, 100);
        }
      } else {
        // ✅ 没有保存的文件夹，清空
        setTracks([]);
        setSelectedFolders([]);
      }
    } catch (error) {
      // 加载播放列表失败处理
    } finally {
      // ✅ 加载完成后，允许自动保存逻辑执行
      setIsInitialLoad(false);
    }
  }, []);
  
  // ✅ 移除自动扫描，只有用户添加文件夹后才加载歌曲
  // useEffect(() => {
  //   scanFolder();
  // }, []);
  
  // ✅ 组件挂载时加载保存的播放列表
  useEffect(() => {
    loadPlaylist();
  }, []);
  
  // ✅ 当 tracks 或 selectedFolders 变化时自动保存
  useEffect(() => {
    // ✅ 初始加载时不执行自动保存/清除逻辑
    if (isInitialLoad) {
      return;
    }
    
    // ✅ 如果没有文件夹，清除所有持久化数据
    if (selectedFolders.length === 0) {
      Preferences.remove({ key: PLAYLIST_TRACKS_KEY });
      Preferences.remove({ key: PLAYLIST_FOLDERS_KEY });
      return;
    }
    
    // ✅ 有文件夹时才保存
    if (tracks.length > 0) {
      const saveData = async () => {
        try {
          await Preferences.set({
            key: PLAYLIST_TRACKS_KEY,
            value: JSON.stringify(tracks)
          });
          await Preferences.set({
            key: PLAYLIST_FOLDERS_KEY,
            value: JSON.stringify(selectedFolders)
          });
        } catch (error) {
          // 自动保存失败处理
        }
      };
      saveData();
    }
  }, [tracks, selectedFolders, isInitialLoad]);
  
  // ✅ 点击面板外部区域时关闭面板（带动画）
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // ✅ 如果面板正在隐藏，不处理点击事件
      if (isHiding) {
        return;
      }
      
      const target = event.target as Node;
      
      const isInside = panelRef.current ? panelRef.current.contains(target) : false;
      
      // 如果点击的不是面板区域，关闭面板
      if (!isInside) {
        closePanel();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []); // ✅ 只在组件挂载时执行一次
  
  // 关闭面板（带动画）
  const closePanel = useCallback(() => {
    setIsHiding(true);
    // 等待淡出动画完成后关闭
    setTimeout(() => {
      onClose();
    }, 300); // 与 CSS 动画时间一致
  }, [onClose, isHiding]);
  
  // ✅ 阻止 mousedown 事件冒泡，避免触发外部点击关闭
  const preventMouseDownPropagation = (e: React.MouseEvent) => {
    e.stopPropagation();
  };
  
  return (
    <>
      {/* ✅ 定义 fadeIn 动画 */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 0.7; }
        }
      `}</style>
      
      <div className={`ms-selected-files-panel${isHiding ? ' menu-hiding' : ''}`} ref={panelRef}>
      {/* 面板头部 */}
      <div className="panel-header" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* 标题 */}
        <span style={{ fontWeight: 'bold', fontSize: '1.35rem', color: '#fff', flexShrink: 0 }}>
          {lang?.msPlaylist?.title || '播放列表'}
        </span>
        
        {/* ✅ 搜索框 - 放在标题右边 */}
        <div className="ms-search-box-header" style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: 0 }}>
          <input
            type="text"
            className="ms-search-input-header"
            placeholder={lang?.msPlaylist?.searchPlaceholder || '搜索歌曲...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              padding: '4px 8px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '4px',
              background: 'rgba(255, 255, 255, 0.1)',
              color: '#eeeeee',
              fontSize: '1.35rem',
              outline: 'none',
              width: '100%',
              maxWidth: '200px',
            }}
          />
          {searchQuery && (
            <button
              className="ms-search-clear-header"
              onClick={() => setSearchQuery('')}
              onMouseDown={(e) => e.stopPropagation()}
              title={lang?.msPlaylist?.clearSearch || '清除搜索'}
              style={{
                background: 'none',
                border: 'none',
                color: '#fff',
                fontSize: '0.9rem',
                cursor: 'pointer',
                padding: '2px 4px',
                borderRadius: '3px',
                opacity: 0.7,
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                e.currentTarget.style.opacity = '1';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.opacity = '0.7';
              }}
            >
              ✕
            </button>
          )}
        </div>
        
        <button 
          className="close-files-btn"
          onClick={onClose}
          onMouseDown={preventMouseDownPropagation}
          title="关闭"
          style={{
            background: 'transparent',
            border: 'none',
            color: '#fff',
            fontSize: '1.5rem',
            cursor: 'pointer',
            padding: '5px 10px',
            flex: '0 0 auto',
          }}
        >
          ✕
        </button>
      </div>
      
      {/* 播放列表页面 - 歌曲列表 */}
      <div className="folders-view" style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto', padding: '10px' }}>
          {/* ✅ 在文件夹列表上方添加操作按钮 */}
          <div className="folder-actions" style={{ 
            display: 'flex', 
            justifyContent: 'center',
            gap: '12px', 
            marginBottom: '15px',
            flexWrap: 'wrap',
          }}>
            <button 
              className="scanner-btn authorize-btn"
              onClick={refreshLibrary}
              onMouseDown={preventMouseDownPropagation}
              disabled={isScanning}
              style={{
                padding: '6px 12px',
                background: isScanning ? 'rgba(255, 255, 255, 0.05)' : 'rgba(76, 175, 80, 0.2)',
                color: isScanning ? '#999' : '#4CAF50',
                border: '1px solid rgba(76, 175, 80, 0.3)',
                borderRadius: '6px',
                cursor: isScanning ? 'not-allowed' : 'pointer',
                fontSize: '1.35rem',
                fontWeight: '500',
              }}
            >
              {isScanning ? (lang?.msPlaylist?.scanning || '扫描中...') : (lang?.msPlaylist?.authorize || '授权')}
            </button>
            <button 
              className="scanner-btn add-folder-btn"
              onClick={handleAddFolder}
              onMouseDown={preventMouseDownPropagation}
              style={{
                padding: '6px 12px',
                background: 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '1.35rem',
                fontWeight: '500',
              }}
            >
              {lang?.msPlaylist?.addFolder || '添加文件夹'}
            </button>
            <button 
              className="scanner-btn rescan-btn"
              onClick={() => scanFolder()}
              onMouseDown={preventMouseDownPropagation}
              disabled={isScanning || selectedFolders.length === 0}
              title={selectedFolders.length === 0 ? (lang?.msPlaylist?.addFolderFirst || '请先添加文件夹') : (lang?.msPlaylist?.rescanSelectedFolders || '重新扫描已选文件夹')}
              style={{
                padding: '6px 12px',
                background: isScanning ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.1)',
                color: isScanning ? '#999' : 'white',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '6px',
                cursor: isScanning ? 'not-allowed' : 'pointer',
                fontSize: '1.35rem',
                fontWeight: '500',
              }}
            >
              {isScanning ? (lang?.msPlaylist?.scanning || '扫描中...') : (lang?.msPlaylist?.rescan || '重新扫描')}
            </button>
          </div>
          
          {tracks.length === 0 ? (
            <div className="empty-state" style={{ textAlign: 'center', padding: '40px 20px', color: '#999' }}>
              <p style={{ fontSize: '1.2rem', marginBottom: '10px' }}>{lang?.msPlaylist?.noAudioFiles || '未找到音频文件'}</p>
              <p className="hint" style={{ fontSize: '0.9rem' }}>{lang?.msPlaylist?.authThenAddFolder || '请先点击“授权”按钮，然后“添加文件夹”'}</p>
            </div>
          ) : (
            <div className="folder-groups">
              {(() => {
                // ✅ 按文件夹分组（使用过滤后的音轨）
                const groupedTracks = groupTracksByFolder(filteredTracks);
                              
                return Array.from(groupedTracks.entries()).map(([folderName, folderData]) => {
                  const { tracks: folderTracks, folderPath } = folderData;
                  const isCollapsed = collapsedFolders.has(folderName);
                                
                  return (
                    <div key={folderName} className="folder-group" style={{ marginBottom: '20px' }}>
                      {/* 文件夹标题 */}
                      <div 
                        className="folder-header"
                        onClick={() => toggleFolderCollapse(folderName)}
                        onMouseDown={(e) => e.stopPropagation()}
                        onMouseEnter={() => setHoveredTrackIndex(-1)} // ✅ 使用特殊索引标记文件夹悬停
                        onMouseLeave={() => setHoveredTrackIndex(null)}
                        style={{
                          padding: '8px 10px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          borderRadius: isCollapsed ? '8px' : '8px 8px 0 0',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          transition: 'background-color 0.2s ease',
                        }}
                      >
                        <span style={{ fontSize: '1.2rem' }}>{isCollapsed ? '▶' : '▼'}</span>
                        <span style={{ fontSize: '1.35rem', fontWeight: 'bold', flex: 1 }}>
                          {folderName}
                        </span>
                        <span style={{ fontSize: '0.9rem', color: '#999' }}>
                          ({folderData.tracks.length}{lang?.msPlaylist?.tracksCount || '首歌曲'})
                        </span>
                        {/* 删除按钮 - 仅在折叠时显示 */}
                        {isCollapsed && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteFolder(folderPath, folderName);
                            }}
                            onMouseDown={(e) => e.stopPropagation()}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#fff',
                              fontSize: '1.2rem',
                              cursor: 'pointer',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              transition: 'background-color 0.2s ease',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                            
                      {/* 歌曲列表 */}
                      {!isCollapsed && (
                        <ul className="selected-files-list" style={{ 
                          listStyle: 'none', 
                          padding: 0, 
                          margin: 0,
                          background: 'rgba(255, 255, 255, 0.02)',
                          borderRadius: '0 0 8px 8px',
                        }}>
                          {folderData.tracks.map((track, index) => {
                            const isPlaying = track.name === currentPlayingFile;
                                  
                            return (
                              <li 
                                key={index} 
                                className={`selected-file-item ${isPlaying ? 'playing' : ''}`}
                                style={{
                                  background: isPlaying ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                                  borderLeft: isPlaying ? '3px solid rgba(255, 255, 255, 0.3)' : '3px solid transparent',
                                  padding: '8px 12px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  transition: 'background-color 0.2s ease',
                                  cursor: 'pointer',
                                }}
                                onClick={() => handlePlayTrack(track)}
                                onMouseDown={(e) => {
                                  // ✅ 阻止 mousedown 事件冒泡，避免触发外部点击关闭
                                  e.stopPropagation();
                                }}
                                onMouseEnter={() => setHoveredTrackIndex(index)}
                                onMouseLeave={() => setHoveredTrackIndex(null)}
                              >
                                <div className="file-name-wrapper" style={{ flex: 1, overflow: 'hidden', position: 'relative', width: '100%' }}>
                                  <span 
                                    className="file-name file-name-marquee" 
                                    title={track.name || track.fileName}
                                    style={{
                                      flex: 1,
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                      fontSize: isPlaying ? '1.5rem' : '1.2rem',
                                      color: '#eeeeee',
                                      display: 'block',
                                      minWidth: 0,
                                      fontWeight: isPlaying ? 'bold' : 'normal',
                                    }}
                                  >
                                    {track.name || track.fileName || (lang?.msPlaylist?.unknownFile || '未知文件')}
                                  </span>
                                </div>
                                {/* 删除按钮 - 悬停时显示 */}
                                {hoveredTrackIndex === index && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteTrack(track);
                                    }}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      color: '#fff',
                                      fontSize: '0.9rem',
                                      cursor: 'pointer',
                                      padding: '2px 4px',
                                      borderRadius: '3px',
                                      transition: 'all 0.15s ease',
                                      opacity: 0.7,
                                      flexShrink: 0,
                                      lineHeight: 1,
                                      animation: 'fadeIn 0.15s ease',
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                                      e.currentTarget.style.opacity = '1';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.backgroundColor = 'transparent';
                                      e.currentTarget.style.opacity = '0.7';
                                    }}
                                  >
                                    ✕
                                  </button>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  );
                });
              })()}
            </div>
          )}
        </div>
      
      {/* 面板底部 */}
      <div className="panel-footer" style={{ padding: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.1)', textAlign: 'center', color: '#999', fontSize: '0.85rem' }}>
        <span>{(lang?.msPlaylist?.totalTracks || '共 {count} 首歌曲').replace('{count}', filteredTracks.length)}</span>
      </div>
    </div>
    </>
  );
};
