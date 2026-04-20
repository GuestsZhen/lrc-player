import { convertTimeToTag, formatText, type ILyric } from "@lrc-maker/lrc-parser";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { type Action, ActionType } from "../hooks/useLrc.js";
import { audioRef, currentTimePubSub } from "../utils/audiomodule.js";
import { appContext } from "./app.context.js";
import { Curser } from "./curser.js";
import { IOSHint } from "./ios-hint.js";
import { usePlayerSettings } from "../stores/playerSettings.js";
import { useAudioControl } from "../hooks/useAudioControl.js";
import { isAndroidNative } from "../utils/platform-detector.js";

// 获取对比色（根据背景亮度决定返回黑色或白色）
// const _getContrastColor = (hexColor: string): string => {
//     const hex = hexColor.replace('#', '');
//     const r = parseInt(hex.substr(0, 2), 16);
//     const g = parseInt(hex.substr(2, 2), 16);
//     const b = parseInt(hex.substr(4, 2), 16);
//     const brightness = (r * 299 + g * 587 + b * 114) / 1000;
//     return brightness > 128 ? '#000000' : '#ffffff';
// };

interface IPlayerProps {
    state: any;
    dispatch: React.Dispatch<Action>;
}

export const Player: React.FC<IPlayerProps> = ({ state, dispatch }) => {
    const self = useRef(Symbol(Player.name));
    const { currentIndex, lyric } = state;
    const { prefState } = useContext(appContext);
    
    // ✅ Android 模式下获取 ExoPlayer 控制
    const { currentTime: audioCurrentTime, seekTo: audioSeekTo } = isAndroidNative() ? useAudioControl() : { currentTime: 0, seekTo: () => {} };
    
    // 使用新的 Player Settings Store
    const playerSettings = usePlayerSettings();
    
    // 控制是否显示时间轴（默认隐藏）
    const [showTime, _setShowTime] = useState(false);

    // 控制全屏状态
    const [_isFullscreen, setIsFullscreen] = useState(false);
    
    // 控制 iOS 提示显示
    const [showIOSHint, setShowIOSHint] = useState(false);
    
    // === 从 Store 获取的值（兼容旧代码）===
    const fontSize = playerSettings.fontSize;
    const setFontSize = playerSettings.setFontSize;
    const backgroundColor = playerSettings.bgColor;
    const setBackgroundColor = playerSettings.setBgColor;
    const lyricColor = playerSettings.lyricColor;
    const setLyricColor = playerSettings.setLyricColor;
    const subLyricOpacity = playerSettings.subOpacity;
    const setSubLyricOpacity = playerSettings.setSubOpacity;
    const textAlign = playerSettings.textAlign; // ✅ 从 store 读取对齐方式
    
    // ========================================

    useEffect(() => {
        sessionStorage.setItem("player-show-time", showTime.toString());
    }, [showTime]);

    useEffect(() => {
        sessionStorage.setItem("player-font-size", fontSize.toString());
    }, [fontSize]);
    
    // 监听窗口大小变化，根据分辨率调整字体大小
    useEffect(() => {
        const handleResize = () => {
            const savedSize = Number(sessionStorage.getItem("player-font-size")) || 1.3;
            
            // 所有屏幕尺寸统一使用 1.3rem 作为基础字体大小
            const baseSize = 1.3;
            
            // 保持用户的相对缩放比例
            const userScale = savedSize / 1.3;
            const newSize = baseSize * userScale;
            
            setFontSize(Math.max(0.8, Math.min(newSize, 2.5)));
        };
        
        // 初始调用一次
        handleResize();
        
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // 监听全屏状态变化 - 兼容 iOS
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!(document.fullscreenElement || 
                              (document as any).webkitFullscreenElement ||
                              (document as any).msFullscreenElement));
        };
        
        // 监听多种全屏事件
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.addEventListener('msfullscreenchange', handleFullscreenChange);
        
        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
            document.removeEventListener('msfullscreenchange', handleFullscreenChange);
        };
    }, []);

    // 注意：字体大小、背景颜色、歌词颜色、副行透明度、对齐方式的变化
    // 已由 usePlayerSettings Store 自动处理，无需手动监听事件
    
    // 监听副行透明度变化事件（从 Header 组件）
    useEffect(() => {
        const handleOpacityChange = (event: CustomEvent<number>) => {
            const delta = event.detail;
            const newValue = Math.min(Math.max(playerSettings.subOpacity + delta, 0.1), 1.0);
            playerSettings.setSubOpacity(newValue);
        };
        
        window.addEventListener('player-sub-opacity-change' as any, handleOpacityChange as any);
        return () => window.removeEventListener('player-sub-opacity-change' as any, handleOpacityChange as any);
    }, [playerSettings]);
    


    // 自动滚动到当前行（歌词中心点在屏幕 70% 高度处，从下往上计算）
    const ul = useRef<HTMLUListElement>(null);
    
    // 修复 iOS Safari/Chrome 歌词不显示的渲染 Bug
    // 当歌词数据更新后，强制触发重新渲染
    useEffect(() => {
        if (lyric.length > 0 && ul.current) {
            // 通过微小的 transform 变化触发 iOS 重绘
            const el = ul.current;
            el.style.transform = 'translateZ(0)';
            // 在下一帧恢复
            requestAnimationFrame(() => {
                el.style.transform = 'translateZ(0.1px)';
            });
        }
    }, [lyric.length]);
    
    // 额外修复：当歌词数组内容变化时也触发重绘
    useEffect(() => {
        if (lyric.length > 0 && ul.current) {
            const el = ul.current;
            // 使用 setAttribute 触发 iOS 重绘
            el.setAttribute('data-repaint', Date.now().toString());
        }
    }, [lyric]);
    
    // 使用 scrollTop 滚动而不是 transform，支持手动滚动
    useEffect(() => {
        const line = ul.current?.children[currentIndex];
        if (line && ul.current) {
            // 使用 requestAnimationFrame 确保在下一帧执行，避免阻塞渲染
            requestAnimationFrame(() => {
                const container = ul.current;
                if (!container) return;
                
                const lineRect = line.getBoundingClientRect();
                const containerRect = container.getBoundingClientRect();
                const viewportHeight = window.innerHeight;
                
                // 目标位置：歌词中心点在屏幕 70% 高度处（从下往上）
                // 即距离顶部 30% 的位置
                const targetPositionFromTop = viewportHeight * 0.3;
                
                // 计算歌词行中心点相对于容器的位置
                const lineCenterY = lineRect.top - containerRect.top + (lineRect.height / 2);
                
                // 计算目标位置相对于容器顶部的偏移
                const targetOffset = targetPositionFromTop - containerRect.top;
                
                // 计算需要滚动的距离
                const scrollOffset = lineCenterY - targetOffset;
                
                // 获取当前 scrollTop 值
                const currentScrollTop = container.scrollTop;
                
                // 计算新的 scrollTop 值
                const newScrollTop = currentScrollTop + scrollOffset;
                
                // 只有当偏移量超过一定阈值时才滚动（避免微小抖动）
                if (Math.abs(scrollOffset) > 5) {
                    // 使用 scrollTo 实现平滑滚动
                    container.scrollTo({
                        top: newScrollTop,
                        behavior: 'smooth'
                    });
                }
            });
        }
    }, [currentIndex]);

    // 监听音频时间更新
    useEffect(() => {
        // ✅ Android 模式下使用 useAudioControl 监听 ExoPlayer
        if (isAndroidNative()) {
            dispatch({ type: ActionType.refresh, payload: audioCurrentTime });
            return;
        }
        
        // Web 模式使用 HTML5 Audio
        return currentTimePubSub.sub(self.current, (time) => {
            dispatch({ type: ActionType.refresh, payload: time });
        });
    }, [dispatch, audioCurrentTime]);

    // 切换时间轴显示
    // const _toggleTimeDisplay = useCallback(() => {
    //     setShowTime(prev => !prev);
    // }, []);

    // 切换全屏 - 兼容 iOS
    // const _toggleFullscreen = useCallback(async () => {
    //     try {
    //         const element = document.documentElement;
    //         const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    //         const isCurrentlyFullscreen = !!(document.fullscreenElement || 
    //                                         (document as any).webkitFullscreenElement ||
    //                                         (document as any).msFullscreenElement);
    //         
    //         if (!isCurrentlyFullscreen) {
    //             if (isIOS) {
    //                 if (element.requestFullscreen) {
    //                     try { await element.requestFullscreen(); return; } catch {}
    //                 }
    //                 if ((element as any).webkitRequestFullscreen) {
    //                     try { await (element as any).webkitRequestFullscreen(); return; } catch {}
    //                 }
    //                 setShowIOSHint(true);
    //                 return;
    //             }
    //             if (element.requestFullscreen) {
    //                 await element.requestFullscreen();
    //             } else if ((element as any).webkitRequestFullscreen) {
    //                 await (element as any).webkitRequestFullscreen();
    //             } else if ((element as any).msRequestFullscreen) {
    //                 await (element as any).msRequestFullscreen();
    //             }
    //         } else {
    //             if (document.exitFullscreen) {
    //                 await document.exitFullscreen();
    //             } else if ((document as any).webkitExitFullscreen) {
    //                 await (document as any).webkitExitFullscreen();
    //             } else if ((document as any).msExitFullscreen) {
    //                 await (document as any).msExitFullscreen();
    //             }
    //         }
    //     } catch {
    //         // iOS 可能不支持全屏，静默失败
    //     }
    // }, []);


    // 初始化：无需手动读取，已由 initializePlayerSettings 处理
    useEffect(() => {
        // 组件挂载时的初始化逻辑
    }, []);
    
    // ✅ 已移除主题模式自动重置逻辑
    // 现在完全由用户自定义颜色控制，通过 Capacitor Preferences 持久化
    
    // 设置 html 元素背景色为用户选择的颜色（仅在 Player 页面）
    useEffect(() => {
        const originalHtmlBgColor = document.documentElement.style.backgroundColor;
        document.documentElement.style.setProperty('background-color', backgroundColor, 'important');
        
        return () => {
            // 组件卸载时恢复原来的背景色
            document.documentElement.style.backgroundColor = originalHtmlBgColor;
        };
    }, [backgroundColor]);
    
    // ✅ 监听背景色变化事件（确俚 Android 上也能正常工作）
    useEffect(() => {
        const handleBgColorChange = (event: Event) => {
            const customEvent = event as CustomEvent<string>;
            const newColor = customEvent.detail;
            // 强制更新 documentElement 背景色
            document.documentElement.style.setProperty('background-color', newColor, 'important');
        };
        
        window.addEventListener('player-bg-color-change', handleBgColorChange);
        return () => window.removeEventListener('player-bg-color-change', handleBgColorChange);
    }, []);

    // 点击歌词跳转到指定时间
    const onLineClick = useCallback(
        (ev: React.MouseEvent<HTMLLIElement>) => {
            ev.stopPropagation();
            const target = ev.currentTarget;
            const key = Number.parseInt(target.dataset.key!, 10);
            const lineTime = lyric[key]?.time;
            
            if (lineTime !== undefined) {
                // ✅ Android 模式下使用 ExoPlayer seekTo
                if (isAndroidNative()) {
                    audioSeekTo(lineTime);
                } else {
                    // Web 模式使用 HTML5 Audio
                    if (audioRef.current) {
                        audioRef.current.currentTime = lineTime;
                    }
                }
            }
        },
        [lyric, audioSeekTo]
    );

    const LyricLineIter = useCallback(
        (line: Readonly<ILyric>, index: number) => {
            const highlight = index === currentIndex;

            return (
                <LyricLine
                    key={index}
                    index={index}
                    line={line}
                    highlight={highlight}
                    showTime={showTime}
                    prefState={prefState}
                    onClick={onLineClick}
                    opacity={1}
                />
            );
        },
        [currentIndex, showTime, prefState, onLineClick],
    );

    return (
        <>
            <div 
                className="player-container"
                style={{
                    backgroundColor: backgroundColor  // 使用用户设置的颜色作为整个 Player 页面的背景
                }}
            >
                <ul 
                    ref={ul} 
                    className="player-lyric-list" 
                    style={{ 
                        fontSize: `${fontSize}rem`, 
                        textAlign,
                        ['--player-bg-color' as any]: backgroundColor,
                        ['--player-lyric-color' as any]: lyricColor,
                        ['--player-sub-opacity' as any]: subLyricOpacity
                    }}
                >
                    {state.lyric.map(LyricLineIter)}
                </ul>
            </div>
            
            {/* iOS 全屏提示 */}
            <IOSHint show={showIOSHint} onClose={() => setShowIOSHint(false)} />
        </>
    );
};

