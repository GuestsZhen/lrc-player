import LSK from "#const/local_key.json" assert { type: "json" };
import { type State as LrcState, stringify, parser } from "@lrc-maker/lrc-parser";
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { Action as LrcAction } from "../hooks/useLrc.js";
import { appContext } from "./app.context.js";
import { prependHash } from "../utils/router.js";
import ROUTER from "#const/router.json" assert { type: "json" };
import { CopySVG, DownloadSVG, CloseSVG } from "./svg.js";
import "./lrc-utils.css";

interface ILyric {
    time?: number;
    text: string;
}

const disableCheck = {
    autoCapitalize: "none",
    autoComplete: "off",
    autoCorrect: "off",
    spellCheck: false,
};

type HTMLInputLikeElement = HTMLInputElement & HTMLTextAreaElement;

// 从 lrc-utils2 导入 compressTags
const compressTags = (state: LrcState, option: any): string => {
    const { spaceStart = 0, spaceEnd = 0, fixed = 3 } = option;
    
    // 简单实现：使用现有的 stringify 函数
    return stringify(state, { spaceStart, spaceEnd, fixed });
};

export const LrcUtils: React.FC<{
    lrcState: LrcState;
    lrcDispatch: React.Dispatch<LrcAction>;
}> = (_props) => {
    const { prefState, trimOptions, lang } = useContext(appContext);

    const inputRef = useRef<HTMLInputLikeElement>(null);
    const outputRef = useRef<HTMLInputLikeElement>(null);
    const overwriteRef = useRef<HTMLInputLikeElement>(null);

    // 状态管理
    const [timeTransformDialogOpen, setTimeTransformDialogOpen] = useState(false);
    const [splitTranslationDialogOpen, setSplitTranslationDialogOpen] = useState(false);
    const [isOverwriteMode, setIsOverwriteMode] = useState(false);
    const [overwriteValue, setOverwriteValue] = useState("");
    const [timeOffset, setTimeOffset] = useState(0);
    const [transformA, setTransformA] = useState(1);
    const [transformC, setTransformC] = useState(0);
    const [splitRegex, setSplitRegex] = useState("(.+)\\s*?/\\s*?(.+)");

    // 初始化时从 localStorage 加载歌词
    useEffect(() => {
        const lyricText = localStorage.getItem(LSK.lyric) || "";
        if (inputRef.current) {
            inputRef.current.value = lyricText;
        }
        console.log('[LrcUtils] Loaded lyric from localStorage:', lyricText ? `${lyricText.length} chars` : 'empty');
    }, []);

    // 输入框 blur 时保存状态
    const onInputBlur = useCallback(() => {
        if (inputRef.current) {
            localStorage.setItem(LSK.lyric, inputRef.current.value);
        }
    }, []);

    // 原文本工具函数
    const onCopyOriginalClick = useCallback(() => {
        if (!inputRef.current) return;
        inputRef.current.select();
        document.execCommand("copy");
    }, []);

    const onDownloadOriginalClick = useCallback(() => {
        if (!inputRef.current) return;
        const blob = new Blob([inputRef.current.value], { type: "text/plain;charset=UTF-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "original-lrc.txt";
        a.click();
        URL.revokeObjectURL(url);
    }, []);

    const onClearOriginalClick = useCallback(() => {
        if (!inputRef.current) return;
        inputRef.current.value = "";
        localStorage.setItem(LSK.lyric, "");
        if (outputRef.current) {
            outputRef.current.value = "";
        }
    }, []);

    // 输出文本工具函数
    const onCopyOutputClick = useCallback(() => {
        if (!outputRef.current) return;
        outputRef.current.select();
        document.execCommand("copy");
    }, []);

    const onDownloadOutputClick = useCallback(() => {
        if (!outputRef.current) return;
        const blob = new Blob([outputRef.current.value], { type: "text/plain;charset=UTF-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "processed-lrc.txt";
        a.click();
        URL.revokeObjectURL(url);
    }, []);

    // 工具按钮点击处理
    const onToolClick = useCallback((action: string) => {
        if (!inputRef.current) return;

        const lrc = parser(inputRef.current.value, trimOptions);

        switch (action) {
            case "compressTags": {
                if (outputRef.current) {
                    outputRef.current.value = compressTags(lrc, prefState);
                }
                return;
            }

            case "removeTags": {
                const info = new Map<string, string>();
                const lyric = lrc.lyric.map((line) => ({ text: line.text }));
                if (outputRef.current) {
                    outputRef.current.value = stringify({ info, lyric }, prefState);
                }
                return;
            }

            case "removeEmpty": {
                const info = lrc.info;
                const lyric = lrc.lyric.filter((line) => line.text.trim().length > 0);
                if (outputRef.current) {
                    outputRef.current.value = stringify({ info, lyric }, prefState);
                }
                return;
            }

            case "changeOffset": {
                setTimeTransformDialogOpen(true);
                return;
            }

            case "splitTranslation": {
                setSplitTranslationDialogOpen(true);
                return;
            }

            case "lrcOverwrite": {
                const newIsOverwriteMode = !isOverwriteMode;
                setIsOverwriteMode(newIsOverwriteMode);
                
                if (newIsOverwriteMode) {
                    // 进入覆写模式时，将当前歌词格式化为单行显示
                    const formattedLrc = stringify(lrc, prefState);
                    if (inputRef.current) {
                        inputRef.current.value = formattedLrc;
                    }
                    if (overwriteRef.current) {
                        overwriteRef.current.focus();
                    }
                } else {
                    // 退出覆写模式时，恢复原始歌词
                    const originalLrc = localStorage.getItem(LSK.lyric) || "";
                    if (inputRef.current) {
                        inputRef.current.value = originalLrc;
                    }
                }
                return;
            }
        }
    }, [trimOptions, prefState, isOverwriteMode]);

    // 时间变换处理
    const onTimeTransformChange = useCallback(() => {
        if (!inputRef.current) return;

        const lrc = parser(inputRef.current.value, trimOptions);
        const info = lrc.info;
        
        const scale = {
            a: transformA,
            c: transformC + timeOffset / -1000,
        };

        const lyric = lrc.lyric.map((line) => {
            if (line.time !== undefined) {
                return {
                    ...line,
                    time: scale.a * line.time + scale.c,
                };
            }
            return line;
        });

        if (outputRef.current) {
            outputRef.current.value = stringify({ info, lyric }, prefState);
        }
    }, [trimOptions, prefState, transformA, transformC, timeOffset]);

    // 翻译拆分处理
    const onSplitTranslationChange = useCallback((regexStr: string) => {
        if (!inputRef.current) return;

        const lrc = parser(inputRef.current.value, trimOptions);
        const info = lrc.info;

        try {
            const regex = new RegExp(regexStr);
            const [lyric1, lyric2] = lrc.lyric.reduce(
                (p, line) => {
                    const result = line.text.match(regex);
                    if (result !== null && result.length >= 3) {
                        p[0].push({ ...line, text: result[1] });
                        p[1].push({ ...line, text: result[2] });
                    } else {
                        p[0].push(line);
                        p[1].push(line);
                    }
                    return p;
                },
                [[] as ILyric[], [] as ILyric[]]
            );

            if (outputRef.current) {
                outputRef.current.value = [lyric1, lyric2]
                    .map((lyric) => stringify({ info, lyric }, prefState))
                    .join("\r\n".repeat(3));
            }
        } catch (error) {
            console.error('正则表达式错误:', error);
        }
    }, [trimOptions, prefState]);

    // 覆写模式处理
    const onOverwriteChange = useCallback((value: string) => {
        setOverwriteValue(value);
        if (!inputRef.current) return;

        const lines = value.split("\n");
        const currentLrc = parser(inputRef.current.value, trimOptions);
        const info = currentLrc.info;
        
        // 为每一行输入的歌词分配原始的时间戳
        const lyric: ILyric[] = lines.map((text, i) => ({
            time: currentLrc.lyric[i]?.time,
            text,
        }));

        if (outputRef.current) {
            outputRef.current.value = stringify({ info, lyric }, prefState);
        }
    }, [trimOptions, prefState]);

    // 同步滚动 - 使用 requestAnimationFrame 避免强制重排
    const onOverwriteScroll = useCallback(() => {
        const overwrite = overwriteRef.current;
        const output = outputRef.current;
        const input = inputRef.current;
        
        if (!overwrite || !output || !input) return;
        
        // 缓存滚动位置，避免多次读取 DOM
        const scrollTop = overwrite.scrollTop;
        const scrollLeft = overwrite.scrollLeft;
        
        // 使用 requestAnimationFrame 批量更新，避免强制重排
        requestAnimationFrame(() => {
            output.scrollTop = scrollTop;
            output.scrollLeft = scrollLeft;
            input.scrollTop = scrollTop;
            input.scrollLeft = scrollLeft;
        });
    }, []);

    // 渲染覆写模式的 padding
    const timePaddingText = useMemo(() => {
        return stringify(
            {
                info: new Map(),
                lyric: [{ time: 0, text: "" }],
            },
            prefState
        );
    }, [prefState]);

    return (
        <>
            <div className="app-lrc-utils">
                {/* Header */}
                <header className="lrc-utils-header">
                    <section className="button-group actions">
                        <button className="ripple" onClick={() => onToolClick("compressTags")}>{lang.lrcUtils.compressTags}</button>
                        <button className="ripple" onClick={() => onToolClick("removeTags")}>{lang.lrcUtils.removeTags}</button>
                        <button className="ripple" onClick={() => onToolClick("removeEmpty")}>{lang.lrcUtils.removeEmpty}</button>
                        <button className="ripple" onClick={() => onToolClick("changeOffset")}>{lang.lrcUtils.changeOffset}</button>
                        <button className="ripple" onClick={() => onToolClick("splitTranslation")}>{lang.lrcUtils.splitTranslation}</button>
                        <button className="ripple" onClick={() => onToolClick("lrcOverwrite")}>{lang.lrcUtils.lrcOverwrite}</button>
                    </section>
                </header>

                {/* Main content */}
                <main className={`lrc-utils-main ${isOverwriteMode ? 'overwrite-mode' : ''}`}>
                    <div className="lrc-utils-panel">
                        <div className="lrc-utils-panel-header">
                            <h3>{lang.lrcUtils.originalText}</h3>
                            <div className="lrc-utils-panel-tools">
                                <button className="lrc-utils-panel-tool ripple" title={lang.lrcUtils.copyOriginal} onClick={onCopyOriginalClick}>
                                    <CopySVG />
                                </button>
                                <a
                                    className="lrc-utils-panel-tool ripple"
                                    title={lang.lrcUtils.downloadOriginal}
                                    onClick={onDownloadOriginalClick}
                                >
                                    <DownloadSVG />
                                </a>
                                <button className="lrc-utils-panel-tool ripple" title={lang.lrcUtils.clearOriginal} onClick={onClearOriginalClick}>
                                    <CloseSVG />
                                </button>
                            </div>
                        </div>
                        <textarea
                            ref={inputRef}
                            className="lrc-utils-input"
                            onBlur={onInputBlur}
                            {...disableCheck}
                        />
                    </div>
                    
                    <div className="lrc-utils-panel">
                        <div className="lrc-utils-panel-header">
                            <h3>{lang.lrcUtils.processedText}</h3>
                            <div className="lrc-utils-panel-tools">
                                <button className="lrc-utils-panel-tool ripple" title={lang.lrcUtils.copyProcessed} onClick={onCopyOutputClick}>
                                    <CopySVG />
                                </button>
                                <a
                                    className="lrc-utils-panel-tool ripple"
                                    title={lang.lrcUtils.downloadProcessed}
                                    onClick={onDownloadOutputClick}
                                >
                                    <DownloadSVG />
                                </a>
                            </div>
                        </div>
                        <textarea
                            ref={outputRef}
                            className="lrc-utils-output"
                            readOnly
                            {...disableCheck}
                        />
                    </div>
                    
                    <textarea
                        ref={overwriteRef}
                        className="lrc-utils-overwrite"
                        value={overwriteValue}
                        onChange={(e) => onOverwriteChange(e.target.value)}
                        onScroll={onOverwriteScroll}
                        {...disableCheck}
                    />
                </main>

                {/* Time Transform Dialog */}
                {timeTransformDialogOpen && (
                    <details className="dialog time-transform" open>
                        <summary onClick={() => setTimeTransformDialogOpen(false)}></summary>
                        <section>
                            <form onSubmit={(e) => { e.preventDefault(); setTimeTransformDialogOpen(false); }}>
                                <fieldset>
                                    <legend>offset (ms)</legend>
                                    <input
                                        type="number"
                                        placeholder="offset (ms)"
                                        value={timeOffset}
                                        onChange={(e) => {
                                            setTimeOffset(Number.parseInt(e.target.value) || 0);
                                            onTimeTransformChange();
                                        }}
                                        step="100"
                                        required
                                    />
                                </fieldset>
                                <fieldset>
                                    <legend>线性变换</legend>
                                    <code>f(t) = </code>
                                    <input
                                        type="number"
                                        placeholder="a"
                                        value={transformA}
                                        onChange={(e) => {
                                            setTransformA(Number.parseFloat(e.target.value) || 1);
                                            onTimeTransformChange();
                                        }}
                                        step="0.1"
                                        required
                                    />
                                    <code> × t + </code>
                                    <input
                                        type="number"
                                        placeholder="c"
                                        value={transformC}
                                        onChange={(e) => {
                                            setTransformC(Number.parseFloat(e.target.value) || 0);
                                            onTimeTransformChange();
                                        }}
                                        step="0.1"
                                        required
                                    />
                                </fieldset>
                            </form>
                        </section>
                    </details>
                )}

                {/* Split Translation Dialog */}
                {splitTranslationDialogOpen && (
                    <details className="dialog split-translation" open>
                        <summary onClick={() => setSplitTranslationDialogOpen(false)}></summary>
                        <section>
                            <form onSubmit={(e) => { e.preventDefault(); setSplitTranslationDialogOpen(false); }}>
                                <label>
                                    <input
                                        type="radio"
                                        name="split"
                                        value="(.+)\\s*?/\\s*?(.+)"
                                        onChange={() => {
                                            setSplitRegex("(.+)\\s*?/\\s*?(.+)");
                                            onSplitTranslationChange("(.+)\\s*?/\\s*?(.+)");
                                        }}
                                    />
                                    歌词 / 翻译
                                </label>
                                <label>
                                    <input
                                        type="radio"
                                        name="split"
                                        value="(.+)\\s*?\\\\\\s*?(.+)"
                                        onChange={() => {
                                            setSplitRegex("(.+)\\s*?\\\\\\s*?(.+)");
                                            onSplitTranslationChange("(.+)\\s*?\\\\\\s*?(.+)");
                                        }}
                                    />
                                    歌词 \ 翻译
                                </label>
                                <label>
                                    <input
                                        type="radio"
                                        name="split"
                                        value="(.+)\\s*?\\|\\s*?(.+)"
                                        onChange={() => {
                                            setSplitRegex("(.+)\\s*?\\|\\s*?(.+)");
                                            onSplitTranslationChange("(.+)\\s*?\\|\\s*?(.+)");
                                        }}
                                    />
                                    歌词 | 翻译
                                </label>
                                <label>
                                    <input
                                        type="radio"
                                        name="split"
                                        value="(.+)\\s*?「(.+)」"
                                        onChange={() => {
                                            setSplitRegex("(.+)\\s*?[(.+)]");
                                            onSplitTranslationChange("(.+)\\s*?[(.+)]");
                                        }}
                                    />
                                    歌词「翻译」
                                </label>
                                <label>
                                    <input
                                        type="radio"
                                        name="split"
                                        value="(.+)\\s*?『(.+)』"
                                        onChange={() => {
                                            setSplitRegex("(.+)\\s*?『(.+)』");
                                            onSplitTranslationChange("(.+)\\s*?『(.+)』");
                                        }}
                                    />
                                    歌词『翻译』
                                </label>
                                <label>
                                    <input
                                        type="radio"
                                        name="split"
                                        value="(.+)\\s*?【(.+)】"
                                        onChange={() => {
                                            setSplitRegex("(.+)\\s*?【(.+)】");
                                            onSplitTranslationChange("(.+)\\s*?【(.+)】");
                                        }}
                                    />
                                    歌词【翻译】
                                </label>
                                <label>
                                    <input
                                        type="radio"
                                        name="split"
                                        value="(.+)\\s*?〖(.+)〗"
                                        onChange={() => {
                                            setSplitRegex("(.+)\\s*?〖(.+)〗");
                                            onSplitTranslationChange("(.+)\\s*?〖(.+)〗");
                                        }}
                                    />
                                    歌词〖翻译〗
                                </label>
                                <label>
                                    <input
                                        type="radio"
                                        name="split"
                                        value="(.+)\\s*?[/\\\\|]|[「『【〖]([^」』】〗]+)"
                                        onChange={() => {
                                            setSplitRegex("(.+)\\s*?[/\\\\|]|[「『【〖]([^」』】〗]+)");
                                            onSplitTranslationChange("(.+)\\s*?[/\\\\|]|[「『【〖]([^」』】〗]+)");
                                        }}
                                    />
                                    模糊匹配
                                </label>
                                <input
                                    type="text"
                                    placeholder="自定义正则表达式"
                                    value={splitRegex}
                                    onChange={(e) => {
                                        setSplitRegex(e.target.value);
                                        onSplitTranslationChange(e.target.value);
                                    }}
                                />
                            </form>
                        </section>
                    </details>
                )}
            </div>
        </>
    );
};
