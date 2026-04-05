import SSK from "#const/session_key.json" assert { type: "json" };
import STRINGS from "#const/strings.json" assert { type: "json" };
import { convertTimeToTag, formatText, type ILyric } from "@lrc-maker/lrc-parser";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { useKeyBindings } from "../hooks/useKeyBindings.js";
import type { IState } from "../hooks/useLrc.js";
import { type Action, ActionType } from "../hooks/useLrc.js";
import { type State as PrefState } from "../hooks/usePref.js";
import { audioRef, currentTimePubSub } from "../utils/audiomodule.js";
import { InputAction } from "../utils/input-action.js";
import { isKeyboardElement } from "../utils/is-keyboard-element.js";
import { getMatchedAction } from "../utils/keybindings.js";
import { appContext } from "./app.context.js";
import { AsidePanel } from "./asidepanel.js";
import { Curser } from "./curser.js";

export const enum SyncMode {
    select,
    highlight,
}

interface ISynchronizerProps {
    state: IState;
    dispatch: React.Dispatch<Action>;
}

export const Synchronizer: React.FC<ISynchronizerProps> = ({ state, dispatch }) => {
    const self = useRef(Symbol(Synchronizer.name));

    const { selectIndex, currentIndex: highlightIndex, lyric } = state;

    const { prefState, lang, trimOptions } = useContext(appContext);
    const keyBindings = useKeyBindings();

    useEffect(() => {
        dispatch({
            type: ActionType.info,
            payload: {
                name: "tool",
                value: `${lang.app.name} https://lrc-player.github.io`,
            },
        });
    }, [dispatch, lang]);

    const [syncMode, setSyncMode] = useState(() =>
        sessionStorage.getItem(SSK.syncMode) === SyncMode.highlight.toString() ? SyncMode.highlight : SyncMode.select
    );

    useEffect(() => {
        sessionStorage.setItem(SSK.syncMode, syncMode.toString());
    }, [syncMode]);

    const ul = useRef<HTMLUListElement>(null);

    const needScrollLine = {
        [SyncMode.select]: selectIndex,
        [SyncMode.highlight]: highlightIndex,
    }[syncMode];

    useEffect(() => {
        const line = ul.current?.children[needScrollLine];
        if (line !== undefined) {
            line.scrollIntoView({
                behavior: "smooth",
                block: "center",
                inline: "center",
            });
        }
    }, [needScrollLine]);

    useEffect(() => {
        return currentTimePubSub.sub(self.current, (time) => {
            dispatch({ type: ActionType.refresh, payload: time });
        });
    }, [dispatch]);

    const sync = useCallback(() => {
        if (!audioRef.duration) {
            return;
        }

        dispatch({
            type: ActionType.next,
            payload: audioRef.currentTime,
        });
    }, [dispatch]);

    const adjust = useCallback(
        (ev: KeyboardEvent | React.MouseEvent, offset: number, index: number) => {
            if (!audioRef.duration) {
                return;
            }

            const selectTime = lyric[index]?.time;

            if (selectTime === undefined) {
                return;
            }

            dispatch({
                type: ActionType.time,
                payload: audioRef.step(ev, offset, selectTime),
            });
        },
        [dispatch, lyric],
    );

    useEffect(() => {
        function onKeydown(ev: KeyboardEvent): void {
            if (isKeyboardElement(ev.target)) {
                return;
            }

            const action = getMatchedAction(ev, keyBindings);

            switch (action) {
                case InputAction.Sync:
                    ev.preventDefault();
                    sync();
                    break;
                case InputAction.DeleteTime:
                    ev.preventDefault();
                    dispatch({ type: ActionType.deleteTime, payload: undefined });
                    break;
                case InputAction.ResetOffset:
                    ev.preventDefault();
                    adjust(ev, 0, selectIndex);
                    break;
                case InputAction.DecreaseOffset:
                    ev.preventDefault();
                    adjust(ev, -0.5, selectIndex);
                    break;
                case InputAction.IncreaseOffset:
                    ev.preventDefault();
                    adjust(ev, 0.5, selectIndex);
                    break;
                case InputAction.PrevLine:
                    ev.preventDefault();
                    dispatch({ type: ActionType.select, payload: (index) => index - 1 });
                    break;
                case InputAction.NextLine:
                    ev.preventDefault();
                    dispatch({ type: ActionType.select, payload: (index) => index + 1 });
                    break;
                case InputAction.FirstLine:
                    ev.preventDefault();
                    dispatch({ type: ActionType.select, payload: () => 0 });
                    break;
                case InputAction.LastLine:
                    ev.preventDefault();
                    dispatch({ type: ActionType.select, payload: () => Infinity });
                    break;
                case InputAction.PageUp:
                    ev.preventDefault();
                    dispatch({ type: ActionType.select, payload: (index) => index - 10 });
                    break;
                case InputAction.PageDown:
                    ev.preventDefault();
                    dispatch({ type: ActionType.select, payload: (index) => index + 10 });
                    break;
            }
        }

        document.addEventListener("keydown", onKeydown);

        return (): void => {
            document.removeEventListener("keydown", onKeydown);
        };
    }, [adjust, dispatch, keyBindings, selectIndex, sync]);

    const onLineClick = useCallback(
        (ev: React.MouseEvent<HTMLUListElement & HTMLLIElement>) => {
            console.log('[Synchronizer] onLineClick triggered');
            // 不要阻止事件传播，让 li 元素也能收到点击事件
            // ev.stopPropagation();

            const target = ev.target as HTMLElement;
            console.log('[Synchronizer] click target classList:', target.className);
            console.log('[Synchronizer] click target dataset:', target.dataset);

            // 向上查找带有 line 类的父元素
            const lineElement = target.closest('.line') as HTMLElement | null;
            if (lineElement) {
                const lineKey = Number.parseInt(lineElement.dataset.key!, 10) || 0;
                console.log('[Synchronizer] selecting line:', lineKey);

                dispatch({ type: ActionType.select, payload: () => lineKey });
            }
        },
        [dispatch],
    );

    const onLineDoubleClick = useCallback(
        (ev: React.MouseEvent<HTMLUListElement | HTMLLIElement>) => {
            console.log('[Synchronizer] onLineDoubleClick triggered');
            ev.stopPropagation();

            if (!audioRef.duration) {
                console.log('[Synchronizer] no audio duration');
                return;
            }

            const target = ev.target as HTMLElement;
            console.log('[Synchronizer] doubleclick target classList:', target.className);
            console.log('[Synchronizer] doubleclick target dataset:', target.dataset);

            // 向上查找带有 line 类的父元素
            const lineElement = target.closest('.line') as HTMLElement | null;
            if (lineElement) {
                const key = Number.parseInt(lineElement.dataset.key!, 10);
                console.log('[Synchronizer] adjusting line:', key, 'to time:', audioRef.currentTime);

                adjust(ev, 0, key);
            }
        },
        [adjust],
    );

    const LyricLineIter = useCallback(
        (line: Readonly<ILyric>, index: number, lines: readonly ILyric[]) => {
            const select = index === selectIndex;
            const highlight = index === highlightIndex;
            const error = index > 0 && lines[index].time! <= lines[index - 1].time!;

            const className = Object.entries({
                line: true,
                select,
                highlight,
                error,
            })
                .reduce<string[]>((p, [name, value]) => {
                    if (value) {
                        p.push(name);
                    }
                    return p;
                }, [])
                .join(STRINGS.space);

            return (
                <LyricLine
                    key={index}
                    index={index}
                    className={className}
                    line={line}
                    select={select}
                    prefState={prefState}
                    onEdit={(idx, newText, newTime) => {
                        // 去除文本中的时间标签（如果有的话）
                        const cleanText = newText.replace(/^\[\d{2}:\d{2}\.\d{2,3}\]\s*/, '');
                        
                        // 直接基于当前 state 更新，避免闭包问题
                        const updatedLyric = lyric.map((l, i) => 
                            i === idx ? { ...l, text: cleanText, time: newTime !== undefined ? newTime : l.time } : l
                        );
                        
                        // 重新生成歌词并解析 - 确保时间标签和文本正确组合
                        const newLyricText = updatedLyric.map(l => {
                            const timeTag = l.time ? convertTimeToTag(l.time, prefState.fixed) : '';
                            // 确保 l.text 不包含时间标签
                            const textWithoutTime = l.text.replace(/^\[\d{2}:\d{2}\.\d{2,3}\]\s*/, '');
                            return `${timeTag}${textWithoutTime}`;
                        }).join('\n');
                        
                        console.log('[Synchronizer] Saving edited lyric:', { 
                            index: idx, 
                            originalText: newText, 
                            cleanText: cleanText,
                            newTime: newTime,
                            newLyricText 
                        });
                        
                        dispatch({
                            type: ActionType.parse,
                            payload: { text: newLyricText, options: trimOptions }
                        });
                    }}
                />
            );
        },
        [selectIndex, highlightIndex, prefState, lyric, trimOptions, dispatch],
    );

    const ulClassName = prefState.screenButton ? "lyric-list on-screen-button" : "lyric-list";

    return (
        <>
            <ul ref={ul} className={ulClassName} onClickCapture={onLineClick} onDoubleClickCapture={onLineDoubleClick}>
                {state.lyric.map(LyricLineIter)}
            </ul>
            <AsidePanel syncMode={syncMode} setSyncMode={setSyncMode} lrcDispatch={dispatch} prefState={prefState} />
        </>
    );
};

