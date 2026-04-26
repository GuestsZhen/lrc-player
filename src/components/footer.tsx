import SSK from "#const/session_key.json" assert { type: "json" };
import { useCallback, useContext, useEffect, useReducer, useState, useMemo } from "react";
import { useKeyBindings } from "../hooks/useKeyBindings.js";
import { audioRef, audioStatePubSub, currentTimePubSub } from "../utils/audiomodule.js";
import { InputAction } from "../utils/input-action.js";
import { isKeyboardElement } from "../utils/is-keyboard-element.js";
import { getMatchedAction } from "../utils/keybindings.js";
import { appContext, ChangBits } from "./app.context.js";
import { LrcAudio } from "./audio/LrcAudio.js";
import { LoadAudio, nec } from "./loadaudio.js";
import { CloseSVG, FolderSVG, SearchSVG, DeleteSVG } from "./svg.js";
import { toastPubSub } from "./toast.js";
import { playlistManager, type ITrackInfo } from "../utils/playlist-manager.js";
import { MediaStore } from '../utils/mediastore-plugin.js';
// ✅ 引入新创建的 Hooks 和组件
import { useMediaStore, useAudioEvents, usePlaylistEvents } from '../hooks/index.js';
import { PlaylistPanel } from './PlaylistPanel.js';  // ✅ 从根目录导入
// ✅ 引入工具函数
import { getBaseName, findMatchingLrcFile } from '../utils/file-utils.js';
import { receiveFile } from '../utils/audio-decoder.js';
import { calculateNextIndex, loadMSTrack, PlayMode } from '../utils/playback-control.js';
import { isAndroidNative } from '../utils/platform-detector.js';
import { setExoPlayerSpeed } from '../utils/playback-control.js';
import { addTrackEndedListener } from '../utils/exoplayer-plugin.js';

// 播放列表曲目信息
// 已从 ../utils/playlist-manager.js 导入

// 跨平台兼容的文件类型定义
// 仅使用扩展名,避免 iOS/Android 对 MIME 类型的不同处理
const accept = [
    // 歌词文件
    ".lrc", ".txt",
    // 音频文件
    ".mp3", ".wav", ".aac", ".m4a", ".flac", ".ogg", ".wma", ".ape", ".aiff", ".alac",
    // 加密格式
    ".ncm", ".qmcflac", ".qmc0", ".qmc1", ".qmc2", ".qmc3", ".qmcogg"
].join(", ");

