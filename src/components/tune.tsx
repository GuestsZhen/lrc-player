import { type State as LrcState, stringify } from "@lrc-maker/lrc-parser";
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { Action as LrcAction } from "../hooks/useLrc.js";
import { ActionType as LrcActionType } from "../hooks/useLrc.js";
import { appContext } from "./app.context.js";
import { CopySVG, DownloadSVG, CloseSVG } from "./svg.js";

const disableCheck = {
    autoCapitalize: "none",
    autoComplete: "off",
    autoCorrect: "off",
    spellCheck: false,
};

type HTMLInputLikeElement = HTMLInputElement & HTMLTextAreaElement;

type UseDefaultValue<T = React.RefObject<HTMLInputLikeElement>> = (
    defaultValue: string,
    ref?: T,
) => { defaultValue: string; ref: T };

const useDefaultValue: UseDefaultValue = (defaultValue, ref) => {
    const or = <T, K>(a: T, b: K): NonNullable<T> | K => a ?? b;

    const $ref = or(ref, useRef<HTMLInputLikeElement>(null));

    useEffect(() => {
        if ($ref.current) {
            $ref.current.value = defaultValue;
        }
    }, [defaultValue, $ref]);
    return { ref: $ref, defaultValue };
};

// 简谱数字与音名的映射 (基于 C 调，支持高低八度)
// 1=C, 2=D, 3=E, 4=F, 5=G, 6=A, 7=B
// (5) = 低音 5, [5] = 高音 5
const NUM_TO_NOTE: { [key: string]: string } = {
    '1': 'C',
    '#1': 'C#',
    'b2': 'C#',
    '2': 'D',
    '#2': 'D#',
    'b3': 'D#',
    '3': 'E',
    '4': 'F',
    '#4': 'F#',
    'b5': 'F#',
    '5': 'G',
    '#5': 'G#',
    'b6': 'G#',
    '6': 'A',
    '#6': 'A#',
    'b7': 'A#',
    '7': 'B',
    // 低音（用括号表示）
    '(1)': 'C', '(#1)': 'C#', '(b2)': 'C#',
    '(2)': 'D', '(#2)': 'D#', '(b3)': 'D#',
    '(3)': 'E',
    '(4)': 'F', '(#4)': 'F#', '(b5)': 'F#',
    '(5)': 'G', '(#5)': 'G#', '(b6)': 'G#',
    '(6)': 'A', '(#6)': 'A#', '(b7)': 'A#',
    '(7)': 'B',
    // 高音（用方括号表示）
    '[1]': 'C', '[#1]': 'C#', '[b2]': 'C#',
    '[2]': 'D', '[#2]': 'D#', '[b3]': 'D#',
    '[3]': 'E',
    '[4]': 'F', '[#4]': 'F#', '[b5]': 'F#',
    '[5]': 'G', '[#5]': 'G#', '[b6]': 'G#',
    '[6]': 'A', '[#6]': 'A#', '[b7]': 'A#',
    '[7]': 'B',
};

// 音名到简谱数字的映射 (支持高低八度)
const NOTE_TO_NUM: { [key: string]: string } = {
    'C': '1',
    'C#': '#1',
    'Db': '#1',
    'D': '2',
    'D#': '#2',
    'Eb': '#2',
    'E': '3',
    'F': '4',
    'F#': '#4',
    'Gb': '#4',
    'G': '5',
    'G#': '#5',
    'Ab': '#5',
    'A': '6',
    'A#': '#6',
    'Bb': '#6',
    'B': '7',
};

// 12 个半音的音符数组
const NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const NOTE_MAP: { [key: string]: number } = {};
NOTES.forEach((note, index) => {
    NOTE_MAP[note] = index;
});

