/**
 * 播放列表事件监听 Hook
 * 统一管理所有播放列表相关的事件监听器
 */

import { useEffect, useCallback } from 'react';
import type { ITrackInfo } from '../utils/playlist-manager.js';
// import { playlistManager } from '../utils/playlist-manager.js';
import { receiveFile } from '../utils/audio-decoder.js';
import { getBaseName } from '../utils/file-utils.js';
import { audioRef } from '../utils/audiomodule.js';
import { loadMSTrack } from '../utils/playback-control.js';

interface UsePlaylistEventsOptions {
    playlist: ITrackInfo[];
    currentTrackIndex: number;
    showPlaylist: boolean;
    onPreviousTrack: () => void;
    onNextTrack: () => void;
    handleClosePlaylist: () => void;
    setShowPlaylist: React.Dispatch<React.SetStateAction<boolean>>;
    setAudioSrc: (src: string) => void;
    saveTrackToDB: (track: ITrackInfo) => void;
    loadLrcFile: (lrcFile: File) => void;
    updateCurrentTrackName: (index: number, playlist: ITrackInfo[]) => void;
    setPlaylist: React.Dispatch<React.SetStateAction<ITrackInfo[]>>;
    setCurrentTrackIndex: (index: number) => void;
    setSearchQuery: (query: string) => void;
    readAudioFile: (track: any) => Promise<File>;
    readLrcFile: (track: any) => Promise<File | undefined | null>;
}

