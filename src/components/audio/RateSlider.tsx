/**
 * 播放速度调节组件
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { audioRef, audioStatePubSub, AudioActionType, type AudioState } from "../../utils/audiomodule.js";
import ROUTER from "#const/router.json" assert { type: "json" };
import { prependHash } from "../../utils/router.js";
import { SettingsSVG, PreferencesSVG } from "../svg.js";
import { Slider } from "./Slider";
import { useMenu } from '../../hooks/useMenu.js';
import { isAndroidNative } from '../../utils/platform-detector.js';
import { setExoPlayerSpeed } from '../../utils/playback-control.js';

interface IRateSliderProps {
    lang: Language;
}

export const RateSlider: React.FC<IRateSliderProps> = ({ lang }) => {
    // ✅ 使用 useMenu Hook
    const { isOpen: showMenu, isHiding, menuRef, close: closeMenu, toggle: toggleMenu } = useMenu();

    const [playbackRate, setPlaybackRate] = useState(audioRef.playbackRate || 1);

    useEffect(() => {
        return audioStatePubSub.sub(Symbol('RateSlider'), (data: AudioState) => {
            if (data.type === AudioActionType.rateChange) {
                setPlaybackRate(data.payload);
            }
        });
    }, []);

    // ✅ Android 模式下设置 ExoPlayer 速度
    const setRate = useCallback(async (newRate: number) => {
        setPlaybackRate(newRate);
        
        if (isAndroidNative()) {
            // Android 模式：调用 ExoPlayer
            await setExoPlayerSpeed(newRate);
        } else {
            // Web 模式：使用 HTML5 Audio
            audioRef.playbackRate = newRate;
        }
    }, []);

    const decreaseRate = useCallback(() => {
        const newRate = Math.max(0.5, playbackRate - 0.05);
        setRate(newRate);
    }, [playbackRate, setRate]);

    const increaseRate = useCallback(() => {
        const newRate = Math.min(2.0, playbackRate + 0.05);
        setRate(newRate);
    }, [playbackRate, setRate]);

    const playbackRateSliderValue = useMemo(() => {
        const rate = playbackRate || 1;
        return Math.log(rate);
    }, [playbackRate]);

    const onPlaybackRateChange = useCallback((ev: React.ChangeEvent<HTMLInputElement>) => {
        const value = Math.exp(Number.parseFloat(ev.target.value));
        setRate(value);
    }, [setRate]);

    const onPlaybackRateReset = useCallback(() => {
        setRate(1);
    }, [setRate]);

    return (
        <div className="settings-dropdown-wrapper">
            {/* ✅ Android 模式下直接跳转到 preferences 页面 */}
            {isAndroidNative() ? (
                <a 
                    className="ripple glow settings-btn" 
                    href={prependHash(ROUTER.preferences)}
                    title="播放速度设置"
                >
                    <SettingsSVG />
                </a>
            ) : (
                <button 
                    className="ripple glow settings-btn" 
                    title="播放速度设置"
                    onClick={toggleMenu}
                >
                    <SettingsSVG />
                </button>
            )}
            
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
                    {/* Preferences 按钮 */}
                    <a 
                        className="settings-dropdown-item" 
                        href={prependHash(ROUTER.preferences)}
                        title={lang.header.preferences}
                    >
                        <PreferencesSVG />
                        <span>{lang.header.preferences}</span>
                    </a>
                </div>
            )}
        </div>
    );
};