// 将简谱数字转换为实际音高（音名），考虑八度
const numToPitch = (numNote: string, fromKey: string): { pitch: string; octave: number } => {
    // 获取 fromKey 的索引
    const fromIndex = NOTE_MAP[fromKey];
    if (fromIndex === undefined) {
        return { pitch: numNote, octave: 0 };
    }

    // 检测八度标记
    let octave = 0;
    
    if (numNote.startsWith('(') && numNote.endsWith(')')) {
        octave = -1; // 低音
    } else if (numNote.startsWith('[') && numNote.endsWith(']')) {
        octave = 1; // 高音
    }

    // 获取简谱数字对应的 C 调音名
    const basePitch = NUM_TO_NOTE[numNote];
    if (!basePitch) {
        return { pitch: numNote, octave };
    }

    // 计算该音在 C 调中的索引
    const cIndex = NOTE_MAP[basePitch];
    if (cIndex === undefined) {
        return { pitch: numNote, octave };
    }

    // 计算在目标调中的实际音高
    const actualIndex = (fromIndex + cIndex) % 12;
    const actualPitch = NOTES[actualIndex];
    
    // 计算是否需要调整八度
    // 如果原调 + 音级 >= 12，说明跨过了一个八度，需要升高
    let finalOctave = octave;
    if (fromIndex + cIndex >= 12) {
        finalOctave += 1;
    }
    
    return { pitch: actualPitch, octave: finalOctave };
};

// 将实际音高转换为目标调的简谱数字，考虑八度
const pitchToNum = (pitch: string, toKey: string, octave: number): string => {
    // 获取 toKey 的索引
    const toIndex = NOTE_MAP[toKey];
    if (toIndex === undefined) {
        return pitch;
    }

    // 获取实际音高的索引
    const pitchIndex = NOTE_MAP[pitch];
    if (pitchIndex === undefined) {
        return pitch;
    }

    // 计算相对于目标调的偏移
    const relativeIndex = (pitchIndex - toIndex + 12) % 12;
    const relativePitch = NOTES[relativeIndex];
    
    // 转换为简谱数字
    let numNote = NOTE_TO_NUM[relativePitch] || pitch;
    
    // 添加八度标记
    if (octave === -1) {
        numNote = `(${numNote})`;
    } else if (octave === 1) {
        numNote = `[${numNote}]`;
    }
    
    return numNote;
};

// 转置简谱音符
const transposeNumNote = (note: string, fromKey: string, toKey: string): string => {
    // 先转换为实际音高（包含八度信息）
    const { pitch, octave } = numToPitch(note, fromKey);
    // 再转换为目标调的简谱
    return pitchToNum(pitch, toKey, octave);
};

