import { convertTimeToTag, formatText, type ILyric } from "@lrc-maker/lrc-parser";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { type Action, ActionType } from "../hooks/useLrc.js";
import { audioRef, currentTimePubSub } from "../utils/audiomodule.js";
import { appContext } from "./app.context.js";
import { Curser } from "./curser.js";
import { IOSHint } from "./ios-hint.js";

// 获取对比色（根据背景亮度决定返回黑色或白色）
const getContrastColor = (hexColor: string): string => {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    // 计算亮度
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? '#000000' : '#ffffff';
};

interface IPlayerProps {
    state: any;
    dispatch: React.Dispatch<Action>;
}

export const Player: React.FC<IPlayerProps> = ({ state, dispatch }) => {
    const self = useRef(Symbol(Player.name));
    const { currentIndex, lyric } = state;
    const { prefState, lang } = useContext(appContext);
    
    // 控制是否显示时间轴（默认隐藏）
    const [showTime, setShowTime] = useState(false);

    // 控制字体大小
    const [fontSize, setFontSize] = useState(() => {
        return Number(sessionStorage.getItem("player-font-size")) || 1.3;
    });

    // 控制对齐方式
    const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('center');

    // 控制全屏状态
    const [isFullscreen, setIsFullscreen] = useState(false);
    
    // 控制 iOS 提示显示
    const [showIOSHint, setShowIOSHint] = useState(false);

    // 控制背景颜色
    const [backgroundColor, setBackgroundColor] = useState(() => {
        const savedColor = sessionStorage.getItem('player-bg-color');
        if (savedColor) {
            return savedColor;
        }
        // 根据主题模式设置默认颜色
        const themeMode = localStorage.getItem('preferences') ? JSON.parse(localStorage.getItem('preferences') || '{}').themeMode : 0;
        // ThemeMode: 0=auto, 1=light, 2=dark
        if (themeMode === 1) { // 亮色模式
            return '#ededed';
        } else {
            return '#2e2e2e'; // 暗色模式或自动模式默认深色
        }
    });

    // 控制歌词颜色
    const [lyricColor, setLyricColor] = useState(() => {
        const savedColor = sessionStorage.getItem('player-lyric-color');
        if (savedColor) {
            return savedColor;
        }
        // 根据主题模式设置默认颜色
        const themeMode = localStorage.getItem('preferences') ? JSON.parse(localStorage.getItem('preferences') || '{}').themeMode : 0;
        // ThemeMode: 0=auto, 1=light, 2=dark
        if (themeMode === 1) { // 亮色模式
            return '#eeeeee';
        } else {
            return '#ffffff'; // 暗色模式或自动模式默认白色
        }
    });
    
    // 持久化保存背景颜色
    useEffect(() => {
        sessionStorage.setItem('player-bg-color', backgroundColor);
        localStorage.setItem('player-bg-color', backgroundColor); // 保存到 localStorage 持久化
    }, [backgroundColor]);
    
    // 持久化保存歌词颜色
    useEffect(() => {
        sessionStorage.setItem('player-lyric-color', lyricColor);
        localStorage.setItem('player-lyric-color', lyricColor); // 保存到 localStorage 持久化
    }, [lyricColor]);

    // 控制第二行歌词透明度
    const [subLyricOpacity, setSubLyricOpacity] = useState(() => {
        return Number(sessionStorage.getItem('player-sub-opacity')) || 0.3;
    });
    
    // 持久化保存副文本透明度
    useEffect(() => {
        sessionStorage.setItem('player-sub-opacity', subLyricOpacity.toString());
        localStorage.setItem('player-sub-opacity', subLyricOpacity.toString()); // 保存到 localStorage 持久化
    }, [subLyricOpacity]);

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

    // 监听字体大小变化事件（从 Header 组件）
    useEffect(() => {
        const handleFontSizeChange = (event: CustomEvent<number>) => {
            const newSize = event.detail;
            setFontSize(newSize);
        };
        
        window.addEventListener('player-font-size-update' as any, handleFontSizeChange as any);
        return () => window.removeEventListener('player-font-size-update' as any, handleFontSizeChange as any);
    }, []);

    // 监听歌词颜色变化事件（从 Header 组件）
    useEffect(() => {
        const handleColorChange = (event: CustomEvent<string>) => {
            const color = event.detail;
            setLyricColor(color);
        };
        
        window.addEventListener('player-lyric-color-change' as any, handleColorChange as any);
        return () => window.removeEventListener('player-lyric-color-change' as any, handleColorChange as any);
    }, []);
    
    // 监听背景颜色变化事件（从 Header 组件）
    useEffect(() => {
        const handleBgColorChange = (event: CustomEvent<string>) => {
            const color = event.detail;
            setBackgroundColor(color);
        };
        
        window.addEventListener('player-bg-color-change' as any, handleBgColorChange as any);
        return () => window.removeEventListener('player-bg-color-change' as any, handleBgColorChange as any);
    }, []);
    
    // 监听对齐方式变化事件（从 Header 组件）
    useEffect(() => {
        const handleAlignChange = (event: CustomEvent<'left' | 'center' | 'right'>) => {
            const align = event.detail;
            setTextAlign(align);
        };
        
        window.addEventListener('player-text-align-change' as any, handleAlignChange as any);
        return () => window.removeEventListener('player-text-align-change' as any, handleAlignChange as any);
    }, [setTextAlign]);
    
    // 监听副行透明度变化事件（从 Header 组件）
    useEffect(() => {
        const handleOpacityChange = (event: CustomEvent<number>) => {
            const delta = event.detail;
            setSubLyricOpacity(prev => Math.min(Math.max(prev + delta, 0.1), 1.0));
        };
        
        window.addEventListener('player-sub-opacity-change' as any, handleOpacityChange as any);
        return () => window.removeEventListener('player-sub-opacity-change' as any, handleOpacityChange as any);
    }, []);
    


    // 自动滚动到当前行（歌词中心点在屏幕 70% 高度处，从下往上计算）
    const ul = useRef<HTMLUListElement>(null);
    
    useEffect(() => {
        const line = ul.current?.children[currentIndex];
        if (line) {
            // 使用 requestAnimationFrame 确保在下一帧执行，避免阻塞渲染
            requestAnimationFrame(() => {
                // 获取歌词行的位置信息
                const lineRect = line.getBoundingClientRect();
                const viewportHeight = window.innerHeight;
                
                // 目标位置：歌词中心点在屏幕 70% 高度处（从下往上）
                // 即距离顶部 30% 的位置
                const targetPositionFromTop = viewportHeight * 0.3;
                
                // 计算歌词行中心点当前位置
                const lineCenterY = lineRect.top + (lineRect.height / 2);
                
                // 计算需要滚动的距离
                const scrollOffset = lineCenterY - targetPositionFromTop;
                
                // 只有当偏移量超过一定阈值时才滚动（避免微小抖动）
                if (Math.abs(scrollOffset) > 5) {
                    // 使用更平滑的滚动方式
                    window.scrollTo({
                        top: window.scrollY + scrollOffset,
                        behavior: 'smooth'
                    });
                }
            });
        }
    }, [currentIndex]);

    // 监听音频时间更新
    useEffect(() => {
        return currentTimePubSub.sub(self.current, (time) => {
            dispatch({ type: ActionType.refresh, payload: time });
        });
    }, [dispatch]);

    // 切换时间轴显示
    const toggleTimeDisplay = useCallback(() => {
        setShowTime(prev => !prev);
    }, []);

    // 切换全屏 - 兼容 iOS
    const toggleFullscreen = useCallback(async () => {
        try {
            const element = document.documentElement;
            
            // 检测是否为 iOS 设备
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
            
            // 检查是否已经在全屏模式
            const isCurrentlyFullscreen = !!(document.fullscreenElement || 
                                            (document as any).webkitFullscreenElement ||
                                            (document as any).msFullscreenElement);
            
            if (!isCurrentlyFullscreen) {
                // iOS 设备特殊处理
                if (isIOS) {
                    console.log('iOS device detected, using alternative fullscreen method');
                    
                    // 方法1: 尝试标准 API (iOS 16.4+ 可能支持)
                    if (element.requestFullscreen) {
                        try {
                            await element.requestFullscreen();
                            console.log('Standard fullscreen API succeeded');
                            return;
                        } catch (e) {
                            console.log('Standard API failed, trying alternatives');
                        }
                    }
                    
                    // 方法2: 尝试 WebKit API
                    if ((element as any).webkitRequestFullscreen) {
                        try {
                            await (element as any).webkitRequestFullscreen();
                            console.log('WebKit fullscreen API succeeded');
                            return;
                        } catch (e) {
                            console.log('WebKit API failed');
                        }
                    }
                    
                    // 方法3: iOS 不支持网页全屏，显示友好提示
                    console.warn('iOS does not support web page fullscreen. Please add to Home Screen for best experience.');
                    setShowIOSHint(true);
                    return;
                }
                
                // 非 iOS 设备 - 正常处理
                if (element.requestFullscreen) {
                    await element.requestFullscreen();
                } else if ((element as any).webkitRequestFullscreen) {
                    await (element as any).webkitRequestFullscreen();
                } else if ((element as any).msRequestFullscreen) {
                    await (element as any).msRequestFullscreen();
                }
            } else {
                // 退出全屏
                if (document.exitFullscreen) {
                    await document.exitFullscreen();
                } else if ((document as any).webkitExitFullscreen) {
                    await (document as any).webkitExitFullscreen();
                } else if ((document as any).msExitFullscreen) {
                    await (document as any).msExitFullscreen();
                }
            }
        } catch (error) {
            console.error('Fullscreen error:', error);
            // iOS 可能不支持全屏，静默失败
        }
    }, []);


    // 初始化对齐方式
    useEffect(() => {
        const savedAlign = sessionStorage.getItem('player-text-align') as 'left' | 'center' | 'right' | null;
        if (savedAlign) {
            setTextAlign(savedAlign);
        }
        
        // 优先从 localStorage 读取持久化的颜色设置
        const savedBgColor = localStorage.getItem('player-bg-color');
        if (savedBgColor) {
            setBackgroundColor(savedBgColor);
        }
        
        const savedLyricColor = localStorage.getItem('player-lyric-color');
        if (savedLyricColor) {
            setLyricColor(savedLyricColor);
        }
        
        const savedSubOpacity = sessionStorage.getItem('player-sub-opacity');
        if (savedSubOpacity) {
            setSubLyricOpacity(Number(savedSubOpacity));
        }
    }, []);
    
    // 监听主题模式变化，更新默认颜色（仅当用户未自定义时）
    useEffect(() => {
        const checkThemeAndSetDefaults = () => {
            // 只有当用户没有自定义背景/歌词颜色时才应用主题默认值
            if (!localStorage.getItem('player-bg-color')) {
                const preferences = localStorage.getItem('preferences');
                const themeMode = preferences ? JSON.parse(preferences).themeMode : 0;
                
                if (themeMode === 1) { // 亮色模式
                    setBackgroundColor('#ededed');
                } else {
                    setBackgroundColor('#2e2e2e');
                }
            }
            
            if (!localStorage.getItem('player-lyric-color')) {
                const preferences = localStorage.getItem('preferences');
                const themeMode = preferences ? JSON.parse(preferences).themeMode : 0;
                
                if (themeMode === 1) { // 亮色模式
                    setLyricColor('#eeeeee');
                } else {
                    setLyricColor('#ffffff');
                }
            }
        };
        
        // 初始检查
        checkThemeAndSetDefaults();
        
        // 监听 storage 变化（其他标签页修改主题）
        window.addEventListener('storage', checkThemeAndSetDefaults);
        return () => window.removeEventListener('storage', checkThemeAndSetDefaults);
    }, []);
    
    // 设置 html 元素背景色为用户选择的颜色（仅在 Player 页面）
    useEffect(() => {
        const originalHtmlBgColor = document.documentElement.style.backgroundColor;
        document.documentElement.style.setProperty('background-color', backgroundColor, 'important');
        
        return () => {
            // 组件卸载时恢复原来的背景色
            document.documentElement.style.backgroundColor = originalHtmlBgColor;
        };
    }, [backgroundColor]);

    // 点击歌词跳转到指定时间
    const onLineClick = useCallback(
        (ev: React.MouseEvent<HTMLLIElement>) => {
            ev.stopPropagation();
            const target = ev.currentTarget;
            const key = Number.parseInt(target.dataset.key!, 10);
            const lineTime = lyric[key]?.time;
            
            if (lineTime !== undefined && audioRef.current) {
                audioRef.current.currentTime = lineTime;
            }
        },
        [lyric]
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
            title="点击跳转到此位置"
        >
            {highlight && showTime && <Curser fixed={prefState.fixed} />}
            {showTime && line.time !== undefined && (
                <time className="player-line-time">{lineTime}</time>
            )}
            {renderLyricText(lineText)}
        </li>
    );
};
