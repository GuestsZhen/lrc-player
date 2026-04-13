import LSK from "#const/local_key.json" assert { type: "json" };
import ROUTER from "#const/router.json" assert { type: "json" };
import SSK from "#const/session_key.json" assert { type: "json" };
import STRINGS from "#const/strings.json" assert { type: "json" };
import { convertTimeToTag, stringify } from "@lrc-maker/lrc-parser";
import { type JSX, lazy, Suspense, useCallback, useContext, useEffect, useRef, useState } from "react";
import { ActionType as LrcActionType, useLrc } from "../hooks/useLrc.js";
import { ThemeMode } from "../hooks/usePref.js";
import { AudioActionType, audioRef, audioStatePubSub } from "../utils/audiomodule.js";

import { appContext, ChangBits } from "./app.context.js";
import { AkariNotFound, AkariOdangoLoading } from "./svg.img.js";
import { FolderSVG, DeleteSVG } from "./svg.js";
import { playlistManager } from "../utils/playlist-manager.js";
import { simpleKeyDetector } from "../utils/simple-key-detector.js";
import { useFileManager } from "../stores/fileManager.js";
import { FileListPanel } from "./file-manager/FileListPanel.js";

const LazyEditor = lazy(async () =>
    import("./editor.js").then(({ Eidtor }) => {
        return { default: Eidtor };
    })
);

const LazySynchronizer = lazy(async () =>
    import("./synchronizer.js").then(({ Synchronizer }) => {
        return { default: Synchronizer };
    })
);

const LazyPlayer = lazy(async () =>
    import("./player.js").then(({ Player }) => {
        return { default: Player };
    })
);

const LazyTune = lazy(async () =>
    import("./tune.js").then(({ Tune }) => {
        return { default: Tune };
    })
);

const LazyLrcUtils = lazy(async () =>
    import("./lrc-utils.js").then(({ LrcUtils }) => {
        return { default: LrcUtils };
    })
);

const LazyGist = lazy(async () =>
    import("./gist.js").then(({ Gist }) => {
        return { default: Gist };
    })
);

const LazyPreferences = lazy(async () =>
    import("./preferences.js").then(({ Preferences }) => {
        return { default: Preferences };
    })
);

const LazyPlayerSoundTouch = lazy(async () =>
    import("./player-soundtouch.js").then(({ PlayerSoundTouch }) => {
        return { default: PlayerSoundTouch };
    })
);

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