// 转置文本中的简谱
const transposeText = (text: string, fromKey: string, toKey: string): string => {
    if (fromKey === toKey) {
        return text;
    }

    // 第一步：提取并保护时间轴（使用不含数字和升降号的占位符）
    const timePlaceholders: string[] = [];
    let timeIndex = 0;
    // 支持 2-3 位小数的时间轴格式
    const timePattern = /\[([0-9]{2}:[0-9]{2}\.[0-9]{2,3})\]/g;
    const protectedText = text.replace(timePattern, (match) => {
        // 使用字母作为占位符，避免包含数字或升降号
        const placeholder = `__T${String.fromCharCode(65 + timeIndex)}__`; // __TA__, __TB__, __TC__...
        timePlaceholders[timeIndex] = match;
        timeIndex++;
        return placeholder;
    });

    // 第二步：转调简谱（此时时间轴已保护）
    const numNotePattern = /(\([1-7](?:#|b)?\)|\[[1-7](?:#|b)?\]|[1-7](?:#|b)?)/g;
    let transposedText = protectedText.replace(numNotePattern, (match) => {
        return transposeNumNote(match, fromKey, toKey);
    });

    // 第三步：恢复时间轴
    timePlaceholders.forEach((originalTime, index) => {
        const placeholder = `__T${String.fromCharCode(65 + index)}__`;
        transposedText = transposedText.split(placeholder).join(originalTime);
    });

    return transposedText;
};

export const Tune: React.FC<{
    lrcState: LrcState;
    lrcDispatch: React.Dispatch<LrcAction>;
}> = ({ lrcState, lrcDispatch }) => {
    const { prefState, lang } = useContext(appContext);

    const [fromKey, setFromKey] = useState("C");
    const [toKey, setToKey] = useState("C");
    const originalTextarea = useRef<HTMLInputLikeElement>(null);
    const transposedTextarea = useRef<HTMLInputLikeElement>(null);
    // 保存原始歌词，防止重复转调
    const originalLyricRef = useRef<string>("");

    // 初始化时保存原始歌词
    useEffect(() => {
        originalLyricRef.current = stringify(lrcState, prefState);
    }, []);

    // 当 lrcState 变化时，更新原始歌词（解决 Synchronizer 编辑后数据不同步的问题）
    useEffect(() => {
        const currentStringified = stringify(lrcState, prefState);
        if (originalLyricRef.current !== currentStringified) {
            originalLyricRef.current = currentStringified;
            // 同时更新输入框的值
            if (originalTextarea.current) {
                originalTextarea.current.value = currentStringified;
            }
        }
    }, [lrcState, prefState]);

    // 转调后的文本
    const transposedText = useMemo(() => {
        const originalText = originalTextarea.current?.value || originalLyricRef.current;
        return transposeText(originalText, fromKey, toKey);
    }, [originalLyricRef, fromKey, toKey]);

    // 应用转调结果
    const applyTranspose = useCallback(() => {
        if (transposedTextarea.current) {
            lrcDispatch({
                type: LrcActionType.parse,
                payload: { text: transposedTextarea.current.value, options: { trimStart: true, trimEnd: true } },
            });
        }
    }, [lrcDispatch]);

    // 清除转调设置
    const clearTranspose = useCallback(() => {
        setFromKey("C");
        setToKey("C");
        const originalText = originalLyricRef.current;
        if (originalTextarea.current) {
            originalTextarea.current.value = originalText;
        }
        if (transposedTextarea.current) {
            transposedTextarea.current.value = originalText;
        }
    }, []);

    // 全选原文本
    // 复制原文本
    const onCopyOriginalClick = useCallback(() => {
        if (originalTextarea.current) {
            originalTextarea.current.select();
            document.execCommand("copy");
        }
    }, []);

    // 复制转调后的文本
    const onCopyTransposedClick = useCallback(() => {
        console.log('[DEBUG] 复制转调文本，transposedText:', transposedText);
        console.log('[DEBUG] transposedText length:', transposedText?.length);
        
        // 直接使用 transposedText，不依赖 DOM
        if (transposedText) {
            const tempTextarea = document.createElement('textarea');
            tempTextarea.value = transposedText;
            document.body.appendChild(tempTextarea);
            tempTextarea.select();
            document.execCommand('copy');
            document.body.removeChild(tempTextarea);
            console.log('[DEBUG] 复制成功');
        } else {
            console.warn('[DEBUG] transposedText 为空');
        }
    }, [transposedText]);

    // 下载原文本
    const onDownloadOriginalClick = useCallback(() => {
        if (originalTextarea.current) {
            const blob = new Blob([originalTextarea.current.value], { type: "text/plain;charset=UTF-8" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "original-lyric.lrc";
            a.click();
            URL.revokeObjectURL(url);
        }
    }, []);

    // 下载转调后的文本
    const onDownloadTransposedClick = useCallback(() => {
        console.log('[DEBUG] 下载转调文本，transposedText:', transposedText);
        console.log('[DEBUG] transposedText length:', transposedText?.length);
        
        // 直接使用 transposedText，不依赖 DOM
        if (transposedText) {
            const blob = new Blob([transposedText], { type: "text/plain;charset=UTF-8" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "transposed-lyric.lrc";
            a.click();
            URL.revokeObjectURL(url);
            console.log('[DEBUG] 下载成功');
        } else {
            console.warn('[DEBUG] transposedText 为空');
        }
    }, [transposedText]);

    // 清除原文本
    const onClearOriginalClick = useCallback(() => {
        if (originalTextarea.current) {
            originalTextarea.current.value = "";
            // 触发 input 事件，让 parser 知道内容变化了
            const event = new Event("input", { bubbles: true });
            originalTextarea.current.dispatchEvent(event);
        }
    }, [originalTextarea]);

    // 清除转调后的文本（只读，不需要清除按钮）
    // 转调后的文本是自动生成的，不需要清除功能

    // 上传文本文件
    const _onTextFileUpload = useCallback(
        (ev: React.ChangeEvent<HTMLInputElement>) => {
            if (ev.target.files === null || ev.target.files.length === 0) {
                return;
            }

            const fileReader = new FileReader();
            fileReader.addEventListener("load", () => {
                const text = fileReader.result as string;
                originalLyricRef.current = text; // 保存原始文本
                if (originalTextarea.current) {
                    originalTextarea.current.value = text;
                }
                if (transposedTextarea.current) {
                    transposedTextarea.current.value = text;
                }
            });
            fileReader.readAsText(ev.target.files[0], "UTF-8");
        },
        [],
    );

    return (
        <div className="app-editor app-tune">
            <section className="tune-header">
                <h2 className="editor-title">{lang.tune.title}</h2>
                <section className="tune-controls">
                <div className="tune-control-group">
                    <label htmlFor="tune-from-key">{lang.tune.originalKey}：</label>
                    <select
                        id="tune-from-key"
                        value={fromKey}
                        onChange={(e) => setFromKey(e.target.value)}
                        {...disableCheck}
                    >
                        {NOTES.map((note) => (
                            <option key={note} value={note}>
                                {note}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="tune-control-group">
                    <label htmlFor="tune-to-key">{lang.tune.targetKey}：</label>
                    <select
                        id="tune-to-key"
                        value={toKey}
                        onChange={(e) => setToKey(e.target.value)}
                        {...disableCheck}
                    >
                        {NOTES.map((note) => (
                            <option key={note} value={note}>
                                {note}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="tune-actions">
                    <button
                        className="tune-button ripple"
                        onClick={applyTranspose}
                        title={lang.tune.transpose}
                    >
                        {lang.tune.transpose}
                    </button>
                    <button
                        className="tune-button ripple"
                        onClick={clearTranspose}
                        title={lang.tune.reset}
                    >
                        {lang.tune.reset}
                    </button>
                </div>
                </section>
            </section>

            <section className="tune-panels">
                <div className="tune-panel">
                    <div className="tune-panel-header">
                        <h3>{lang.lrcUtils.originalText}</h3>
                        <div className="tune-panel-tools">
                            <button className="tune-panel-tool ripple" title={lang.tune.copyOriginal} onClick={onCopyOriginalClick}>
                                <CopySVG />
                            </button>
                            <a
                                className="tune-panel-tool ripple"
                                title={lang.tune.downloadOriginal}
                                onClick={onDownloadOriginalClick}
                            >
                                <DownloadSVG />
                            </a>
                            <button className="tune-panel-tool ripple" title={lang.lrcUtils.clearOriginal} onClick={onClearOriginalClick}>
                                <CloseSVG />
                            </button>
                        </div>
                    </div>
                    <textarea
                        className="tune-textarea"
                        aria-label="original lyric"
                        {...disableCheck}
                        {...useDefaultValue(stringify(lrcState, prefState), originalTextarea)}
                    />
                </div>

                <div className="tune-panel">
                    <div className="tune-panel-header">
                        <h3>{lang.tune.title}</h3>
                        <div className="tune-panel-tools">
                            <button className="tune-panel-tool ripple" title={lang.tune.copyTransposed} onClick={onCopyTransposedClick}>
                                <CopySVG />
                            </button>
                            <a
                                className="tune-panel-tool ripple"
                                title={lang.tune.downloadTransposed}
                                onClick={onDownloadTransposedClick}
                            >
                                <DownloadSVG />
                            </a>
                        </div>
                    </div>
                    <textarea
                        className="tune-textarea"
                        aria-label="transposed lyric"
                        {...disableCheck}
                        {...useDefaultValue(transposedText, transposedTextarea)}
                        readOnly={true}
                    />
                </div>
            </section>
        </div>
    );
};
