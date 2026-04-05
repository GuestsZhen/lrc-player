import { convertTimeToTag } from "@lrc-maker/lrc-parser";
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
    AudioActionType,
    audioRef,
    type AudioState,
    audioStatePubSub,
    currentTimePubSub,
} from "../utils/audiomodule.js";
import { appContext, ChangBits } from "./app.context";
import { loadAudioDialogRef } from "./loadaudio.js";
import { PauseSVG, PlaySVG, SettingsSVG, PreviousSVG, NextSVG, PlaylistSVG, RepeatSVG, ShuffleSVG, RepeatOneSVG, PreferencesSVG } from "./svg.js";
import { Waveform } from "./waveform";

interface ISliderProps {
    min: number;
    max: number;
    step?: string | number;
    value: number;
    onInput: (event: React.ChangeEvent<HTMLInputElement>) => void;
    className: string;
}

const Slider: React.FC<ISliderProps> = ({ min, max, step, value, onInput, className }) => {
    const total = max - min || 1;
    const percent = (value - min) / total;

    return (
        <div className={`slider ${className}-slider`}>
            <progress value={percent} />
            <input
                type="range"
                className={className}
                aria-label={className}
                min={min}
                max={max}
                step={step}
                value={value}
                onInput={onInput}
            />
        </div>
    );
};

const TimeLine: React.FC<{ duration: number; paused: boolean }> = ({ duration, paused }) => {
    const self = useRef(Symbol(TimeLine.name));
    const [currentTime, setCurrentTime] = useState(audioRef.currentTime);
    const [rate, setRate] = useState(audioRef.playbackRate);
    const [localAudioMode, setLocalAudioMode] = useState(false);

    useEffect(() => {
        return audioStatePubSub.sub(self.current, (data) => {
            switch (data.type) {
                case AudioActionType.rateChange: {
                    setRate(data.payload);
                    break;
                }
                case AudioActionType.getDuration: {
                    setLocalAudioMode(audioRef.src.startsWith("blob:"));
                    break;
                }
            }
        });
    }, []);

    useEffect(() => {
        if (paused) {
            // update the value once when paused to reflect the exact time
            setCurrentTime(audioRef.currentTime);
            // paused but user changing the time
            return currentTimePubSub.sub(self.current, (data) => {
                setCurrentTime(data);
            });
        } else {
            const id = setInterval(() => {
                setCurrentTime(audioRef.currentTime);
            }, 100 / rate); // redraw the waveform cursor faster

            return (): void => {
                clearInterval(id);
            };
        }
    }, [paused, rate]);

    const rafId = useRef(0);

    const onInput = useCallback((ev: React.ChangeEvent<HTMLInputElement>) => {
        if (rafId.current) {
            cancelAnimationFrame(rafId.current);
        }

        const value = ev.target.value;

        rafId.current = requestAnimationFrame(() => {
            const time = Number.parseInt(value, 10);
            setCurrentTime(time);
            audioRef.currentTime = time;
        });
    }, []);

    const onSeek = useCallback((time: number) => {
        if (rafId.current) {
            cancelAnimationFrame(rafId.current);
        }

        rafId.current = requestAnimationFrame(() => {
            setCurrentTime(time);
            audioRef.currentTime = time;
        });
    }, []);

    const { prefState } = useContext(appContext, ChangBits.prefState);

    const showWaveform = prefState.showWaveform && localAudioMode;

    const fixed = showWaveform ? prefState.fixed : 0;

    const durationTimeTag = useMemo(() => {
        return duration ? convertTimeToTag(duration, fixed, false) : false;
    }, [duration, fixed]);

    return (
        <>
            <div className="timeline-wrapper">
                <time className="current-time">
                    {convertTimeToTag(currentTime, fixed, false)}
                </time>
                {showWaveform
                    ? (
                        <div className="slider waveform-container">
                            <Waveform value={currentTime} onSeek={onSeek} />
                        </div>
                    )
                    : (
                        <Slider
                            min={0}
                            max={duration}
                            step={1}
                            value={currentTime}
                            className="timeline"
                            onInput={onInput}
                        />
                    )}
                {durationTimeTag && (
                    <time className="duration-time">
                        {durationTimeTag}
                    </time>
                )}
            </div>
        </>
    );
};

