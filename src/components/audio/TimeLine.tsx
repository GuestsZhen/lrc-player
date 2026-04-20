/**
 * 时间轴组件
 */
import { convertTimeToTag } from "@lrc-maker/lrc-parser";
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { audioRef, audioStatePubSub, currentTimePubSub, AudioActionType } from "../../utils/audiomodule.js";
import { appContext, ChangBits } from "../app.context";
import { Waveform } from "../waveform";
import { Slider } from "./Slider";
import { useAudioControl } from '../../hooks/useAudioControl';
import { isAndroidNative } from '../../utils/platform-detector';

interface ITimeLineProps {
    duration: number;
    paused: boolean;
    showTimeText?: boolean;  // ✅ 新增：是否显示时间文本，默认 true
    /**
     * ✅ Android 模式下传入音频 Blob URL（用于波形显示）
     */
    audioSrc?: string;
}

export const TimeLine: React.FC<ITimeLineProps> = ({ duration, paused, showTimeText = true, audioSrc }) => {
    const self = useRef(Symbol('TimeLine'));
    const [localCurrentTime, setLocalCurrentTime] = useState(audioRef.currentTime);
    const [rate, setRate] = useState(audioRef.playbackRate);
    const [localAudioMode, setLocalAudioMode] = useState(false);
    
    // ✅ 获取 useAudioControl 的 seekTo 方法和 currentTime
    const { seekTo: audioSeekTo, currentTime: controlCurrentTime } = useAudioControl();
    
    // ✅ Android 模式下使用 useAudioControl 的 currentTime，Web 模式使用本地状态
    const currentTime = isAndroidNative() ? controlCurrentTime : localCurrentTime;

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
        // ✅ Android 模式下 currentTime 由 useAudioControl 管理，不需要额外监听
        if (isAndroidNative()) {
            return;
        }
        
        // Web 模式使用 HTML5 Audio
        if (paused) {
            setLocalCurrentTime(audioRef.currentTime);
            return currentTimePubSub.sub(self.current, (data) => {
                setLocalCurrentTime(data);
            });
        } else {
            const id = setInterval(() => {
                setLocalCurrentTime(audioRef.currentTime);
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
            
            // ✅ Android 模式下 currentTime 由 useAudioControl 管理，不需要手动更新
            if (!isAndroidNative()) {
                setLocalCurrentTime(time);
            }
            
            // ✅ Android 模式下使用 useAudioControl 的 seekTo
            if (isAndroidNative()) {
                audioSeekTo(time);
            } else {
                audioRef.currentTime = time;
            }
        });
    }, [audioSeekTo]);

    const onSeek = useCallback((time: number) => {
        if (rafId.current) {
            cancelAnimationFrame(rafId.current);
        }

        rafId.current = requestAnimationFrame(() => {
            // ✅ Android 模式下 currentTime 由 useAudioControl 管理，不需要手动更新
            if (!isAndroidNative()) {
                setLocalCurrentTime(time);
            }
            
            // ✅ Android 模式下使用 useAudioControl 的 seekTo
            if (isAndroidNative()) {
                audioSeekTo(time);
            } else {
                audioRef.currentTime = time;
            }
        });
    }, [audioSeekTo]);

    const { prefState } = useContext(appContext, ChangBits.prefState);

    // ✅ Android 模式下使用传入的 audioSrc，Web 模式使用 localAudioMode
    const showWaveform = isAndroidNative()
        ? (prefState.showWaveform && !!audioSrc)
        : (prefState.showWaveform && localAudioMode);
    const fixed = showWaveform ? prefState.fixed : 0;

    const durationTimeTag = useMemo(() => {
        return duration ? convertTimeToTag(duration, fixed, false) : false;
    }, [duration, fixed]);

    return (
        <div className="timeline-wrapper">
            {/* ✅ 只在 showTimeText 为 true 时显示时间文本 */}
            {showTimeText && (
                <time className="current-time">
                    {convertTimeToTag(currentTime, fixed, false)}
                </time>
            )}
            {showWaveform
                ? (
                    <div className="slider waveform-container">
                        <Waveform value={currentTime} onSeek={onSeek} audioSrc={audioSrc} />
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
            {/* ✅ 只在 showTimeText 为 true 时显示总时长 */}
            {showTimeText && durationTimeTag && (
                <time className="duration-time">
                    {durationTimeTag}
                </time>
            )}
        </div>
    );
};
