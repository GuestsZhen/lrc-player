import { type State as LrcState, stringify } from "@lrc-maker/lrc-parser";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import type { Action as LrcAction } from "../hooks/useLrc.js";
import { ActionType as LrcActionType } from "../hooks/useLrc.js";
import { appContext } from "./app.context.js";
import { CopySVG, DownloadSVG, CloseSVG } from "./svg.js";

// ✅ 完全参考数字谱转调器的算法
const TONE_MAP = ["1", "#1", "2", "#2", "3", "4", "#4", "5", "#5", "6", "#6", "7"];
const INDEX_MAP = ["#", "1", "2", "3", "4", "5", "6", "7", "(", ")", "[", "]", "（", "）", "【", "】", " "];

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

const useDefaultValue = <T = React.RefObject<HTMLInputLikeElement>>(
    defaultValue: string,
    $ref?: T,
) => {
    const ref = $ref || (useRef<HTMLInputLikeElement>(null) as unknown as T);
    useEffect(() => {
        const currentRef = ref as unknown as React.RefObject<HTMLInputLikeElement>;
        if (currentRef.current) {
            currentRef.current.value = defaultValue;
        }
    }, [defaultValue, ref]);
    return { ref, defaultValue };
};

// 调式列表（参考参考代码：1=C, 1=#C, ..., 1=B）
const KEYS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

// ✅ 将数字转换为字母（0→A, 1→B, ..., 25→Z, 26→AA, ...）
const numberToLetters = (num: number): string => {
    let result = "";
    while (num >= 0) {
        result = String.fromCharCode(65 + (num % 26)) + result;
        num = Math.floor(num / 26) - 1;
    }
    return result;
};

