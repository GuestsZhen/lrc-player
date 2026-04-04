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

// 播放列表曲目信息
export interface ITrackInfo {
    id: string;           // 唯一标识
    name: string;         // 歌名（去扩展名）
    fileName: string;     // 原始文件名
    file?: File;          // 音频文件引用（可选）
    lrcFile?: File;       // 同名 LRC 文件引用（可选）
}

const accept = ["audio/*", ".ncm", ".qmcflac", ".qmc0", ".qmc1", ".qmc2", ".qmc3", "qmcogg", ".lrc"].join(", ");

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
    
    // 播放列表相关状态
    const [playlist, setPlaylist] = useState<ITrackInfo[]>([]);
    const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(-1);
    const [showPlaylist, setShowPlaylist] = useState<boolean>(false);
    const [isHiding, setIsHiding] = useState<boolean>(false);  // 控制渐出动画
    const [db, setDb] = useState<IDBDatabase | null>(null);
    const [searchQuery, setSearchQuery] = useState<string>('');
    
    // 播放模式：0=顺序播放，1=随机播放，2=单曲循环
    const [playMode, setPlayMode] = useState(0);
    
    // 监听播放模式变化事件（从 audio 组件）
    useEffect(() => {
        const handlePlayModeChange = (event: Event) => {
            const customEvent = event as CustomEvent<{ playMode: number }>;
            setPlayMode(customEvent.detail.playMode);
        };
        
        window.addEventListener('play-mode-change' as any, handlePlayModeChange as any);
        return () => window.removeEventListener('play-mode-change' as any, handlePlayModeChange as any);
    }, []);

    // 初始化 IndexedDB
    useEffect(() => {
        const request = indexedDB.open('MusicPlayerDB', 1);
        
        request.onerror = () => {
            console.error('IndexedDB 打开失败');
        };
        
        request.onsuccess = () => {
            setDb(request.result);
        };
        
        request.onupgradeneeded = (event) => {
            const database = (event.target as IDBOpenDBRequest).result;
            
            // 创建对象仓库
            if (!database.objectStoreNames.contains('tracks')) {
                const store = database.createObjectStore('tracks', { keyPath: 'id' });
                store.createIndex('name', 'name', { unique: false });
                store.createIndex('fileName', 'fileName', { unique: false });
            }
        };
        
        return () => {
            // 组件卸载时关闭数据库
            if (db) {
                db.close();
            }
        };
    }, []);
    
    // 保存文件到 IndexedDB
    const saveTrackToDB = useCallback((track: ITrackInfo) => {
        if (!db) return;
        
        const transaction = db.transaction(['tracks'], 'readwrite');
        const store = transaction.objectStore('tracks');
        store.put(track);
    }, [db]);
    
        // 从 IndexedDB 加载文件
        const loadTrackFromDB = useCallback((id: string): Promise<ITrackInfo | undefined> => {
            return new Promise((resolve, reject) => {
                if (!db) {
                    reject(new Error('数据库未初始化'));
                    return;
                }
                
                const transaction = db.transaction(['tracks'], 'readonly');
                const store = transaction.objectStore('tracks');
                const request = store.get(id);
                
                request.onsuccess = () => {
                    resolve(request.result);
                };
                
                request.onerror = () => {
                    reject(request.error);
                }
            });
        }, [db]);

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
        
        const newIndex = currentTrackIndex <= 0 ? playlist.length - 1 : currentTrackIndex - 1;
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
        }
    }, [playlist, currentTrackIndex]);

    // 下一首歌（支持随机播放和单曲循环）
    const onNextTrack = useCallback((mode?: number) => {
        if (playlist.length === 0) return;
        
        let newIndex: number;
        
        // 播放模式：0=顺序播放，1=随机播放，2=单曲循环
        if (mode === 1) {
            // 随机播放：从播放列表中随机选择一首（排除当前正在播放的）
            const availableIndexes = Array.from({ length: playlist.length }, (_, i) => i)
                .filter(i => i !== currentTrackIndex);
            const randomIndex = Math.floor(Math.random() * availableIndexes.length);
            newIndex = availableIndexes[randomIndex];
        } else if (mode === 2) {
            // 单曲循环：重新播放当前歌曲
            newIndex = currentTrackIndex;
        } else {
            // 顺序播放：按顺序播放下一首
            newIndex = currentTrackIndex >= playlist.length - 1 ? 0 : currentTrackIndex + 1;
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
        }
    }, [playlist, currentTrackIndex]);

    // 处理播放列表关闭（带渐出动画）
    const handleClosePlaylist = useCallback(() => {
        setIsHiding(true);  // 开始渐出动画
        setTimeout(() => {
            setShowPlaylist(false);  // 动画结束后真正隐藏
            setIsHiding(false);  // 重置动画状态
        }, 300);  // 与动画时长一致
    }, []);

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
            onPreviousTrack();
        };

        const handleNextTrack = (event: Event) => {
            const customEvent = event as CustomEvent<{ playMode?: number }>;
            onNextTrack(customEvent.detail?.playMode);
        };

        window.addEventListener('toggle-playlist', handleTogglePlaylist);
        window.addEventListener('previous-track', handlePreviousTrack);
        window.addEventListener('next-track', handleNextTrack);

        return () => {
            window.removeEventListener('toggle-playlist', handleTogglePlaylist);
            window.removeEventListener('previous-track', handlePreviousTrack);
            window.removeEventListener('next-track', handleNextTrack);
        };
    }, [onPreviousTrack, onNextTrack, showPlaylist]);

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
            if (firstTrack.file) {
                receiveFile(firstTrack.file, setAudioSrc);
                setCurrentTrackIndex(playlist.length);
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
        onNextTrack(playMode);
    }, [onNextTrack, playMode]);

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
        <footer className="app-footer">
            {/* 隐藏的音频文件输入 */}
            <input id="audio-input" type="file" accept={accept} multiple hidden={true} onChange={onAudioInputChange} />
            
            {/* 播放列表面板 */}
            {(showPlaylist || isHiding) && (
                <div className={`playlist-panel${isHiding ? ' playlist-hiding' : ''}`}>
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
