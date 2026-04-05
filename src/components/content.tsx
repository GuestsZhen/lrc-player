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

    const [path, setPath] = useState(location.hash);
    const [previousPath, setPreviousPath] = useState(location.hash);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<string[]>([]); // 所有文件（后台保留）
    const [searchQuery, setSearchQuery] = useState<string>(''); // 搜索关键词
    const [showFileListPanel, setShowFileListPanel] = useState(false); // 文件列表面板显示状态
    const [audioSrc, setAudioSrc] = useState<string>(''); // 当前音频源
    const [currentPlayingFile, setCurrentPlayingFile] = useState<string>(''); // 当前播放的文件名
    const [fileObjects, setFileObjects] = useState<Map<string, File>>(new Map()); // 存储文件对象
    
    useEffect(() => {
        function onHashchange() {
            // 如果有前一个页面，开始过渡动画
            if (previousPath !== location.hash) {
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

    // 过滤后的音频文件列表
    const audioFiles = selectedFiles.filter(isAudioFile);
    
    // 搜索过滤后的音频文件
    const filteredAudioFiles = searchQuery
        ? audioFiles.filter(file => file.toLowerCase().includes(searchQuery.toLowerCase()))
        : audioFiles;

    const handleClearFiles = () => {
        setSelectedFiles([]);
        setSearchQuery('');
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
                
                // 注意：不再触发 header-file-open 事件，只记录文件路径，不自动载入
            }
        };
        input.click();
    }, [fileObjects]);

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
        const extension = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
        
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
        
        // 触发事件通知 Footer 组件播放该文件
        window.dispatchEvent(new CustomEvent('play-file-from-list', {
            detail: { file, lrcFile }
        }));
        setCurrentPlayingFile(fileName);
    }, [fileObjects]);

    const [lrcState, lrcDispatch] = useLrc(() => {
        return {
            text: localStorage.getItem(LSK.lyric) || STRINGS.emptyString,
            options: trimOptions,
            select: Number.parseInt(sessionStorage.getItem(SSK.selectIndex)!, 10) || 0,
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

        function onVisibilitychange() {
            if (document.hidden) {
                saveState();
            }
        }

        document.addEventListener("visibilitychange", onVisibilitychange);
        window.addEventListener("beforeunload", saveState);

        return () => {
            document.removeEventListener("visibilitychange", onVisibilitychange);
            window.removeEventListener("beforeunload", saveState);
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
            [ThemeMode.auto]: "auto",
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
            
            default: {
                // 默认重定向到 player 页面
                location.hash = ROUTER.player;
                return <AkariOdangoLoading />;
            }
        }
    })();

    return (
        <main className={`app-main${isTransitioning ? ' page-transition-out' : ' page-transition-in'}`}>
            {/* 文件列表面板 */}
            {showFileListPanel && (
                <div className="selected-files-panel">
                    <div className="selected-files-header">
                        <span>{lang.playlist?.title || '文件列表'}</span>
                        <div className="header-actions">
                            {selectedFiles.length > 0 && (
                                <button 
                                    className="clear-files-action-btn"
                                    onClick={handleClearFiles}
                                    title={lang.playlist?.clearPlaylist || '清除文件列表'}
                                >
                                    <DeleteSVG />
                                </button>
                            )}
                            <button 
                                className="close-files-btn"
                                onClick={() => setShowFileListPanel(false)}
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
                                            onClick={() => handlePlayFile(fileName)}
                                        >
                                            <div className="file-name-wrapper">
                                                <span 
                                                    className="file-name file-name-scroll" 
                                                    title={displayName}
                                                    data-text={displayName}
                                                >
                                                    {displayName + '\u00A0\u00A0\u00A0' + displayName}
                                                </span>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                            
                            {/* 底部搜索框 */}
                            <div className="file-search-box">
                                <button
                                    className="file-search-open-btn"
                                    onClick={handleOpenFileFromPanel}
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
                                onClick={handleOpenFileFromPanel}
                            >
                                {lang.playlist?.openFile || '打开文件'}
                            </button>
                        </div>
                    )}
                </div>
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