export const usePlaylistEvents = (options: UsePlaylistEventsOptions) => {
    const {
        playlist,
        currentTrackIndex,
        showPlaylist,
        onPreviousTrack,
        onNextTrack,
        handleClosePlaylist,
        setShowPlaylist,
        setAudioSrc,
        saveTrackToDB,
        loadLrcFile,
        updateCurrentTrackName,
        setPlaylist,
        setCurrentTrackIndex,
        setSearchQuery: _setSearchQuery,
        readAudioFile,
        readLrcFile,
    } = options;

    // 处理切换播放列表显示/隐藏
    const handleTogglePlaylist = useCallback(() => {
        if (showPlaylist) {
            handleClosePlaylist();
        } else {
            setShowPlaylist(true);
        }
    }, [showPlaylist, handleClosePlaylist, setShowPlaylist]);

    // 处理 Header 打开文件事件
    const handleHeaderFileOpen = useCallback((event: Event) => {
        const customEvent = event as CustomEvent<{ file: File }>;
        if (customEvent.detail?.file) {
            const file = customEvent.detail.file;
            receiveFile(file, setAudioSrc);
            
            // 添加到播放列表
            const id = `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
            const name = getBaseName(file.name);
            const track: ITrackInfo = { id, name, fileName: file.name, file };
            setPlaylist(prev => [...prev, track]);
            setCurrentTrackIndex(playlist.length);
        }
    }, [playlist.length, setPlaylist, setCurrentTrackIndex, setAudioSrc]);

    // 处理 MS 播放列表
    const handleMSPlaylist = useCallback(async (event: Event) => {
        
        try {
            const customEvent = event as CustomEvent<{ 
                tracks: any[];
                currentIndex: number;
                folderPaths: string[];
            }>;
            
            if (!customEvent.detail?.tracks || customEvent.detail.currentIndex === undefined) {
                return;
            }
            
            
            // ✅ 保存整个音轨列表到临时变量
            (window as any).__msTracks = customEvent.detail.tracks;
            (window as any).__msCurrentIndex = customEvent.detail.currentIndex;
            
            // ✅ 使用 loadMSTrack 统一处理（支持 ExoPlayer）
            
            // ✅ 创建真正的 setDisplayTrackName 函数，更新全局变量和 Header 显示
            const setDisplayTrackName = (name: string) => {
                // ✅ 保存到全局变量（供其他组件访问）
                (window as any).__currentTrackName = name;
                (window as any).__currentArtistName = '';
                // ✅ 触发 audio-file-update 事件，通知 footer 更新显示
                window.dispatchEvent(new CustomEvent('audio-file-update', {
                    detail: { trackName: name }
                }));
            };
            
            await loadMSTrack(
                customEvent.detail.tracks,
                customEvent.detail.currentIndex,
                readAudioFile,
                readLrcFile,
                loadLrcFile,
                setDisplayTrackName
            );
            
        } catch (error) {
            alert('加载失败:' + (error instanceof Error ? error.message : '未知错误'));
        }
    }, [readAudioFile, readLrcFile, loadLrcFile, updateCurrentTrackName]);

    // 处理从文件列表播放
    const handlePlayFileFromList = useCallback((event: Event) => {
        const customEvent = event as CustomEvent<{ file: File; lrcFile?: File }>;
        if (customEvent.detail?.file) {
            const file = customEvent.detail.file;
            const lrcFile = customEvent.detail.lrcFile;
            
            setPlaylist(prevPlaylist => {
                // 检查文件是否已在播放列表中
                const trackIndex = prevPlaylist.findIndex(track => track.fileName === file.name);
                
                if (trackIndex !== -1) {
                    // 文件已存在,直接切换到该歌曲
                    setCurrentTrackIndex(trackIndex);
                    receiveFile(prevPlaylist[trackIndex].file!, setAudioSrc);
                    
                    // 自动播放
                    setTimeout(() => {
                        audioRef.current?.play();
                    }, 200);
                    
                    // 优先使用传入的 LRC 文件
                    const lrcToLoad = lrcFile || prevPlaylist[trackIndex].lrcFile;
                    if (lrcToLoad) {
                        loadLrcFile(lrcToLoad);
                    }
                    
                    // 更新 Header 显示的歌名
                    updateCurrentTrackName(trackIndex, prevPlaylist);
                } else {
                    // 文件不存在,添加到播放列表并播放
                    const id = `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
                    const name = getBaseName(file.name);
                    const track: ITrackInfo = { id, name, fileName: file.name, file, lrcFile };
                    const newIndex = prevPlaylist.length;
                    
                    saveTrackToDB(track);
                    setCurrentTrackIndex(newIndex);
                    
                    // 加载音频并播放
                    receiveFile(file, setAudioSrc);
                    setTimeout(() => {
                        audioRef.current?.play();
                    }, 200);
                    
                    // 如果有 LRC 文件,加载歌词
                    if (lrcFile) {
                        loadLrcFile(lrcFile);
                    }
                    
                    // 更新 Header 显示的歌名
                    updateCurrentTrackName(newIndex, [...prevPlaylist, track]);
                    
                    return [...prevPlaylist, track];
                }
                
                return prevPlaylist;
            });
        }
    }, [saveTrackToDB, loadLrcFile, updateCurrentTrackName, setPlaylist, setCurrentTrackIndex]);

    // 处理轨道索引变化
    const handleTrackIndexChange = useCallback((event: Event) => {
        const customEvent = event as CustomEvent<{ index: number }>;
        if (customEvent.detail?.index !== undefined) {
            setCurrentTrackIndex(customEvent.detail.index);
        }
    }, [setCurrentTrackIndex]);

    // 处理播放模式变化
    const handlePlayModeChange = useCallback((event: Event) => {
        const customEvent = event as CustomEvent<{ playMode: number }>;
        if (customEvent.detail?.playMode !== undefined) {
            window.dispatchEvent(new CustomEvent('play-mode-updated', { 
                detail: { playMode: customEvent.detail.playMode } 
            }));
        }
    }, []);

    // 处理添加文件到播放列表
    const handleAddFilesToPlaylist = useCallback((event: Event) => {
        const customEvent = event as CustomEvent<{ tracks: Array<{ file: File; lrcFile?: File }> }>;
        if (!customEvent.detail?.tracks || customEvent.detail.tracks.length === 0) {
            return;
        }
        
        const { tracks } = customEvent.detail;
        
        setPlaylist(prev => {
            const newTracks: ITrackInfo[] = tracks.map(({ file, lrcFile }) => {
                const id = `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
                const name = getBaseName(file.name);
                
                // 保存到 IndexedDB
                saveTrackToDB({ id, name, fileName: file.name, file, lrcFile });
                
                return { id, name, fileName: file.name, file, lrcFile };
            });
            
            const updated = [...prev, ...newTracks];
            
            // 如果当前没有播放,自动播放第一首新添加的歌曲
            if (currentTrackIndex === -1 && newTracks.length > 0) {
                const firstTrack = newTracks[0];
                const file = firstTrack.file;
                if (file) {
                    setTimeout(() => {
                        setCurrentTrackIndex(prev.length);
                        receiveFile(file, setAudioSrc);
                        
                        setTimeout(() => {
                            audioRef.current?.play();
                        }, 200);
                        
                        if (firstTrack.lrcFile) {
                            window.dispatchEvent(new CustomEvent('load-lrc-file', {
                                detail: { lrcFile: firstTrack.lrcFile }
                            }));
                        }
                    }, 0);
                }
            }
            
            return updated;
        });
    }, [currentTrackIndex, saveTrackToDB, setPlaylist, setCurrentTrackIndex]);

    // 处理从播放列表删除文件
    const handleRemoveFileFromPlaylist = useCallback((event: Event) => {
        const customEvent = event as CustomEvent<{ fileName: string }>;
        if (!customEvent.detail?.fileName) {
            return;
        }
        
        const { fileName } = customEvent.detail;
        
        setPlaylist(prev => {
            const index = prev.findIndex(track => track.fileName === fileName);
            if (index === -1) {
                return prev;
            }
            
            const newPlaylist = prev.filter(track => track.fileName !== fileName);
            
            if (index === currentTrackIndex) {
                setCurrentTrackIndex(-1);
                setAudioSrc('');
            } else if (index < currentTrackIndex) {
                setCurrentTrackIndex(currentTrackIndex - 1);
            }
            
            return newPlaylist;
        });
    }, [currentTrackIndex, setPlaylist, setCurrentTrackIndex]);

    // 注册所有事件监听器
    useEffect(() => {
        window.addEventListener('toggle-playlist', handleTogglePlaylist);
        window.addEventListener('previous-track', onPreviousTrack);
        window.addEventListener('next-track', onNextTrack);
        window.addEventListener('header-file-open' as any, handleHeaderFileOpen as any);
        window.addEventListener('play-file-from-list' as any, handlePlayFileFromList as any);
        window.addEventListener('play-ms-playlist' as any, handleMSPlaylist as any);
        window.addEventListener('track-index-change' as any, handleTrackIndexChange as any);
        window.addEventListener('play-mode-change' as any, handlePlayModeChange as any);
        window.addEventListener('add-files-to-playlist' as any, handleAddFilesToPlaylist as any);
        window.addEventListener('remove-file-from-playlist' as any, handleRemoveFileFromPlaylist as any);

        return () => {
            window.removeEventListener('toggle-playlist', handleTogglePlaylist);
            window.removeEventListener('previous-track', onPreviousTrack);
            window.removeEventListener('next-track', onNextTrack);
            window.removeEventListener('header-file-open' as any, handleHeaderFileOpen as any);
            window.removeEventListener('play-file-from-list' as any, handlePlayFileFromList as any);
            window.removeEventListener('play-ms-playlist' as any, handleMSPlaylist as any);
            window.removeEventListener('track-index-change' as any, handleTrackIndexChange as any);
            window.removeEventListener('play-mode-change' as any, handlePlayModeChange as any);
            window.removeEventListener('add-files-to-playlist' as any, handleAddFilesToPlaylist as any);
            window.removeEventListener('remove-file-from-playlist' as any, handleRemoveFileFromPlaylist as any);
        };
    }, [
        handleTogglePlaylist,
        onPreviousTrack,
        onNextTrack,
        handleHeaderFileOpen,
        handlePlayFileFromList,
        handleMSPlaylist,
        handleTrackIndexChange,
        handlePlayModeChange,
        handleAddFilesToPlaylist,
        handleRemoveFileFromPlaylist
    ]);
};