interface ILyricLineProps {
    line: ILyric;
    index: number;
    select: boolean;
    className: string;
    prefState: PrefState;
}

const LyricLine: React.FC<ILyricLineProps & {
    onEdit?: (index: number, text: string, time: number) => void;
}> = ({ line, index, select, className, prefState, onEdit }) => {
    const lineTime = convertTimeToTag(line.time, prefState.fixed);
    const lineText = formatText(line.text, prefState.spaceStart, prefState.spaceEnd);

    // 编辑状态
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(line.text);
    const [editTime, setEditTime] = useState(line.time || 0);
    const inputRef = useRef<HTMLInputElement>(null);
    const timeInputRef = useRef<HTMLInputElement>(null);

    // 三击检测
    const clickCount = useRef(0);
    const clickTimer = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        return () => {
            if (clickTimer.current) {
                clearTimeout(clickTimer.current);
            }
        };
    }, []);

    // 处理三击进入编辑
    const handleTripleClick = useCallback(() => {
        console.log('[LyricLine] Triple click detected, entering edit mode for index:', index);
        setIsEditing(true);
        setEditText(line.text);
        setEditTime(line.time || 0);
        // 聚焦到文本输入框
        requestAnimationFrame(() => {
            inputRef.current?.focus();
            inputRef.current?.setSelectionRange(0, inputRef.current.value.length);
        });
    }, [line.text, line.time, index]);

    // 处理点击计数
    const handleClick = useCallback(() => {
        clickCount.current++;
        console.log('[LyricLine] Click count:', clickCount.current, 'index:', index);

        if (clickTimer.current) {
            clearTimeout(clickTimer.current);
        }

        clickTimer.current = setTimeout(() => {
            console.log('[LyricLine] Reset click count, index:', index);
            clickCount.current = 0;
            clickTimer.current = null;
        }, 500);

        // 检测三击
        if (clickCount.current === 3) {
            console.log('[LyricLine] Triple click detected! index:', index);
            if (clickTimer.current) {
                clearTimeout(clickTimer.current);
            }
            handleTripleClick();
        }
    }, [handleTripleClick, index]);

    // 保存编辑
    const handleBlur = useCallback(() => {
        setIsEditing(false);
        if ((editText !== line.text || editTime !== line.time) && onEdit) {
            onEdit(index, editText, editTime);
        }
    }, [editText, editTime, line.text, line.time, index, onEdit]);

    // 键盘事件
    const handleKeyDown = useCallback((ev: React.KeyboardEvent<HTMLInputElement>) => {
        if (ev.key === 'Enter') {
            handleBlur();
        } else if (ev.key === 'Escape') {
            setIsEditing(false);
            setEditText(line.text);
            setEditTime(line.time || 0);
        } else if (ev.key === 'ArrowRight' && ev.target === timeInputRef.current) {
            ev.preventDefault();
            inputRef.current?.focus();
        } else if (ev.key === 'ArrowLeft' && ev.target === inputRef.current && inputRef.current.selectionStart === 0) {
            ev.preventDefault();
            timeInputRef.current?.focus();
        }
    }, [handleBlur, line.text, line.time]);

    // 时间输入处理
    const handleTimeChange = useCallback((ev: React.ChangeEvent<HTMLInputElement>) => {
        const value = ev.target.value;
        const timePattern = /^([0-9]{0,2}):?([0-9]{0,2})\.?([0-9]{0,3})$/;
        if (timePattern.test(value) || value === '') {
            const parts = value.split(':');
            let minutes = 0;
            let seconds = 0;
            
            if (parts.length === 2) {
                minutes = Number.parseInt(parts[0], 10) || 0;
                const secParts = parts[1].split('.');
                seconds = Number.parseFloat(secParts.join('.')) || 0;
            } else {
                seconds = Number.parseFloat(value) || 0;
            }
            
            setEditTime(minutes * 60 + seconds);
        }
    }, []);

    // 文本输入处理（已废弃，保留以防将来使用）
    const handleTextChange = useCallback((ev: React.ChangeEvent<HTMLInputElement>) => {
        setEditText(ev.target.value);
    }, []);

    // 将秒转换为时间标签格式
    const secondsToTimeTag = (seconds: number): string => {
        const min = Math.floor(seconds / 60);
        const sec = Math.floor(seconds % 60);
        const ms = Math.round((seconds - Math.floor(seconds)) * 1000);
        return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
    };

    // 解析时间字符串为秒数
    const parseTimeToSeconds = (timeStr: string): number => {
        if (!timeStr) return 0;
        const parts = timeStr.split(':');
        let minutes = 0;
        let seconds = 0;
        
        if (parts.length === 2) {
            minutes = Number.parseInt(parts[0], 10) || 0;
            const secParts = parts[1].split('.');
            seconds = Number.parseFloat(secParts.join('.')) || 0;
        } else {
            seconds = Number.parseFloat(timeStr) || 0;
        }
        
        return minutes * 60 + seconds;
    };

    if (isEditing) {
        return (
            <li 
                key={index} 
                data-key={index} 
                className={`${className} editing`}
            >
                {select && <Curser fixed={prefState.fixed} />}
                <div style={{ display: 'flex', gap: '8px', width: '100%', alignItems: 'center' }}>
                    <input
                        ref={timeInputRef}
                        className="line-time-editor"
                        style={{ 
                            width: '100px', 
                            flexShrink: 0,
                            border: '1px solid #007bff',
                            padding: '2px 4px',
                            background: 'transparent',
                            color: 'inherit'
                        }}
                        value={secondsToTimeTag(editTime)}
                        onChange={handleTimeChange}
                        onBlur={handleBlur}
                        onKeyDown={handleKeyDown}
                    />
                    <input
                        ref={inputRef}
                        className="line-text-editor"
                        style={{ 
                            flex: 1,
                            border: '1px solid #007bff',
                            padding: '2px 4px',
                            background: 'transparent',
                            color: 'inherit',
                            fontFamily: 'inherit',
                            fontSize: 'inherit'
                        }}
                        value={editText}
                        onChange={handleTextChange}
                        onBlur={handleBlur}
                        onKeyDown={handleKeyDown}
                    />
                </div>
            </li>
        );
    }

    return (
        <li 
            key={index} 
            data-key={index} 
            className={className}
            onClickCapture={(ev) => {
                ev.stopPropagation();
                handleClick();
            }}
        >
            {select && <Curser fixed={prefState.fixed} />}
            <time className="line-time">{lineTime}</time>
            <span className="line-text">{lineText}</span>
        </li>
    );
};