interface ILyricLineProps {
    line: ILyric;
    index: number;
    highlight: boolean;
    showTime: boolean;
    prefState: any;
    onClick: (ev: React.MouseEvent<HTMLLIElement>) => void;
    opacity?: number;
}

const LyricLine: React.FC<ILyricLineProps> = ({ line, index, highlight, showTime, prefState, onClick, opacity = 1 }) => {
    const lineTime = convertTimeToTag(line.time, prefState.fixed);
    const lineText = formatText(line.text, prefState.spaceStart, prefState.spaceEnd);

    // 处理歌词中的 / 符号，实现分行显示
    const renderLyricText = (text: string) => {
        const slashIndex = text.indexOf('/');
        
        if (slashIndex === -1) {
            // 没有 / 符号，正常显示
            return <span className="player-line-text">{text}</span>;
        } else {
            // 有 / 符号，分成两行显示
            const firstPart = text.substring(0, slashIndex);
            const secondPart = text.substring(slashIndex + 1);
            
            return (
                <div className="player-line-text-container">
                    <span className="player-line-text-main">{firstPart}</span>
                    <span className="player-line-text-sub">{secondPart}</span>
                </div>
            );
        }
    };

    return (
        <li 
            key={index} 
            data-key={index} 
            className={`player-line ${highlight ? 'highlight' : ''}`}
            onClick={onClick}
            style={{ 
                cursor: 'pointer',
                opacity: highlight ? 1 : opacity
            }}
        >
            {highlight && showTime && <Curser fixed={prefState.fixed} />}
            {showTime && line.time !== undefined && (
                <time className="player-line-time">{lineTime}</time>
            )}
            {renderLyricText(lineText)}
        </li>
    );
};