export const Footer: React.FC = () => {
    const { prefState, lang } = useContext(appContext, ChangBits.lang | ChangBits.builtInAudio);
    const keyBindings = useKeyBindings();
    
    // ✅ 使用 useMediaStore Hook
    const { readAudioFile, readLrcFile } = useMediaStore();
    
    // ✅ 使用 useAudioEvents Hook
    const {
        onAudioLoadedMetadata,
        onAudioPlay,
        onAudioPause,
        onAudioEnded,
        onAudioTimeUpdate,
        onAudioRateChange,
        onAudioError,
    } = useAudioEvents();
    
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
    const [displayTrackName, setDisplayTrackName] = useState<string>('');  // 用于立即更新显示的歌名
    const [showPlaylist, setShowPlaylist] = useState<boolean>(false);
    const [isHiding, setIsHiding] = useState<boolean>(false);  // 控制渐出动画
    const [isDragging, setIsDragging] = useState<boolean>(false);  // 拖拽状态
    const [dragOffset, setDragOffset] = useState<number>(0);  // 拖拽偏移量
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [playMode, setPlayMode] = useState<number>(0);  // 播放模式：0=顺序播放，1=随机播放，2=单曲循环
    
    // ✅ 获取当前曲目的文件路径（用于波形显示）
    // Android 模式下从全局 __msTracks 和 msCurrentIndex 获取
    const currentTrackFilePath = isAndroidNative()
        ? ((window as any).__msTracks?.[(window as any).__msCurrentIndex]?.filePath)
        : undefined;  // Web 模式不需要波形
    
    // ✅ 调试日志
    if (isAndroidNative()) {
    }
    
    
    // 初始化播放列表管理器
    useEffect(() => {
        playlistManager.init().catch(err => {
            // 初始化失败处理
        });
        
        // ✅ 监听 audio-file-update 事件，更新显示的歌名
        const handleAudioFileUpdate = (event: Event) => {
            const customEvent = event as CustomEvent<{ fileName?: string; trackName?: string }>;
            if (customEvent.detail?.trackName) {
                setDisplayTrackName(customEvent.detail.trackName);
            }
        };
        
        window.addEventListener('audio-file-update', handleAudioFileUpdate as EventListener);
        
        // ✅ 监听播放模式变化事件（来自 usePlaybackMode Hook）
        const handlePlayModeChange = (event: Event) => {
            const customEvent = event as CustomEvent<{ playMode: number }>;
            setPlayMode(customEvent.detail.playMode);
        };
        
        window.addEventListener('play-mode-change', handlePlayModeChange as EventListener);
        
        // ✅ 监听清除播放列表事件（来自 fileManager.clearAllFiles）
        const handleClearPlaylist = () => {
            // 清空播放列表状态
            setPlaylist([]);
            setCurrentTrackIndex(-1);
            setDisplayTrackName('');
            setSearchQuery('');
            
            // ✅ 停止当前播放的音频（避免触发错误事件）
            if (audioRef.current) {
                // 先暂停
                audioRef.current.pause();
                // 重置时间
                audioRef.current.currentTime = 0;
                // ✅ 使用 removeAttribute 而不是设置为空字符串，避免触发 error 事件
                audioRef.current.removeAttribute('src');
                // 重新加载以清除缓冲
                audioRef.current.load();
            }
            
            // ✅ 同时清除已加载的 LRC 文件
            window.dispatchEvent(new CustomEvent('clear-lrc'));
        };
        
        window.addEventListener('clear-playlist', handleClearPlaylist as EventListener);
        
        // ✅ Android 模式下监听 ExoPlayer 播放完成事件
        if (isAndroidNative()) {
            addTrackEndedListener(() => {
                // 自动播放下一首
                onNextTrack();
            });
        }
        
        return () => {
            window.removeEventListener('audio-file-update', handleAudioFileUpdate as EventListener);
            window.removeEventListener('play-mode-change', handlePlayModeChange as EventListener);
            window.removeEventListener('clear-playlist', handleClearPlaylist as EventListener);
            // 组件卸载时不需要关闭数据库，因为可能在其他地方还在使用
        };
    }, []);
    
    // 保存文件到 IndexedDB
    const saveTrackToDB = useCallback((track: ITrackInfo) => {
        playlistManager.saveTrack(track).catch(err => {
            // 保存失败处理
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
            
            // 触发自定义事件加载歌词
            const loadLrcEvent = new CustomEvent('load-lrc', {
                detail: { text: lrcContent }
            });
            window.dispatchEvent(loadLrcEvent);
        };
        reader.onerror = () => {
            // 读取歌词文件失败处理
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
    
    // 更新当前播放歌曲名称的辅助函数
    const updateCurrentTrackName = useCallback((trackIndex: number, currentPlaylist: ITrackInfo[]) => {
        if (trackIndex >= 0 && trackIndex < currentPlaylist.length) {
            const track = currentPlaylist[trackIndex];
            // 立即更新显示的歌名（解决 React 状态异步更新问题）
            setDisplayTrackName(track.name);
            // 通知 Header 更新音频文件显示
            window.dispatchEvent(new CustomEvent('audio-file-update', {
                detail: { fileName: track.fileName }
            }));
        }
    }, []);

    // 上一首歌
    const onPreviousTrack = useCallback(async () => {

        // ✅ 检查是否是 MS 播放列表
        const msTracks = (window as any).__msTracks;
        const msCurrentIndex = (window as any).__msCurrentIndex;
        

        if (msTracks && msTracks.length > 1) {

            // MS 播放列表：使用统一的索引计算
            const prevIndex = calculateNextIndex(msCurrentIndex, msTracks.length, playMode, 'prev');

            try {
                await loadMSTrack(
                    msTracks,
                    prevIndex,
                    readAudioFile,
                    readLrcFile,
                    loadLrcFile,
                    setDisplayTrackName
                );

            } catch (error) {
                console.error('❌ Failed to load MS track:', error);
            }

            return;
        }
        

        // 普通播放列表逻辑
        if (playlist.length === 0) {

            return;
        }
        
        let startIndex = currentTrackIndex;
        if (startIndex < 0 || startIndex >= playlist.length) {

            startIndex = 0;
        }
        
        const newIndex = calculateNextIndex(startIndex, playlist.length, playMode, 'prev');

        setCurrentTrackIndex(newIndex);
        
        const track = playlist[newIndex];
        if (track.file) {

            receiveFile(track.file, setAudioSrc);
            setTimeout(() => {
                audioRef.current?.play();

            }, 200);
            
            if (track.lrcFile) {

                loadLrcFile(track.lrcFile);
            }
            
            window.dispatchEvent(new CustomEvent('current-playing-file-change', {
                detail: { fileName: track.fileName }
            }));
            
            updateCurrentTrackName(newIndex, playlist);

        } else {
            console.error('❌ Track file is null or undefined');
        }

    }, [playlist, currentTrackIndex, playMode, updateCurrentTrackName, readAudioFile, readLrcFile, loadLrcFile]);

    // 下一首歌（支持多种播放模式）
    const onNextTrack = useCallback(async (_mode?: number) => {

        // ✅ 检查是否是 MS 播放列表
        const msTracks = (window as any).__msTracks;
        const msCurrentIndex = (window as any).__msCurrentIndex;
        

        if (msTracks && msTracks.length > 1) {

            // MS 播放列表：使用统一的索引计算
            const nextIndex = calculateNextIndex(msCurrentIndex, msTracks.length, playMode, 'next');

            try {
                await loadMSTrack(
                    msTracks,
                    nextIndex,
                    readAudioFile,
                    readLrcFile,
                    loadLrcFile,
                    setDisplayTrackName
                );

            } catch (error) {
                console.error('❌ Failed to load MS track:', error);
            }

            return;
        }
        

        // 普通播放列表逻辑
        if (playlist.length === 0) {

            return;
        }
        
        let startIndex = currentTrackIndex;
        if (startIndex < 0 || startIndex >= playlist.length) {

            startIndex = 0;
        }
        
        const newIndex = calculateNextIndex(startIndex, playlist.length, playMode, 'next');

        setCurrentTrackIndex(newIndex);
        
        const track = playlist[newIndex];
        if (track.file) {
            // ✅ 关键修复：先暂停当前播放，避免在切换 URL 时出现错误
            if (audioRef.current) {
                audioRef.current.pause();
            }

            receiveFile(track.file, setAudioSrc);
            setTimeout(() => {
                audioRef.current?.play();

            }, 200);
            
            if (track.lrcFile) {

                loadLrcFile(track.lrcFile);
            }
            
            window.dispatchEvent(new CustomEvent('current-playing-file-change', {
                detail: { fileName: track.fileName }
            }));
            
            updateCurrentTrackName(newIndex, playlist);

        } else {
            console.error('❌ Track file is null or undefined');
        }

    }, [playlist, currentTrackIndex, playMode, updateCurrentTrackName, readAudioFile, readLrcFile, loadLrcFile]);

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

    const [audioSrc, setAudioSrc] = useReducer(
        (oldSrc: string | undefined, newSrc: string) => {
            if (oldSrc) {
                try {
                    URL.revokeObjectURL(oldSrc);
                } catch (err) {
                    // 撤销旧 URL 失败处理
                }
            }
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

    // ✅ 使用 usePlaylistEvents Hook 管理所有播放列表事件
    usePlaylistEvents({
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
        setSearchQuery,
        readAudioFile,
        readLrcFile,
    });

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
                    if (isAndroidNative()) {
                        setExoPlayerSpeed(1).catch(console.error);
                    } else {
                        audioRef.playbackRate = 1;
                    }
                    break;
                case InputAction.IncreaseRate: {
                    ev.preventDefault();
                    const currentRate = isAndroidNative() 
                        ? ((window as any).__exoPlayerStatus?.speed || 1)
                        : audioRef.playbackRate;
                    const newRate = Math.exp(Math.min(Math.log(currentRate) + 0.2, 1));
                    if (isAndroidNative()) {
                        setExoPlayerSpeed(newRate).catch(console.error);
                    } else {
                        audioRef.playbackRate = newRate;
                    }
                    break;
                }
                case InputAction.DecreaseRate: {
                    ev.preventDefault();
                    const currentRate = isAndroidNative() 
                        ? ((window as any).__exoPlayerStatus?.speed || 1)
                        : audioRef.playbackRate;
                    const newRate = Math.exp(Math.max(Math.log(currentRate) - 0.2, -1));
                    if (isAndroidNative()) {
                        setExoPlayerSpeed(newRate).catch(console.error);
                    } else {
                        audioRef.playbackRate = newRate;
                    }
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
            ev.preventDefault();
            
            // ✅ 检测当前是否在 player-soundtouch 页面，如果是则不处理（让该页面自己处理）
            const currentHash = window.location.hash;
            if (currentHash.includes('player-soundtouch') || currentHash.includes('st')) {
                return; // 让 player-soundtouch.tsx 自己处理
            }
            
            const files = ev.dataTransfer?.files;
            if (!files || files.length === 0) {
                return;
            }

            // 分离音频文件和 LRC 文件
            const audioFiles = Array.from(files).filter(file => 
                file.type.startsWith('audio/') || 
                ['.ncm', '.qmcflac', '.qmc0', '.qmc1', '.qmc2', '.qmc3', '.qmcogg'].some(ext => 
                    file.name.toLowerCase().endsWith(ext)
                )
            );
            
            const lrcFiles = Array.from(files).filter(file => 
                file.name.toLowerCase().endsWith('.lrc')
            );
            
            if (audioFiles.length > 0) {
                // ✅ 使用 fileManager 添加文件到播放列表
                import('../stores/fileManager.js').then(({ useFileManager }) => {
                    const store = useFileManager.getState();
                    store.addFiles(audioFiles, lrcFiles);
                });
            } else if (lrcFiles.length > 0) {
                // 如果只有 LRC 文件，加载第一个 LRC 文件
                const fileReader = new FileReader();
                fileReader.addEventListener("load", () => {
                    window.dispatchEvent(new CustomEvent('load-lrc-file', {
                        detail: { text: fileReader.result as string }
                    }));
                });
                fileReader.readAsText(lrcFiles[0], "utf-8");
            }
        }

        document.documentElement.addEventListener("drop", onDrop);
        document.documentElement.addEventListener("dragover", (ev) => {
            ev.preventDefault(); // 允许拖放
        });

        return () => {
            document.documentElement.removeEventListener("drop", onDrop);
        };
    }, []);

    const onAudioInputChange = useCallback((ev: React.ChangeEvent<HTMLInputElement>) => {
        const files = ev.target.files;
        if (!files || files.length === 0) {
            return;
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
                        
                        // 更新 Header 显示的歌名
                        updateCurrentTrackName(prev.length, updated);
                    }, 0);
                }
            }
            
            return updated;
        });

        // 清空 input，允许重复选择同一文件
        ev.target.value = '';
    }, [currentTrackIndex, playlist.length, saveTrackToDB]);

    // ✅ 音频事件处理已提取到 useAudioEvents Hook

    // ✅ 播放列表中的歌曲点击处理
    const handlePlayTrackFromPanel = useCallback((track: ITrackInfo, index: number) => {
        if (track.file) {
            // 1. 加载音频文件
            receiveFile(track.file, setAudioSrc);
            setCurrentTrackIndex(index);
            
            // 2. 自动播放（延迟一点等待音频加载）
            setTimeout(() => {
                audioRef.current?.play();
            }, 200);
            
            // 3. 如果有 LRC 文件，自动加载歌词
            if (track.lrcFile) {
                loadLrcFile(track.lrcFile);
            }
            
            // 4. 更新 Header 显示的歌名
            updateCurrentTrackName(index, playlist);
        }
    }, [playlist, updateCurrentTrackName]);

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
            
            {/* ✅ 播放列表面板 - 已提取为组件 */}
            {(showPlaylist || isHiding) && (
                <PlaylistPanel
                    playlist={playlist}
                    currentTrackIndex={currentTrackIndex}
                    showPlaylist={showPlaylist}
                    isHiding={isHiding}
                    isDragging={isDragging}
                    dragOffset={dragOffset}
                    searchQuery={searchQuery}
                    lang={lang}
                    onClose={handleClosePlaylist}
                    onClear={clearPlaylist}
                    onSearchChange={setSearchQuery}
                    onPlayTrack={handlePlayTrackFromPanel}
                    onOpenFile={() => document.getElementById('audio-input')?.click()}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                />
            )}
            
            <LoadAudio setAudioSrc={setAudioSrc} lang={lang} />
            {/* ✅ Android 原生环境禁用 HTML5 Audio，只使用 ExoPlayer */}
            {!isAndroidNative() && (
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
            )}
            {prefState.builtInAudio || (
                <LrcAudio 
                    lang={lang} 
                    currentTrackName={displayTrackName || undefined}
                    currentTrackFilePath={currentTrackFilePath}
                    audioSrc={audioSrc}
                />
            )}
        </footer>
    );
};

type TsetAudioSrc = (src: string) => void;

// side effect
document.addEventListener("visibilitychange", () => {
    if (!audioRef.paused) {
        audioRef.toggle();
    }
});