const RateSlider: React.FC<{ lang: Language }> = ({ lang }) => {
    const self = useRef(Symbol(RateSlider.name));
    const [showMenu, setShowMenu] = useState(false);
    const [isHiding, setIsHiding] = useState(false); // 淡出动画状态
    const menuRef = useRef<HTMLDivElement>(null);

    const [playbackRate, setPlaybackRate] = useState(audioRef.playbackRate);

    // 点击其他区域时关闭菜单（带动画）
    useEffect(() => {
        if (!showMenu || isHiding) return;

        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            // 如果点击的不是菜单区域，关闭菜单
            if (menuRef.current && !menuRef.current.contains(target)) {
                closeMenu();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showMenu, isHiding]);

    // 关闭菜单（带动画）
    const closeMenu = useCallback(() => {
        setIsHiding(true);
        // 等待淡出动画完成后隐藏
        setTimeout(() => {
            setShowMenu(false);
            setIsHiding(false);
        }, 300); // 与 CSS 动画时间一致
    }, []);

    useEffect(() => {
        return audioStatePubSub.sub(self.current, (data: AudioState) => {
            if (data.type === AudioActionType.rateChange) {
                setPlaybackRate(data.payload);
            }
        });
    }, []);

    const decreaseRate = useCallback(() => {
        const newRate = Math.max(0.5, playbackRate - 0.05);
        setPlaybackRate(newRate);
        audioRef.playbackRate = newRate;
    }, [playbackRate]);

    // 增大播放速度 (每次 0.05)
    const increaseRate = useCallback(() => {
        const newRate = Math.min(2.0, playbackRate + 0.05);
        setPlaybackRate(newRate);
        audioRef.playbackRate = newRate;
    }, [playbackRate]);

    const playbackRateSliderValue = useMemo(() => {
        return Math.log(playbackRate);
    }, [playbackRate]);

    const onPlaybackRateChange = useCallback((ev: React.ChangeEvent<HTMLInputElement>) => {
        const value = Math.exp(Number.parseFloat(ev.target.value));
        setPlaybackRate(value);
        audioRef.playbackRate = value;
    }, []);

    const onPlaybackRateReset = useCallback(() => {
        audioRef.playbackRate = 1;
    }, []);

    return (
        <>
            {/* 设置按钮 */}
            <div className="settings-dropdown-wrapper">
                <button 
                    className="ripple glow settings-btn" 
                    title="播放速度设置"
                    onClick={() => {
                        if (showMenu && !isHiding) {
                            closeMenu();
                        } else {
                            setShowMenu(true);
                            setIsHiding(false);
                        }
                    }}
                >
                    <SettingsSVG />
                </button>
                
                {/* 速度调节下拉菜单 */}
                {showMenu && (
                    <div className={`settings-dropdown-menu${isHiding ? ' menu-hiding' : ''}`} ref={menuRef}>
                        <div className="speed-control-item">
                            <button 
                                className="speed-control-btn"
                                onClick={decreaseRate}
                                disabled={playbackRate <= 0.5}
                            >
                                -
                            </button>
                            <button 
                                className="speed-control-value"
                                onClick={onPlaybackRateReset}
                                title="重置为正常速度"
                            >
                                ×{playbackRate.toFixed(2)}
                            </button>
                            <button 
                                className="speed-control-btn"
                                onClick={increaseRate}
                                disabled={playbackRate >= 2.0}
                            >
                                +
                            </button>
                        </div>
                        <div className="speed-control-slider">
                            <Slider
                                className="playbackrate"
                                min={-1}
                                max={1}
                                step="any"
                                value={playbackRateSliderValue}
                                onInput={onPlaybackRateChange}
                            />
                        </div>
                        {/* Preferences 按钮 - 放在最下面 */}
                        <a 
                            className="settings-dropdown-item" 
                            href="#/preferences/"
                            title={lang.header.preferences}
                        >
                            <PreferencesSVG />
                            <span>{lang.header.preferences}</span>
                        </a>
                    </div>
                )}
            </div>
        </>
    );
};

interface ILrcAudioProps {
    lang: Language;
    currentTrackName?: string;  // 当前歌曲名称
}

export const LrcAudio: React.FC<ILrcAudioProps> = ({ lang, currentTrackName }) => {
    const self = useRef(Symbol(LrcAudio.name));

    const [paused, setPaused] = useState(audioRef.paused);

    const [duration, setDuration] = useState(audioRef.duration);
    
    const [currentTime, setCurrentTime] = useState(audioRef.currentTime);
    
    const [rate, setRate] = useState(audioRef.playbackRate);
    
    const [localAudioMode, setLocalAudioMode] = useState(false);

    useEffect(() => {
        return audioStatePubSub.sub(self.current, (data: AudioState) => {
            switch (data.type) {
                case AudioActionType.getDuration: {
                    setDuration(data.payload);
                    setPaused(audioRef.paused);
                    setLocalAudioMode(audioRef.src.startsWith("blob:"));
                    break;
                }
                case AudioActionType.pause: {
                    setPaused(data.payload);
                    break;
                }
                case AudioActionType.rateChange: {
                    setRate(data.payload);
                    break;
                }
            }
        });
    }, []);
    
    // 监听当前时间变化
    useEffect(() => {
        if (paused) {
            return currentTimePubSub.sub(self.current, (time) => {
                setCurrentTime(time);
            });
        } else {
            const id = setInterval(() => {
                setCurrentTime(audioRef.currentTime);
            }, 100 / rate);

            return (): void => {
                clearInterval(id);
            };
        }
    }, [paused, rate]);
    
    const rafId = useRef(0);
    
    const onInput = useCallback((ev: React.ChangeEvent<HTMLInputElement>) => {
        if (rafId.current) {
            cancelAnimationFrame(rafId.current);
        }

        const value = ev.target.value;

        rafId.current = requestAnimationFrame(() => {
            const time = Number.parseInt(value, 10);
            setCurrentTime(time);
            audioRef.currentTime = time;
        });
    }, []);
    
    const onSeek = useCallback((time: number) => {
        if (rafId.current) {
            cancelAnimationFrame(rafId.current);
        }

        rafId.current = requestAnimationFrame(() => {
            setCurrentTime(time);
            audioRef.currentTime = time;
        });
    }, []);
    
    const { prefState } = useContext(appContext, ChangBits.prefState);
    
    const showWaveform = prefState.showWaveform && localAudioMode;
    
    const fixed = showWaveform ? prefState.fixed : 0;
    
    const durationTimeTag = useMemo(() => {
        return duration ? convertTimeToTag(duration, fixed, false) : false;
    }, [duration, fixed]);

    const onReplay5s = useCallback((ev: React.MouseEvent<HTMLButtonElement>) => {
        audioRef.step(ev, -5);
    }, []);

    const onForward5s = useCallback((ev: React.MouseEvent<HTMLButtonElement>) => {
        audioRef.step(ev, 5);
    }, []);

    const onPlayPauseToggle = useCallback(() => {
        audioRef.toggle();
    }, []);

    // 播放模式：0=顺序播放，1=随机播放，2=单曲循环
    const [playMode, setPlayMode] = useState(0);
    
    const onPlayModeToggle = useCallback(() => {
        setPlayMode(prev => {
            const newMode = (prev + 1) % 3;
            // 发送播放模式变化事件
            const event = new CustomEvent('play-mode-change', { detail: { playMode: newMode } });
            window.dispatchEvent(event);
            return newMode;
        });
    }, []);

    const onLoadAudioButtonClick = useCallback(() => {
        loadAudioDialogRef.open();
    }, []);

    // 上一首歌 - 暂时禁用
    const onPreviousTrack = useCallback(() => {
        // 功能已禁用，保留按钮UI
        console.log('上一曲功能已禁用');
    }, []);

    // 下一首歌 - 暂时禁用
    const onNextTrack = useCallback(() => {
        // 功能已禁用，保留按钮UI
        console.log('下一曲功能已禁用');
    }, []);

    return (
        <section className={"lrc-audio" + (paused ? "" : " playing")}>
            {/* 竖屏模式下的三行布局 */}
            <div className="portrait-layout">
                {/* 第一行：当前时间 | 歌曲文件名 | 总时长 */}
                <div className="track-info-row">
                    <time className="track-current-time">
                        {convertTimeToTag(currentTime, fixed, false)}
                    </time>
                    {currentTrackName && (
                        <span className="track-name-text">{currentTrackName}</span>
                    )}
                    {durationTimeTag && (
                        <time className="track-duration-time">
                            {durationTimeTag}
                        </time>
                    )}
                </div>
                
                {/* 第二行：进度条 */}
                <div className="timeline-row">
                    {showWaveform
                        ? (
                            <div className="slider waveform-container">
                                <Waveform value={currentTime} onSeek={onSeek} />
                            </div>
                        )
                        : (
                            <Slider
                                min={0}
                                max={duration}
                                step={1}
                                value={currentTime}
                                className="timeline"
                                onInput={onInput}
                            />
                        )}
                </div>
                
                {/* 第三行：控制按钮 */}
                <div className="controls-row">
                    {/* 左下角播放顺序按钮 */}
                    <button 
                        className="ripple glow play-mode-button-left" 
                        title={playMode === 0 ? '顺序播放' : playMode === 1 ? '随机播放' : '单曲循环'}
                        onClick={onPlayModeToggle}
                    >
                        {playMode === 0 ? <RepeatSVG /> : playMode === 1 ? <ShuffleSVG /> : <RepeatOneSVG />}
                    </button>
                    
                    {/* 中间按钮组 */}
                    <div className="controls-center">
                        <button 
                            className="ripple glow previous-button" 
                            title="上一首歌" 
                            onClick={onPreviousTrack}
                            disabled={!duration}
                        >
                            <PreviousSVG />
                        </button>
                        <button
                            className="ripple glow play-button"
                            title={paused ? lang.audio.play : lang.audio.pause}
                            disabled={!duration}
                            onClick={onPlayPauseToggle}
                        >
                            {paused ? <PlaySVG /> : <PauseSVG />}
                        </button>
                        <button 
                            className="ripple glow next-button" 
                            title="下一首歌" 
                            onClick={onNextTrack}
                            disabled={!duration}
                        >
                            <NextSVG />
                        </button>
                    </div>
                    
                    {/* 右侧速度按钮 */}
                    <div className="controls-right">
                        <RateSlider lang={lang} />
                    </div>
                </div>
            </div>
            
            {/* 横屏模式保持原有布局 */}
            <div className="landscape-layout">
                <button 
                    className="ripple glow" 
                    title={playMode === 0 ? '顺序播放' : playMode === 1 ? '随机播放' : '单曲循环'}
                    onClick={onPlayModeToggle}
                >
                    {playMode === 0 ? <RepeatSVG /> : playMode === 1 ? <ShuffleSVG /> : <RepeatOneSVG />}
                </button>
                <button 
                    className="ripple glow" 
                    title="上一首歌" 
                    onClick={onPreviousTrack}
                    disabled={!duration}
                >
                    <PreviousSVG />
                </button>
                <button
                    className="ripple glow"
                    title={paused ? lang.audio.play : lang.audio.pause}
                    disabled={!duration}
                    onClick={onPlayPauseToggle}
                >
                    {paused ? <PlaySVG /> : <PauseSVG />}
                </button>
                <button 
                    className="ripple glow" 
                    title="下一首歌" 
                    onClick={onNextTrack}
                    disabled={!duration}
                >
                    <NextSVG />
                </button>

                <TimeLine duration={duration} paused={paused} />
                <RateSlider lang={lang} />
            </div>
        </section>
    );
};
