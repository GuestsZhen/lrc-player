/**
 * 音频控制 Hook
 * 封装所有音频相关的状态和操作
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { audioRef, audioStatePubSub, currentTimePubSub, AudioActionType, type AudioState } from '../utils/audiomodule.js';
import { isAndroidNative } from '../utils/platform-detector.js';
import { pauseExoPlayer, resumeExoPlayer, seekExoPlayerTo } from '../utils/playback-control.js';
import { addStatusUpdateListener } from '../utils/exoplayer-plugin.js';

interface UseAudioControlReturn {
    paused: boolean;
    duration: number;
    currentTime: number;
    rate: number;
    togglePlay: () => void;
    seekTo: (time: number) => void;
    stepForward: (seconds?: number) => void;
    stepBackward: (seconds?: number) => void;
}

export function useAudioControl(): UseAudioControlReturn {
    const self = useRef(Symbol('useAudioControl'));
    
    // ✅ Android 原生环境默认 paused 为 false（因为 ExoPlayer 不在这里管理）
    const initialPaused = isAndroidNative() ? false : audioRef.paused;
    
    const [paused, setPaused] = useState(initialPaused);
    const [duration, setDuration] = useState(audioRef.duration);
    const [currentTime, setCurrentTime] = useState(audioRef.currentTime);
    const [rate, setRate] = useState(audioRef.playbackRate);

    useEffect(() => {
        return audioStatePubSub.sub(self.current, (data: AudioState) => {
            switch (data.type) {
                case AudioActionType.pause: {
                    setPaused(data.payload);
                    break;
                }
                case AudioActionType.getDuration: {
                    setDuration(data.payload);
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
        // ✅ Android 模式下监听 ExoPlayer 状态更新（只注册一次）
        if (isAndroidNative()) {
            const removeListener = addStatusUpdateListener((status) => {
                const newDuration = status.duration / 1000;
                const newCurrentTime = status.currentTime / 1000;
                const newPaused = !status.isPlaying;
                
                setDuration(newDuration);
                setCurrentTime(newCurrentTime);
                setPaused(newPaused);
                
                // ✅ 保存 ExoPlayer 状态到全局变量（供 keyboard shortcuts 使用）
                const oldSpeed = (window as any).__exoPlayerStatus?.speed;
                const newSpeed = (status as any).speed;
                if (oldSpeed !== undefined && oldSpeed !== newSpeed) {
                }
                (window as any).__exoPlayerStatus = status;
            });
            
            return () => {
                removeListener();
            };
        }
        
        // Web 模式使用 HTML5 Audio
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
    }, [rate]); // ✅ 移除 paused 依赖，避免重复注册

    const togglePlay = useCallback(async () => {
        // ✅ Android 原生环境使用 ExoPlayer
        if (isAndroidNative()) {
            if (paused) {
                // 当前是暂停状态，需要恢复播放
                await resumeExoPlayer();
                setPaused(false);
            } else {
                // 当前是播放状态，需要暂停
                await pauseExoPlayer();
                setPaused(true);
            }
            return;
        }
        
        // Web 环境使用 HTML5 Audio
        audioRef.toggle();
    }, [paused]);

    const seekTo = useCallback(async (time: number) => {
        // ✅ Android 模式下使用 ExoPlayer
        if (isAndroidNative()) {
            await seekExoPlayerTo(time * 1000); // 秒转毫秒
            setCurrentTime(time);
            return;
        }
        
        // Web 模式使用 HTML5 Audio
        audioRef.currentTime = time;
        setCurrentTime(time);
    }, []);

    const stepForward = useCallback((seconds: number = 5) => {
        audioRef.step({ altKey: false, shiftKey: false } as any, seconds);
    }, []);

    const stepBackward = useCallback((seconds: number = 5) => {
        audioRef.step({ altKey: false, shiftKey: false } as any, -seconds);
    }, []);

    return {
        paused,
        duration,
        currentTime,
        rate,
        togglePlay,
        seekTo,
        stepForward,
        stepBackward,
    };
}
