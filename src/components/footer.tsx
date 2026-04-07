import SSK from "#const/session_key.json" assert { type: "json" };
import { useCallback, useContext, useEffect, useReducer, useRef, useState, useMemo } from "react";
import { useKeyBindings } from "../hooks/useKeyBindings.js";
import { AudioActionType, audioRef, audioStatePubSub, currentTimePubSub } from "../utils/audiomodule.js";
import { InputAction } from "../utils/input-action.js";
import { isKeyboardElement } from "../utils/is-keyboard-element.js";
import { getMatchedAction } from "../utils/keybindings.js";
import { appContext, ChangBits } from "./app.context.js";
import { LrcAudio } from "./audio.js";
import { LoadAudio, nec } from "./loadaudio.js";
import { CloseSVG, FolderSVG, SearchSVG, DeleteSVG } from "./svg.js";
import { toastPubSub } from "./toast.js";
import { playlistManager, type ITrackInfo } from "../utils/playlist-manager.js";

// 播放列表曲目信息
// 已从 ../utils/playlist-manager.js 导入

// 跨平台兼容的文件类型定义
// 仅使用扩展名，避免 iOS/Android 对 MIME 类型的不同处理
const accept = [
    // 歌词文件
    ".lrc", ".txt",
    // 音频文件
    ".mp3", ".wav", ".aac", ".m4a", ".flac", ".ogg", ".wma", ".ape", ".aiff", ".alac",
    // 加密格式
    ".ncm", ".qmcflac", ".qmc0", ".qmc1", ".qmc2", ".qmc3", ".qmcogg"
].join(", ");

// 从文件名获取基础名称（不含扩展名）
const getBaseName = (fileName: string): string => {
    return fileName.replace(/\.[^.]+$/, '');
};

// 查找同名的 LRC 文件
const findMatchingLrcFile = (audioFileName: string, files: FileList | File[]): File | null => {
    const audioBaseName = getBaseName(audioFileName).toLowerCase();
    
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.name.toLowerCase().endsWith('.lrc')) {
            const lrcBaseName = getBaseName(file.name).toLowerCase();
            if (lrcBaseName === audioBaseName) {
                return file;
            }
        }
    }
    
    return null;
};