export const Tune: React.FC<{
    lrcState: LrcState;
    lrcDispatch: React.Dispatch<LrcAction>;
}> = ({ lrcState, lrcDispatch }) => {
    const { prefState, lang } = useContext(appContext);

    const [fromKey, setFromKey] = useState(0);  // 0-11 对应 C-B
    const [toKey, setToKey] = useState(0);
    const [transposedText, setTransposedText] = useState("");
    
    const originalTextarea = useRef<HTMLInputLikeElement>(null);
    const transposedTextarea = useRef<HTMLInputLikeElement>(null);
    const originalLyricRef = useRef<string>("");
    const [isTransposed, setIsTransposed] = useState(false);

    // 初始化时保存原始歌词
    useEffect(() => {
        originalLyricRef.current = stringify(lrcState, prefState);
    }, []);

    // 当 lrcState 变化时，更新原始歌词
    useEffect(() => {
        const currentStringified = stringify(lrcState, prefState);
        if (originalLyricRef.current !== currentStringified) {
            originalLyricRef.current = currentStringified;
            if (originalTextarea.current) {
                originalTextarea.current.value = currentStringified;
            }
        }
    }, [lrcState, prefState]);

    // ✅ 完全参考 changeIndex.js 的转调算法
    const transposeText = useCallback((text: string, mode: number): string => {
        if (mode === 0) {
            return text;
        }

        // 第一步：提取并保护时间轴
        const timePlaceholders: string[] = [];
        let timeIndex = 0;
        // ✅ 修复：使用更精确的正则表达式，并转义点号
        const timePattern = /\[([0-9]{2}:[0-9]{2}\.[0-9]{2,3})\]/g;
        const protectedText = text.replace(timePattern, (match) => {
            // ✅ 使用不含数字和#的占位符，使用字母表示索引（A-Z, AA-ZZ等）
            const placeholder = `__${numberToLetters(timeIndex)}__`;
            timePlaceholders[timeIndex] = match;
            timeIndex++;
            return placeholder;
        });

        // 第二步：执行转调
        const transposedText = transposeCore(protectedText, mode);

        // 第三步：恢复时间轴
        let result = transposedText;
        timePlaceholders.forEach((originalTime, index) => {
            // ✅ 使用相同的字母占位符格式
            const placeholder = `__${numberToLetters(index)}__`;
            result = result.split(placeholder).join(originalTime);
        });

        return result;
    }, []);

    // 核心转调算法（参考 changeIndex.js）
    const transposeCore = useCallback((text: string, mode: number): string => {
        if (mode === 0) {
            return text;
        }

        // 符号栈
        const textSymbolArr: string[] = [];
        // 当前的音高
        let tempHeight = 0;

        // 按行分割
        const lines = text.split("\n");
        const results: string[] = [];

        for (const line of lines) {
            textSymbolArr.length = 0;
            tempHeight = 0;
            results.push(lineChange(line, mode));
        }

        return results.join("\n");

        // 行内转调
        function lineChange(line: string, mode: number): string {
            let result = "";
            for (let i = 0; i < line.length; i++) {
                result += charChange(line[i], mode);
            }
            result += bracketMatch();
            return result;
        }

        // 字符变换
        function charChange(charIndex: string, mode: number): string {
            // 如果不在 indexMap 则直接返回
            if (!INDEX_MAP.includes(charIndex)) {
                charIndex = bracketMatch() + charIndex;
                return charIndex;
            }

            // 如果 charIndex 是数字
            if (!isNaN(parseInt(charIndex))) {
                let result = "";
                let height = 0;

                // 如果符号栈顶为 # 则 charIndex = # + charIndex
                if (textSymbolArr[textSymbolArr.length - 1] === "#") {
                    textSymbolArr.pop();
                    charIndex = "#" + charIndex;
                }

                // 判断当前音高
                for (let i = 0; i < textSymbolArr.length; i++) {
                    if (textSymbolArr[i] === "(") {
                        height -= 1;
                    } else if (textSymbolArr[i] === "[") {
                        height += 1;
                    }
                }

                // 修正 #3 和 #7
                if (charIndex === "#3") {
                    charIndex = "4";
                } else if (charIndex === "#7") {
                    height += 1;
                    charIndex = "1";
                }

                // 获取当前 charIndex 的对应 index 值
                let index = TONE_MAP.indexOf(charIndex);

                // 获取转调后的 index
                index = index + mode;

                // 处理转调后的音高
                if (index >= TONE_MAP.length) {
                    index = index % TONE_MAP.length;
                    height += 1;
                } else if (index < 0) {
                    index = TONE_MAP.length + index;
                    height -= 1;
                }

                // 处理音高的括号问题
                if (height !== tempHeight) {
                    if (height > tempHeight) {
                        for (let i = tempHeight + 1; i <= height; i++) {
                            if (i < 0) {
                                result += ")";
                            } else if (i > 0) {
                                result += "[";
                            } else {
                                if (tempHeight === -1) {
                                    result += ")";
                                } else if (tempHeight === 1) {
                                    result += "[";
                                }
                            }
                        }
                    } else if (height < tempHeight) {
                        for (let i = tempHeight - 1; i >= height; i--) {
                            if (i < 0) {
                                result += "(";
                            } else if (i > 0) {
                                result += "]";
                            } else {
                                if (tempHeight === -1) {
                                    result += "(";
                                } else if (tempHeight === 1) {
                                    result += "]";
                                }
                            }
                        }
                    }
                    tempHeight = height;
                }

                result += TONE_MAP[index];
                return result;
            }

            // 处理符号
            switch (charIndex) {
                case "#":
                    if (textSymbolArr[textSymbolArr.length - 1] !== "#") {
                        textSymbolArr.push("#");
                    }
                    break;
                case "(":
                case "（":
                    if (textSymbolArr[textSymbolArr.length - 1] === "#") {
                        textSymbolArr.length = textSymbolArr.length - 1;
                    }
                    textSymbolArr.push("(");
                    break;
                case ")":
                case "）":
                    for (let i = textSymbolArr.length - 1; i >= 0; i--) {
                        if (textSymbolArr[i] === "(") {
                            textSymbolArr.length = i;
                            break;
                        }
                    }
                    break;
                case "[":
                case "【":
                    if (textSymbolArr[textSymbolArr.length - 1] === "#") {
                        textSymbolArr.length = textSymbolArr.length - 1;
                    }
                    textSymbolArr.push("[");
                    break;
                case "]":
                case "】":
                    for (let i = textSymbolArr.length - 1; i >= 0; i--) {
                        if (textSymbolArr[i] === "[") {
                            textSymbolArr.length = i;
                            break;
                        }
                    }
                    break;
                default:
                    return bracketMatch() + charIndex;
            }
            return "";
        }

        // 匹配括号（用在整句结束后）
        function bracketMatch(): string {
            let result = "";
            while (tempHeight !== 0) {
                if (tempHeight > 0) {
                    result += "]";
                    tempHeight--;
                } else if (tempHeight < 0) {
                    result += ")";
                    tempHeight++;
                }
            }
            return result;
        }
    }, []);

    // 执行转调
    const handleTranspose = useCallback(() => {
        const originalText = originalTextarea.current?.value || originalLyricRef.current;
        if (!originalText) return;

        console.log('[转调调试]');
        console.log('  fromKey:', KEYS[fromKey], '(index:', fromKey, ')');
        console.log('  toKey:', KEYS[toKey], '(index:', toKey, ')');
        console.log('  semitones:', fromKey - toKey);

        const mode = fromKey - toKey;  // ✅ 参考 main.js 第147行
        const result = transposeText(originalText, mode);
        
        console.log('  结果:', result);
        setTransposedText(result);
        setIsTransposed(true);
    }, [fromKey, toKey, transposeText]);

    // 应用转调结果
    const applyTranspose = useCallback(() => {
        if (transposedText) {
            lrcDispatch({
                type: LrcActionType.parse,
                payload: { text: transposedText, options: { trimStart: true, trimEnd: true } },
            });
        }
    }, [lrcDispatch, transposedText]);

    // 清除转调设置
    const clearTranspose = useCallback(() => {
        setFromKey(0);
        setToKey(0);
        setTransposedText("");
        setIsTransposed(false);
        const originalText = originalLyricRef.current;
        if (originalTextarea.current) {
            originalTextarea.current.value = originalText;
        }
        if (transposedTextarea.current) {
            transposedTextarea.current.value = originalText;
        }
    }, []);

    // 复制原文本
    const onCopyOriginalClick = useCallback(() => {
        if (originalTextarea.current) {
            originalTextarea.current.select();
            document.execCommand("copy");
        }
    }, []);

    // 复制转调后的文本
    const onCopyTransposedClick = useCallback(() => {
        if (transposedText) {
            const tempTextarea = document.createElement('textarea');
            tempTextarea.value = transposedText;
            document.body.appendChild(tempTextarea);
            tempTextarea.select();
            document.execCommand('copy');
            document.body.removeChild(tempTextarea);
        }
    }, [transposedText]);

    // 下载原文本
    const onDownloadOriginalClick = useCallback(() => {
        const text = originalTextarea.current?.value || originalLyricRef.current;
        if (text) {
            const blob = new Blob([text], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'original.txt';
            a.click();
            URL.revokeObjectURL(url);
        }
    }, []);

    // 下载转调后的文本
    const onDownloadTransposedClick = useCallback(() => {
        if (transposedText) {
            const blob = new Blob([transposedText], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'transposed.txt';
            a.click();
            URL.revokeObjectURL(url);
        }
    }, [transposedText]);

    // 清除原文本
    const onClearOriginalClick = useCallback(() => {
        if (originalTextarea.current) {
            originalTextarea.current.value = "";
        }
    }, []);

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
                        onChange={(e) => setFromKey(parseInt(e.target.value))}
                        {...disableCheck}
                    >
                        {KEYS.map((key, index) => (
                            <option key={key} value={index}>
                                1 = {key}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="tune-control-group">
                    <label htmlFor="tune-to-key">{lang.tune.targetKey}：</label>
                    <select
                        id="tune-to-key"
                        value={toKey}
                        onChange={(e) => setToKey(parseInt(e.target.value))}
                        {...disableCheck}
                    >
                        {KEYS.map((key, index) => (
                            <option key={key} value={index}>
                                1 = {key}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="tune-actions">
                    <button
                        className="tune-button ripple"
                        onClick={handleTranspose}
                        title={lang.tune.transpose}
                    >
                        {lang.tune.transpose}
                    </button>
                    <button
                        className="tune-button ripple"
                        onClick={applyTranspose}
                        title="应用转调结果"
                    >
                        应用
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
                        readOnly
                        {...useDefaultValue(transposedText, transposedTextarea)}
                    />
                </div>
            </section>
        </div>
    );
};