export const Content: React.FC = () => {
    const self = useRef(Symbol(Content.name));

    const { prefState, trimOptions, lang } = useContext(appContext, ChangBits.prefState);
    
    // 使用新的 File Manager Store
    const fileManager = useFileManager();
    
    // === 从 Store 获取的值（兼容旧代码）===
    const selectedFiles = fileManager.selectedFiles;
    const setSelectedFiles = fileManager.setSelectedFiles;
    const searchQuery = fileManager.searchQuery;
    const setSearchQuery = fileManager.setSearchQuery;
    const showFileListPanel = fileManager.showFileListPanel;
    const setShowFileListPanel = fileManager.setShowFileListPanel;
    const currentPlayingFile = fileManager.currentPlayingFile;
    const setCurrentPlayingFile = fileManager.setCurrentPlayingFile;
    const fileObjects = fileManager.fileObjects;
    const setFileObjects = fileManager.setFileObjects;
    // ========================================

    const [path, setPath] = useState(location.hash);
    const [previousPath, setPreviousPath] = useState(location.hash);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [_audioSrc, _setAudioSrc] = useState<string>(''); // 当前音频源
    const [_currentTrackIndex, setCurrentTrackIndex] = useState<number>(-1); // 当前播放索引
    
    useEffect(() => {
        function onHashchange() {
            // 路由变化时关闭播放列表
            if (previousPath !== location.hash) {
                // 直接通过 Store 关闭播放列表
                fileManager.setShowFileListPanel(false);
                
                setIsTransitioning(true);
                setPreviousPath(location.hash);
                
                // 等待淡出动画完成后更新路径
                setTimeout(() => {
                    setPath(location.hash);
                    // 等待新内容渲染后开始淡入
                    requestAnimationFrame(() => {
                        setIsTransitioning(false);
                    });
                }, 250); // 与 CSS 动画时间一致
            }
        }

        window.addEventListener("hashchange", onHashchange);

        return () => window.removeEventListener("hashchange", onHashchange);
    }, [previousPath]);
    
    // 监听文件选择事件
    useEffect(() => {
        const handleFileSelect = (event: Event) => {
            const customEvent = event as CustomEvent<{ fileNames: string[] }>;
            if (customEvent.detail?.fileNames) {
                setSelectedFiles(customEvent.detail.fileNames);
                setSearchQuery(''); // 清空搜索
            }
        };
        
        window.addEventListener('files-selected' as any, handleFileSelect as any);
        return () => window.removeEventListener('files-selected' as any, handleFileSelect as any);
    }, []);

    // 监听文件列表面板显示状态
    useEffect(() => {
        const handlePanelToggle = (event: Event) => {
            const customEvent = event as CustomEvent<{ show: boolean }>;
            setShowFileListPanel(customEvent.detail?.show || false);
        };
        
        window.addEventListener('file-list-panel-toggle' as any, handlePanelToggle as any);
        return () => window.removeEventListener('file-list-panel-toggle' as any, handlePanelToggle as any);
    }, []);
    
    // 监听当前播放文件变化事件（来自 footer.tsx）
    useEffect(() => {
        const handleCurrentPlayingFileChange = (event: Event) => {
            const customEvent = event as CustomEvent<{ fileName: string }>;
            if (customEvent.detail?.fileName) {
                setCurrentPlayingFile(customEvent.detail.fileName);
            }
        };
        
        window.addEventListener('current-playing-file-change' as any, handleCurrentPlayingFileChange as any);
        return () => window.removeEventListener('current-playing-file-change' as any, handleCurrentPlayingFileChange as any);
    }, []);

    // 过滤后的音频文件列表
    const audioFiles = selectedFiles.filter(isAudioFile);
    
    // 搜索过滤后的音频文件
    const filteredAudioFiles = searchQuery
        ? audioFiles.filter(file => file.toLowerCase().includes(searchQuery.toLowerCase()))
        : audioFiles;

    // 处理清除文件
    const handleClearFiles = () => {
        setSelectedFiles([]);
        setSearchQuery('');
        setCurrentTrackIndex(-1);
        setCurrentPlayingFile('');
        setFileObjects(new Map());
        
        // 清理 IndexedDB 中的所有 tracks
        playlistManager.clearAllTracks().catch(err => {
            console.error('清理播放列表失败:', err);
        });
    };

    // 处理删除单个文件
    const handleRemoveFile = (fileName: string) => {
        // 从 selectedFiles 中移除
        const newSelectedFiles = selectedFiles.filter(f => f !== fileName);
        setSelectedFiles(newSelectedFiles);
        
        // 从 fileObjects 中移除
        const newFileObjects = new Map(fileObjects);
        newFileObjects.delete(fileName);
        setFileObjects(newFileObjects);
        
        // 如果删除的是当前播放的文件，停止播放
        if (fileName === currentPlayingFile) {
            setCurrentPlayingFile('');
            setCurrentTrackIndex(-1);
        }
        
        // 从 IndexedDB 中移除该 track（使用 deleteTrack 方法）
        playlistManager.deleteTrack(fileName).catch((err: unknown) => {
            console.error('从播放列表移除文件失败:', err);
        });
        
        // 通知 Footer 组件更新播放列表
        window.dispatchEvent(new CustomEvent('remove-file-from-playlist', {
            detail: { fileName }
        }));
    };

    // 处理打开文件
    const handleOpenFileFromPanel = useCallback(() => {
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = true; // 允许多选
        // 不设置 accept 属性，允许选择所有文件类型（Android Chrome 兼容）
        input.onchange = (e) => {
            const files = (e.target as HTMLInputElement).files;
            if (files && files.length > 0) {
                // 提取所有文件名
                const fileNames = Array.from(files).map(f => f.name);
                
                // 存储文件对象
                const newFileMap = new Map(fileObjects);
                Array.from(files).forEach(file => {
                    newFileMap.set(file.name, file);
                });
                setFileObjects(newFileMap);
                
                // 更新状态
                setSelectedFiles(fileNames);
                setSearchQuery(''); // 清空搜索
                
                // 触发事件通知 Content 组件
                window.dispatchEvent(new CustomEvent('files-selected', {
                    detail: { fileNames }
                }));
                
                // 通知 Footer 组件添加文件到播放列表
                const audioFiles = Array.from(files).filter(file => 
                    file.type.startsWith('audio/') || 
                    ['.ncm', '.qmcflac', '.qmc0', '.qmc1', '.qmc2', '.qmc3', '.qmcogg'].some(ext => file.name.toLowerCase().endsWith(ext))
                );
                
                const lrcFiles = Array.from(files).filter(file => file.name.toLowerCase().endsWith('.lrc'));
                
                // 为每个音频文件查找匹配的 LRC 文件
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
                window.dispatchEvent(new CustomEvent('add-files-to-playlist', {
                    detail: { tracks }
                }));
            }
        };
        input.click();
    }, [fileObjects]);

    // 初始化播放列表管理器
    useEffect(() => {
        playlistManager.init().catch(err => {
            console.error('播放列表管理器初始化失败:', err);
        });
        
        return () => {
            // 组件卸载时不需要关闭数据库
        };
    }, []);

    // 保存文件到 IndexedDB
    const saveTrackToDB = useCallback((track: { id: string; name: string; fileName: string; file?: File; lrcFile?: File }) => {
        playlistManager.saveTrack(track).catch(err => {
            console.error('保存音轨失败:', err);
        });
    }, []);

    // 处理点击文件列表中的歌曲（加载并播放）
    const handlePlayFile = useCallback((fileName: string) => {
        // 查找对应的文件对象
        const file = fileObjects.get(fileName);
        if (!file) {
            console.warn(`文件 ${fileName} 不存在`);
            return;
        }
        
        // 查找同名的 LRC 文件
        let lrcFile: File | undefined;
        const baseName = fileName.substring(0, fileName.lastIndexOf('.'));
        const _extension = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
        
        // 遍历所有文件，查找同名 LRC 文件
        for (const [name, fileObj] of fileObjects) {
            if (name.toLowerCase().endsWith('.lrc')) {
                const lrcBaseName = name.substring(0, name.lastIndexOf('.'));
                if (lrcBaseName === baseName) {
                    lrcFile = fileObj;
                    break;
                }
            }
        }
        
        // 更新当前播放索引
        const trackIndex = selectedFiles.indexOf(fileName);
        if (trackIndex !== -1) {
            setCurrentTrackIndex(trackIndex);
        }
        
        // 保存到 IndexedDB
        const id = `${fileName}-${file.size}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        const name = fileName.substring(0, fileName.lastIndexOf('.'));
        saveTrackToDB({ id, name, fileName, file, lrcFile });
        
        // 触发事件通知 Footer 组件播放该文件
        window.dispatchEvent(new CustomEvent('play-file-from-list', {
            detail: { file, lrcFile }
        }));
        
        // 通知 footer 更新当前播放索引
        window.dispatchEvent(new CustomEvent('track-index-change', {
            detail: { index: trackIndex }
        }));
        
        setCurrentPlayingFile(fileName);
    }, [fileObjects, selectedFiles, saveTrackToDB]);

    // 上一首歌 - 暂时禁用
    const _onPreviousTrack = useCallback(() => {
        // TODO: 实现上一曲功能
    }, []);

    // 下一首歌 - 暂时禁用
    const _onNextTrack = useCallback((_mode?: number) => {
        // TODO: 实现下一曲功能
    }, []);

    // 调性检测函数（使用轻量级实现）
    const detectAudioKey = useCallback(async (file: File, startTime: number = 0) => {
        // 通知 Header 开始检测
        window.dispatchEvent(new CustomEvent('key-detection-update', {
            detail: { fullKey: '', isDetecting: true }
        }));
        
        try {
            // 执行调性检测，支持从指定时间点开始
            const result = await simpleKeyDetector.detectKeyFromFile(file, startTime);
            
            // 通知 Header 检测结果
            window.dispatchEvent(new CustomEvent('key-detection-update', {
                detail: { fullKey: result.fullKey, isDetecting: false }
            }));
        } catch (error: any) {
            // 忽略 AbortError，这通常是由于快速切换歌曲导致的
            if (error.name !== 'AbortError') {
                console.error('[Content] 调性检测失败:', error);
            }
            
            // 通知 Header 检测失败
            window.dispatchEvent(new CustomEvent('key-detection-update', {
                detail: { fullKey: '', isDetecting: false }
            }));
        }
    }, []);

    // 监听手动触发调性检测事件
    useEffect(() => {
        const handleTriggerDetection = async () => {
            let fileToDetect: File | undefined;
            
            // 优先使用当前播放的文件
            if (currentPlayingFile && fileObjects.has(currentPlayingFile)) {
                fileToDetect = fileObjects.get(currentPlayingFile);
            } else {
                // 如果没有当前播放文件，尝试从 fileObjects 中找到第一个 MP3 文件
                const audioFileName = Array.from(fileObjects.keys()).find(name => 
                    name.endsWith('.mp3') || name.endsWith('.wav') || name.endsWith('.flac')
                );
                
                if (audioFileName) {
                    fileToDetect = fileObjects.get(audioFileName);
                }
            }
            
            if (fileToDetect) {
                // 获取当前播放时间
                const currentTime = audioRef.currentTime || 0;
                // 从当前播放时间开始检测
                await detectAudioKey(fileToDetect, currentTime);
            }
        };
        
        window.addEventListener('trigger-key-detection' as any, handleTriggerDetection as any);
        return () => window.removeEventListener('trigger-key-detection' as any, handleTriggerDetection as any);
    }, [currentPlayingFile, fileObjects, detectAudioKey]);

    const [lrcState, lrcDispatch] = useLrc(() => {
        return {
            text: STRINGS.emptyString,  // 不再从 localStorage 加载，每次启动都是空的
            options: trimOptions,
            select: 0,  // 重置选择索引
        };
    });
    
    // 监听自动加载歌词事件
    useEffect(() => {
        const onLoadLrc = (event: CustomEvent<{ text: string }>) => {
            lrcDispatch({
                type: LrcActionType.parse,
                payload: { text: event.detail.text, options: trimOptions },
            });
        };
        
        window.addEventListener('load-lrc', onLoadLrc as EventListener);
        
        return () => window.removeEventListener('load-lrc', onLoadLrc as EventListener);
    }, [lrcDispatch, trimOptions]);
    
    // 监听 LRC 文件加载事件（来自 player-soundtouch.tsx）
    useEffect(() => {
        const handleLoadLrcFile = async (event: Event) => {
            const customEvent = event as CustomEvent<{ lrcFile: File }>;
            if (customEvent.detail?.lrcFile) {
                try {
                    const text = await customEvent.detail.lrcFile.text();
                    lrcDispatch({ type: LrcActionType.parse, payload: { text, options: {} } });
                } catch (error) {
                    console.error('[Content] Failed to load LRC file:', error);
                }
            }
        };
        
        window.addEventListener('load-lrc-file' as any, handleLoadLrcFile as any);
        return () => window.removeEventListener('load-lrc-file' as any, handleLoadLrcFile as any);
    }, [lrcDispatch]);

    useEffect(() => {
        return audioStatePubSub.sub(self.current, (data) => {
            if (data.type === AudioActionType.getDuration) {
                lrcDispatch({
                    type: LrcActionType.info,
                    payload: {
                        name: "length",
                        value: convertTimeToTag(data.payload, prefState.fixed, false),
                    },
                });
            }
        });
    }, [lrcDispatch, prefState.fixed]);

    useEffect(() => {
        function saveState(): void {
            lrcDispatch({
                type: LrcActionType.getState,
                payload: (lrc) => {
                    localStorage.setItem(LSK.lyric, stringify(lrc, prefState));
                    sessionStorage.setItem(SSK.selectIndex, lrc.selectIndex.toString());
                },
            });

            localStorage.setItem(LSK.preferences, JSON.stringify(prefState));
        }

        function clearLrcOnClose(): void {
            // 关闭时清除当前打开的歌词文件
            localStorage.removeItem(LSK.lyric);
            sessionStorage.removeItem(SSK.selectIndex);
        }

        function onVisibilitychange() {
            if (document.hidden) {
                saveState();
            }
        }

        document.addEventListener("visibilitychange", onVisibilitychange);
        window.addEventListener("beforeunload", clearLrcOnClose);

        return () => {
            document.removeEventListener("visibilitychange", onVisibilitychange);
            window.removeEventListener("beforeunload", clearLrcOnClose);
        };
    }, [lrcDispatch, prefState]);

    useEffect(() => {
        function onDrop(ev: DragEvent) {
            const file = ev.dataTransfer?.files[0];
            if (file && (file.type.startsWith("text/") || /(?:\.lrc|\.txt)$/i.test(file.name))) {
                const fileReader = new FileReader();

                const onload = (): void => {
                    lrcDispatch({
                        type: LrcActionType.parse,
                        payload: { text: fileReader.result as string, options: trimOptions },
                    });
                };

                fileReader.addEventListener("load", onload, {
                    once: true,
                });

                // 不自动跳转页面，保持在当前页面
                // location.hash = ROUTER.editor;

                fileReader.readAsText(file, "utf-8");
            }
        }
        document.documentElement.addEventListener("drop", onDrop);
        return () => document.documentElement.removeEventListener("drop", onDrop);
    }, [lrcDispatch, trimOptions]);

    useEffect(() => {
        const values = {
            [ThemeMode.light]: "light",
            [ThemeMode.dark]: "dark",
        } as const;

        document.documentElement.dataset.theme = values[prefState.themeMode];
    }, [prefState.themeMode]);

    useEffect(() => {
        const rgb = hex2rgb(prefState.themeColor);
        document.documentElement.style.setProperty("--theme-rgb", rgb.join(", "));

        // https://www.w3.org/TR/WCAG20/#contrast-ratiodef
        // const contrast = (rgb1, rgb2) => {
        //   const c1 = luminanace(...rgb1) + 0.05;
        //   const c2 = luminanace(...rgb2) + 0.05;
        //   return c1 > c2 ? c1 / c2 : c2 / c1;
        // };

        // c: color ; b: black; w: white;
        // if we need black text
        //
        // (lum(c) + 0.05) / (l(b) + 0.05) > (l(w) + 0.05) / (lum(c) + 0.05);
        // => (lum(c) + 0.05)^2 > (l(b) +0.05) * (l(w) + 0.05) = 1.05 * 0.05 = 0.0525

        const lum = luminanace(...rgb);
        const con = lum + 0.05;
        const contrastColor = con * con > 0.0525 ? "var(--black)" : "var(--white)";
        document.documentElement.style.setProperty("--theme-contrast-color", contrastColor);
    }, [prefState.themeColor]);

    const content = ((): JSX.Element => {
        switch (path.slice(1)) {
            case ROUTER.home:
            case ROUTER.player: {
                if (lrcState.lyric.length === 0) {
                    // 没有歌词时显示帮助界面，但路由仍然在 player
                    return <AkariNotFound />;
                }
                return <LazyPlayer state={lrcState} dispatch={lrcDispatch} />;
            }

            case ROUTER.editor: {
                return <LazyEditor lrcState={lrcState} lrcDispatch={lrcDispatch} />;
            }

            case ROUTER.synchronizer: {
                if (lrcState.lyric.length === 0) {
                    return <AkariNotFound />;
                }
                return <LazySynchronizer state={lrcState} dispatch={lrcDispatch} />;
            }

            case ROUTER.tune: {
                return <LazyTune lrcState={lrcState} lrcDispatch={lrcDispatch} />;
            }

            case ROUTER.lrcutils: {
                return <LazyLrcUtils lrcState={lrcState} lrcDispatch={lrcDispatch} />;
            }

            case ROUTER.gist: {
                return <LazyGist lrcDispatch={lrcDispatch} langName={prefState.lang} />;
            }

            case ROUTER.preferences: {
                return <LazyPreferences />;
            }
            
            case ROUTER.playerSoundTouchJS: {
                if (lrcState.lyric.length === 0) {
                    return <AkariNotFound />;
                }
                return <LazyPlayerSoundTouch state={lrcState} dispatch={lrcDispatch} />;
            }
            
            default: {
                // 默认重定向到 player 页面
                location.hash = ROUTER.player;
                return <AkariOdangoLoading />;
            }
        }
    })();

    return (
        <main className={`app-main${isTransitioning ? ' page-transition-out' : ' page-transition-in'}`}>
            {/* 文件列下面板 - 使用重构后的组件 */}
            {showFileListPanel && (
                <FileListPanel 
                    onClose={() => setShowFileListPanel(false)}
                    lang={lang}
                />
            )}
            
            <Suspense fallback={<AkariOdangoLoading />}>{content}</Suspense>
        </main>
    );
};

// https://www.w3.org/TR/WCAG20/#relativeluminancedef
const luminanace = (...rgb: [number, number, number]): number => {
    return rgb
        .map((v) => v / 255)
        .map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)))
        .reduce((p, c, i) => {
            return p + c * [0.2126, 0.7152, 0.0722][i];
        }, 0);
};

const hex2rgb = (hex: string): [number, number, number] => {
    hex = hex.slice(1);
    const value = Number.parseInt(hex, 16);
    const r = (value >> 0x10) & 0xff;
    const g = (value >> 0x08) & 0xff;
    const b = (value >> 0x00) & 0xff;
    return [r, g, b];
};