export const Footer: React.FC = () => {
    const { prefState, lang } = useContext(appContext, ChangBits.lang | ChangBits.builtInAudio);
    const keyBindings = useKeyBindings();
    
    // 检查当前路由，如果是 player-soundtouch 页面则不显示 Footer
    const [shouldShow, setShouldShow] = useState(() => {
        return !location.hash.includes('/player-soundtouch/');
    });
    
    useEffect(() => {
        const checkRoute = () => {
            setShouldShow(!location.hash.includes('/player-soundtouch/'));
        };
        
        window.addEventListener('hashchange', checkRoute);
        return () => window.removeEventListener('hashchange', checkRoute);
    }, []);
    
    // 播放列表相关状态
    const [playlist, setPlaylist] = useState<ITrackInfo[]>([]);
    const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(-1);
    const [showPlaylist, setShowPlaylist] = useState<boolean>(false);
    const [isHiding, setIsHiding] = useState<boolean>(false);  // 控制渐出动画
    const [isDragging, setIsDragging] = useState<boolean>(false);  // 拖拽状态
    const [dragOffset, setDragOffset] = useState<number>(0);  // 拖拽偏移量
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [playMode, setPlayMode] = useState<number>(0);  // 播放模式：0=顺序播放，1=随机播放，2=单曲循环
    
    
    // 初始化播放列表管理器
    useEffect(() => {
        playlistManager.init().catch(err => {
            console.error('播放列表管理器初始化失败:', err);
        });
        
        return () => {
            // 组件卸载时不需要关闭数据库，因为可能在其他地方还在使用
        };
    }, []);
    
    // 保存文件到 IndexedDB
    const saveTrackToDB = useCallback((track: ITrackInfo) => {
        playlistManager.saveTrack(track).catch(err => {
            console.error('保存音轨失败:', err);
        });
    }, []);
    
        // Deleted:        // 从 IndexedDB 加载文件
        // Deleted:        const loadTrackFromDB = useCallback((id: string): Promise<ITrackInfo | undefined> => {
        // Deleted:            return new Promise((resolve, reject) => {
        // Deleted:                if (!db) {
        // Deleted:                    reject(new Error('数据库未初始化'));
        // Deleted:                    return;
        // Deleted:                }
        // Deleted:                
        // Deleted:                const transaction = db.transaction(['tracks'], 'readonly');
        // Deleted:                const store = transaction.objectStore('tracks');
        // Deleted:                const request = store.get(id);
        // Deleted:                
        // Deleted:                request.onsuccess = () => {
        // Deleted:                    resolve(request.result);
        // Deleted:                };
        // Deleted:                
        // Deleted:                request.onerror = () => {
        // Deleted:                    reject(request.error);
        // Deleted:                }
        // Deleted:            });
        // Deleted:        }, [db]);

    // 加载 LRC 歌词文件
    const loadLrcFile = useCallback((lrcFile: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const lrcContent = e.target?.result as string;
            console.log(`已加载歌词：${lrcFile.name}`);
            
            // 触发自定义事件加载歌词
            const loadLrcEvent = new CustomEvent('load-lrc', {
                detail: { text: lrcContent }
            });
            window.dispatchEvent(loadLrcEvent);
        };
        reader.onerror = () => {
            console.error('读取歌词文件失败');
        };
        reader.readAsText(lrcFile);
    }, []);

    // 清除播放列表
    const clearPlaylist = useCallback(() => {
        setPlaylist([]);
        setCurrentTrackIndex(-1);
        setSearchQuery('');
        toastPubSub.pub({
            type: 'success',
            text: lang.notify.playlistCleared
        });
    }, [lang]);

    // 过滤播放列表（搜索功能）
    const filteredPlaylist = useMemo(() => {
        if (!searchQuery.trim()) {
            return playlist;
        }
        const query = searchQuery.toLowerCase();
        return playlist.filter(track => 
            track.name.toLowerCase().includes(query) ||
            track.fileName.toLowerCase().includes(query)
        );
    }, [playlist, searchQuery]);

    // 上一首歌
    const onPreviousTrack = useCallback(() => {
        if (playlist.length === 0) return;
        
        // 如果当前没有播放任何歌曲，从最后一首开始
        let startIndex = currentTrackIndex;
        if (startIndex < 0 || startIndex >= playlist.length) {
            startIndex = 0; // 从第一首开始
        }
        
        const newIndex = startIndex <= 0 ? playlist.length - 1 : startIndex - 1;
        setCurrentTrackIndex(newIndex);
        
        const track = playlist[newIndex];
        if (track.file) {
            receiveFile(track.file, setAudioSrc);
            // 延迟一点等待音频加载后自动播放
            setTimeout(() => {
                audioRef.current?.play();
            }, 200);
            
            // 如果有 LRC 文件，自动加载歌词
            if (track.lrcFile) {
                loadLrcFile(track.lrcFile);
            }
            
            // 通知 content.tsx 更新当前播放文件
            window.dispatchEvent(new CustomEvent('current-playing-file-change', {
                detail: { fileName: track.fileName }
            }));
        }
    }, [playlist, currentTrackIndex]);

    // 下一首歌（支持多种播放模式）
    const onNextTrack = useCallback((_mode?: number) => {
        if (playlist.length === 0) return;
        
        // 如果当前没有播放任何歌曲，从第一首开始
        let startIndex = currentTrackIndex;
        if (startIndex < 0 || startIndex >= playlist.length) {
            startIndex = 0; // 从第一首开始
        }
        
        let newIndex: number;
        
        // 根据播放模式计算下一个索引
        if (playMode === 2) {
            // 单曲循环：保持当前索引
            newIndex = startIndex;
        } else if (playMode === 1) {
            // 随机播放：随机选择一个索引（排除当前歌曲）
            if (playlist.length === 1) {
                newIndex = 0;
            } else {
                do {
                    newIndex = Math.floor(Math.random() * playlist.length);
                } while (newIndex === startIndex);
            }
        } else {
            // 顺序播放：下一首，到最后一首后回到第一首
            newIndex = startIndex >= playlist.length - 1 ? 0 : startIndex + 1;
        }
        
        setCurrentTrackIndex(newIndex);
        
        const track = playlist[newIndex];
        if (track.file) {
            receiveFile(track.file, setAudioSrc);
            // 延迟一点等待音频加载后自动播放
            setTimeout(() => {
                audioRef.current?.play();
            }, 200);
            
            // 如果有 LRC 文件，自动加载歌词
            if (track.lrcFile) {
                loadLrcFile(track.lrcFile);
            }
            
            // 通知 content.tsx 更新当前播放文件
            window.dispatchEvent(new CustomEvent('current-playing-file-change', {
                detail: { fileName: track.fileName }
            }));
        }
    }, [playlist, currentTrackIndex, playMode]);

    // 处理播放列表关闭（带动画）
    const handleClosePlaylist = useCallback(() => {
        setIsHiding(true);  // 开始渐出动画
        setTimeout(() => {
            setShowPlaylist(false);  // 动画结束后真正隐藏
            setIsHiding(false);  // 重置动画状态
            setDragOffset(0);  // 重置拖拽偏移
        }, 350);  // 与 CSS transition 时间一致
    }, []);
    
    // 打开播放列表
    const _handleOpenPlaylist = useCallback(() => {
        setShowPlaylist(true);
        setIsHiding(false);
        setDragOffset(0);
    }, []);
    
    // 手势处理 - 触摸开始
    const handleTouchStart = useCallback((_e: React.TouchEvent) => {
        setIsDragging(true);
    }, []);
    
    // 手势处理 - 触摸移动
    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (!isDragging) return;
        
        const touch = e.touches[0];
        const deltaY = touch.clientY;
        
        // 只允许向下滑动
        if (deltaY > 0) {
            setDragOffset(deltaY);
        }
    }, [isDragging]);
    
    // 手势处理 - 触摸结束
    const handleTouchEnd = useCallback((_e: React.TouchEvent) => {
        if (!isDragging) return;
        
        setIsDragging(false);
        
        // 如果下滑距离超过 100px，关闭面板
        if (dragOffset > 100) {
            handleClosePlaylist();
        } else {
            // 否则恢复原位
            setDragOffset(0);
        }
    }, [isDragging, dragOffset, handleClosePlaylist]);

    // 监听来自 audio 组件的播放列表切换事件
    useEffect(() => {
        const handleTogglePlaylist = () => {
            // 如果是打开状态，直接使用渐出动画关闭
            if (showPlaylist) {
                handleClosePlaylist();
            } else {
                setShowPlaylist(prev => !prev);
            }
        };

        const handlePreviousTrack = () => {
            // 调用上一首功能
            onPreviousTrack();
        };

        const handleNextTrack = (_event: Event) => {
            // 调用下一首功能
            onNextTrack();
        };
        
        // 监听来自 Header 的打开文件事件
        const handleHeaderFileOpen = (event: Event) => {
            const customEvent = event as CustomEvent<{ file: File }>;
            if (customEvent.detail?.file) {
                const file = customEvent.detail.file;
                // 处理文件
                receiveFile(file, setAudioSrc);
                
                // 添加到播放列表
                const id = `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
                const name = getBaseName(file.name);
                const track: ITrackInfo = { id, name, fileName: file.name, file };
                setPlaylist(prev => [...prev, track]);
                setCurrentTrackIndex(playlist.length);
            }
        };
        
        // 监听来自文件列表的播放事件
        const handlePlayFileFromList = (event: Event) => {
            const customEvent = event as CustomEvent<{ file: File; lrcFile?: File }>;
            if (customEvent.detail?.file) {
                const file = customEvent.detail.file;
                const lrcFile = customEvent.detail.lrcFile;
                
                setPlaylist(prevPlaylist => {
                    // 检查文件是否已在播放列表中
                    const trackIndex = prevPlaylist.findIndex(track => track.fileName === file.name);
                    
                    if (trackIndex !== -1) {
                        // 文件已存在，直接切换到该歌曲
                        setCurrentTrackIndex(trackIndex);
                        receiveFile(prevPlaylist[trackIndex].file!, setAudioSrc);
                        
                        // 自动播放
                        setTimeout(() => {
                            audioRef.current?.play();
                        }, 200);
                        
                        // 优先使用传入的 LRC 文件，其次使用播放列表中已有的 LRC 文件
                        const lrcToLoad = lrcFile || prevPlaylist[trackIndex].lrcFile;
                        if (lrcToLoad) {
                            loadLrcFile(lrcToLoad);
                        }
                    } else {
                        // 文件不存在，添加到播放列表并播放
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
                        
                        // 如果有 LRC 文件，加载歌词
                        if (lrcFile) {
                            loadLrcFile(lrcFile);
                        }
                        
                        return [...prevPlaylist, track];
                    }
                    
                    return prevPlaylist;
                });
            }
        };
        
        // 监听来自 content 的索引更新事件
        const handleTrackIndexChange = (event: Event) => {
            const customEvent = event as CustomEvent<{ index: number }>;
            if (customEvent.detail?.index !== undefined) {
                setCurrentTrackIndex(customEvent.detail.index);
            }
        };
        
        // 监听播放模式变化事件
        const handlePlayModeChange = (event: Event) => {
            const customEvent = event as CustomEvent<{ playMode: number }>;
            if (customEvent.detail?.playMode !== undefined) {
                setPlayMode(customEvent.detail.playMode);
            }
        };
        
        // 监听来自 content 的添加文件到播放列表事件
        const handleAddFilesToPlaylist = (event: Event) => {
            const customEvent = event as CustomEvent<{ tracks: Array<{ file: File; lrcFile?: File }> }>;
            if (!customEvent.detail?.tracks || customEvent.detail.tracks.length === 0) {
                return;
            }
            
            const { tracks } = customEvent.detail;
            
            // 将文件添加到播放列表
            setPlaylist(prev => {
                const newTracks: ITrackInfo[] = tracks.map(({ file, lrcFile }) => {
                    const id = `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
                    const name = getBaseName(file.name);
                    
                    // 保存到 IndexedDB
                    saveTrackToDB({ id, name, fileName: file.name, file, lrcFile });
                    
                    return { id, name, fileName: file.name, file, lrcFile };
                });
                
                const updated = [...prev, ...newTracks];
                
                // 如果当前没有播放，自动播放第一首新添加的歌曲
                if (currentTrackIndex === -1 && newTracks.length > 0) {
                    const firstTrack = newTracks[0];
                    const file = firstTrack.file;
                    if (file) {
                        // 使用 setTimeout 确保在状态更新后执行
                        setTimeout(() => {
                            setCurrentTrackIndex(prev.length); // 设置为新添加的第一首的索引
                            receiveFile(file, setAudioSrc);
                            
                            // 延迟一点等待音频加载后自动播放
                            setTimeout(() => {
                                audioRef.current?.play();
                            }, 200);
                            
                            // 如果有 LRC 文件，自动加载歌词
                            if (firstTrack.lrcFile) {
                                loadLrcFile(firstTrack.lrcFile);
                            }
                        }, 0);
                    }
                }
                
                return updated;
            });
        };

        window.addEventListener('toggle-playlist', handleTogglePlaylist);
        window.addEventListener('previous-track', handlePreviousTrack);
        window.addEventListener('next-track', handleNextTrack);
        window.addEventListener('header-file-open' as any, handleHeaderFileOpen as any);
        window.addEventListener('play-file-from-list' as any, handlePlayFileFromList as any);
        window.addEventListener('track-index-change' as any, handleTrackIndexChange as any);
        window.addEventListener('play-mode-change' as any, handlePlayModeChange as any);
        window.addEventListener('add-files-to-playlist' as any, handleAddFilesToPlaylist as any);

        return () => {
            window.removeEventListener('toggle-playlist', handleTogglePlaylist);
            window.removeEventListener('previous-track', handlePreviousTrack);
            window.removeEventListener('next-track', handleNextTrack);
            window.removeEventListener('header-file-open' as any, handleHeaderFileOpen as any);
            window.removeEventListener('play-file-from-list' as any, handlePlayFileFromList as any);
            window.removeEventListener('track-index-change' as any, handleTrackIndexChange as any);
            window.removeEventListener('play-mode-change' as any, handlePlayModeChange as any);
            window.removeEventListener('add-files-to-playlist' as any, handleAddFilesToPlaylist as any);
        };
    }, [onPreviousTrack, onNextTrack, showPlaylist, playlist, currentTrackIndex]);

    const [audioSrc, setAudioSrc] = useReducer(
        (oldSrc: string, newSrc: string) => {
            URL.revokeObjectURL(oldSrc);
            return newSrc;
        },
        undefined,
        () => {
            let src = sessionStorage.getItem(SSK.audioSrc);
            if (src === null && location.search && URLSearchParams) {
                const searchParams = new URLSearchParams(location.search);
                const url = searchParams.get("url");
                if (url !== null) {
                    return url;
                }
                const text = searchParams.get("text") || searchParams.get("title") || "";
                const result = /https?:\/\/\S+/.exec(text);
                src = result && nec(result[0]);
            }
            return src!;
        },
    );

    useEffect(() => {
        function onKeydown(ev: KeyboardEvent) {
            if (isKeyboardElement(ev.target)) {
                return;
            }

            if (!audioRef.src) {
                return;
            }

            const action = getMatchedAction(ev, keyBindings);

            switch (action) {
                case InputAction.SeekBackward:
                    ev.preventDefault();
                    audioRef.step(ev, -5);
                    break;
                case InputAction.SeekForward:
                    ev.preventDefault();
                    audioRef.step(ev, 5);
                    break;
                case InputAction.ResetRate:
                    ev.preventDefault();
                    audioRef.playbackRate = 1;
                    break;
                case InputAction.IncreaseRate: {
                    ev.preventDefault();
                    const rate = audioRef.playbackRate;
                    audioRef.playbackRate = Math.exp(Math.min(Math.log(rate) + 0.2, 1));
                    break;
                }
                case InputAction.DecreaseRate: {
                    ev.preventDefault();
                    const rate = audioRef.playbackRate;
                    audioRef.playbackRate = Math.exp(Math.max(Math.log(rate) - 0.2, -1));
                    break;
                }
                case InputAction.TogglePlay:
                    ev.preventDefault();
                    audioRef.toggle();
                    break;
            }
        }
        document.addEventListener("keydown", onKeydown);

        return () => document.removeEventListener("keydown", onKeydown);
    }, [keyBindings]);

    useEffect(() => {
        function onDrop(ev: DragEvent) {
            const file = ev.dataTransfer!.files[0];
            receiveFile(file, setAudioSrc);
        }

        document.documentElement.addEventListener("drop", onDrop);

        return () => document.documentElement.removeEventListener("drop", onDrop);
    }, []);

    const onAudioInputChange = useCallback((ev: React.ChangeEvent<HTMLInputElement>) => {
        const files = ev.target.files;
        if (!files || files.length === 0) {
            return;
        }

        // 更新文件路径到 Header
        if (files.length > 0) {
            window.dispatchEvent(new CustomEvent('audio-file-update', {
                detail: { fileName: files[0].name }
            }));
        }

        // 分离音频文件和 LRC 文件
        const audioFiles = Array.from(files).filter(file => file.type.startsWith('audio/') || 
            ['.ncm', '.qmcflac', '.qmc0', '.qmc1', '.qmc2', '.qmc3', 'qmcogg'].some(ext => file.name.toLowerCase().endsWith(ext)));
        
        const lrcFiles = Array.from(files).filter(file => file.name.toLowerCase().endsWith('.lrc'));

        // 将选择的音频文件添加到播放列表（LRC 文件不添加到播放列表）
        const newTracks: ITrackInfo[] = audioFiles.map(file => {
            // 使用文件名 + 文件大小 + 时间戳生成唯一 ID
            const id = `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
            const name = getBaseName(file.name); // 去除扩展名
            
            // 查找匹配的 LRC 文件
            const matchingLrc = findMatchingLrcFile(file.name, lrcFiles);
            
            // 如果有匹配的 LRC，读取并保存歌词内容
            if (matchingLrc) {
                // 将 LRC 文件保存到 track 信息中
                return {
                    id,
                    name,
                    fileName: file.name,
                    file,
                    lrcFile: matchingLrc
                };
            }
            
            return {
                id,
                name,
                fileName: file.name,
                file
            };
        });

        setPlaylist(prev => {
            const updated = [...prev, ...newTracks];
            // 保存到数据库
            newTracks.forEach(track => saveTrackToDB(track));
            return updated;
        });

        // 如果当前没有播放，播放第一首
        if (currentTrackIndex === -1 && newTracks.length > 0) {
            const firstTrack = newTracks[0];
            const file = firstTrack.file;
            if (file) {
                // 立即设置索引为 0（第一首）
                setCurrentTrackIndex(0);
                
                receiveFile(file, setAudioSrc);
                
                // 延迟一点等待音频加载后自动播放
                setTimeout(() => {
                    audioRef.current?.play();
                }, 200);
                
                // 如果有 LRC 文件，自动加载歌词
                if (firstTrack.lrcFile) {
                    loadLrcFile(firstTrack.lrcFile);
                }
            }
        }

        // 清空 input，允许重复选择同一文件
        ev.target.value = '';
    }, [currentTrackIndex, playlist.length, saveTrackToDB]);

    const rafId = useRef(0);

    const onAudioLoadedMetadata = useCallback(() => {
        cancelAnimationFrame(rafId.current);
        audioStatePubSub.pub({
            type: AudioActionType.getDuration,
            payload: audioRef.duration,
        });
        toastPubSub.pub({
            type: "success",
            text: lang.notify.audioLoaded,
        });
    }, [lang]);

    const syncCurrentTime = useCallback(() => {
        currentTimePubSub.pub(audioRef.currentTime);
        rafId.current = requestAnimationFrame(syncCurrentTime);
    }, []);

    const onAudioPlay = useCallback(() => {
        rafId.current = requestAnimationFrame(syncCurrentTime);
        audioStatePubSub.pub({
            type: AudioActionType.pause,
            payload: false,
        });
    }, [syncCurrentTime]);

    const onAudioPause = useCallback(() => {
        cancelAnimationFrame(rafId.current);
        audioStatePubSub.pub({
            type: AudioActionType.pause,
            payload: true,
        });
    }, []);

    const onAudioEnded = useCallback(() => {
        cancelAnimationFrame(rafId.current);
        audioStatePubSub.pub({
            type: AudioActionType.pause,
            payload: true,
        });
        
        // 播放结束时自动播放下一首
        onNextTrack();
    }, [onNextTrack]);

    const onAudioTimeUpdate = useCallback(() => {
        if (audioRef.paused) {
            currentTimePubSub.pub(audioRef.currentTime);
        }
    }, []);

    const onAudioRateChange = useCallback(() => {
        audioStatePubSub.pub({
            type: AudioActionType.rateChange,
            payload: audioRef.playbackRate,
        });
    }, []);

    const onAudioError = useCallback(
        (ev: React.SyntheticEvent<HTMLAudioElement>) => {
            const audio = ev.target as HTMLAudioElement;
            const error = audio.error!;
            const message = lang.audio.error[error.code] || error.message || lang.audio.error[0];
            toastPubSub.pub({
                type: "warning",
                text: message,
            });
        },
        [lang],
    );

    return (
        <footer className="app-footer" style={{ display: shouldShow ? undefined : 'none' }}>
            {/* 隐藏的音频文件输入 */}
            <input id="audio-input" type="file" accept={accept} multiple hidden={true} onChange={onAudioInputChange} />
            
            {/* 遮罩层 */}
            {(showPlaylist || isHiding) && (
                <div 
                    className={`playlist-overlay${showPlaylist ? ' show' : ''}`}
                    onClick={handleClosePlaylist}
                />
            )}
            
            {/* 播放列表面板 */}
            {(showPlaylist || isHiding) && (
                <div 
                    className={`playlist-panel${showPlaylist ? ' show' : ''}${isHiding ? ' hiding' : ''}${isDragging ? ' dragging' : ''}`}
                    style={isDragging ? { transform: `translateY(${dragOffset}px)` } : undefined}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    {/* iOS 风格的拖拽手柄 */}
                    <div className="playlist-drag-handle" onTouchStart={handleTouchStart}>
                        <div className="drag-handle-bar" />
                    </div>
                    
                    <div className="playlist-header">
                        <span>{lang.playlist.title} ({playlist.length}{lang.playlist.tracks})</span>
                        <div className="playlist-header-actions">
                            <button 
                                className="clear-playlist-btn-icon"
                                onClick={clearPlaylist}
                                title={lang.playlist.clearPlaylist}
                                disabled={playlist.length === 0}
                            >
                                <DeleteSVG />
                            </button>
                            <button 
                                className="close-playlist-btn" 
                                title={lang.playlist.close}
                                onClick={handleClosePlaylist}
                            >
                                <CloseSVG />
                            </button>
                        </div>
                    </div>
                    
                    <div className="playlist-content">
                        {playlist.length === 0 ? (
                            <div className="empty-playlist">
                                <p>{lang.playlist.noTracks}</p>
                                <button 
                                    className="open-file-btn"
                                    onClick={() => document.getElementById('audio-input')?.click()}
                                >
                                    <FolderSVG />
                                    <span>{lang.playlist.openFile}</span>
                                </button>
                            </div>
                        ) : (
                            <ul className="playlist-items">
                                {filteredPlaylist.map((track) => {
                                    // 找到原 playlist 中的索引
                                    const originalIndex = playlist.findIndex(t => t.id === track.id);
                                    return (
                                        <li 
                                            key={track.id}
                                            className={`playlist-item ${originalIndex === currentTrackIndex ? 'playing' : ''}`}
                                            onClick={() => {
                                                if (track.file) {
                                                    // 1. 加载音频文件
                                                    receiveFile(track.file, setAudioSrc);
                                                    setCurrentTrackIndex(originalIndex);
                                                    
                                                    // 2. 自动播放（延迟一点等待音频加载）
                                                    setTimeout(() => {
                                                        audioRef.current?.play();
                                                    }, 200);
                                                    
                                                    // 3. 如果有 LRC 文件，自动加载歌词
                                                    if (track.lrcFile) {
                                                        loadLrcFile(track.lrcFile);
                                                    }
                                                }
                                            }}
                                        >
                                            <span className="track-name">{track.name}</span>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                    
                    {/* 搜索和工具栏 - 移到底部 */}
                    <div className="playlist-toolbar">
                        <button 
                            className="toolbar-open-file-btn"
                            onClick={() => document.getElementById('audio-input')?.click()}
                            title={lang.playlist.openFile}
                        >
                            <FolderSVG />
                        </button>
                        <div className="playlist-search">
                            <SearchSVG />
                            <input
                                type="text"
                                placeholder={lang.playlist.searchPlaceholder}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                className="playlist-search-input"
                            />
                            {searchQuery && (
                                <button 
                                    className="clear-search-btn"
                                    onClick={() => setSearchQuery('')}
                                    title={lang.playlist.clearSearch}
                                >
                                    <CloseSVG />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
            
            <LoadAudio setAudioSrc={setAudioSrc} lang={lang} />
            <audio
                ref={audioRef}
                src={audioSrc}
                controls={prefState.builtInAudio}
                hidden={!prefState.builtInAudio}
                onLoadedMetadata={onAudioLoadedMetadata}
                onPlay={onAudioPlay}
                onPause={onAudioPause}
                onEnded={onAudioEnded}
                onTimeUpdate={onAudioTimeUpdate}
                onRateChange={onAudioRateChange}
                onError={onAudioError}
            />
            {prefState.builtInAudio || (
                <LrcAudio 
                    lang={lang} 
                    currentTrackName={currentTrackIndex >= 0 && playlist[currentTrackIndex] ? playlist[currentTrackIndex].name : undefined}
                />
            )}
        </footer>
    );
};

type TsetAudioSrc = (src: string) => void;

const receiveFile = (file: File, setAudioSrc: TsetAudioSrc): void => {
    sessionStorage.removeItem(SSK.audioSrc);

    if (file) {
        if (file.type.startsWith("audio/")) {
            setAudioSrc(URL.createObjectURL(file));
            return;
        }
        if (file.name.endsWith(".ncm")) {
            const worker = new Worker(new URL("/worker/ncmc-worker.js", import.meta.url));
            worker.addEventListener(
                "message",
                (ev: IMessageEvent<IMessage>) => {
                    if (ev.data.type === "success") {
                        const dataArray = ev.data.payload;
                        const musicFile = new Blob([dataArray], {
                            type: detectMimeType(dataArray),
                        });

                        setAudioSrc(URL.createObjectURL(musicFile));
                    }
                    if (ev.data.type === "error") {
                        toastPubSub.pub({
                            type: "warning",
                            text: ev.data.payload,
                        });
                    }
                },
                { once: true },
            );

            worker.addEventListener(
                "error",
                (ev) => {
                    toastPubSub.pub({
                        type: "warning",
                        text: ev.message,
                    });
                    worker.terminate();
                },
                { once: true },
            );

            worker.postMessage(file);

            return;
        }
        if (/\.qmc(?:flac|0|1|2|3)$/.test(file.name)) {
            const worker = new Worker(new URL("/worker/qmc-worker.js", import.meta.url));
            worker.addEventListener(
                "message",
                (ev: IMessageEvent<IMessage>) => {
                    if (ev.data.type === "success") {
                        const dataArray = ev.data.payload;
                        const musicFile = new Blob([dataArray], {
                            type: detectMimeType(dataArray),
                        });

                        setAudioSrc(URL.createObjectURL(musicFile));
                    }
                },
                { once: true },
            );

            worker.postMessage(file);
        }
    }
};

const MimeType = {
    fLaC: 0x664c6143,
    OggS: 0x4f676753,
    RIFF: 0x52494646,
    WAVE: 0x57415645,
};

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const detectMimeType = (dataArray: Uint8Array) => {
    const magicNumber = new DataView(dataArray.buffer).getUint32(0, false);
    switch (magicNumber) {
        case MimeType.fLaC:
            return "audio/flac";

        case MimeType.OggS:
            return "audio/ogg";

        case MimeType.RIFF:
        case MimeType.WAVE:
            return "audio/wav";

        default:
            return "audio/mpeg";
    }
};

// side effect
document.addEventListener("visibilitychange", () => {
    if (!audioRef.paused) {
        audioRef.toggle();
    }
});
