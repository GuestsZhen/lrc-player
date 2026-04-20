/**
 * 播放模式管理 Hook
 */
import { useState, useCallback, useEffect } from 'react';

export type PlayMode = 0 | 1 | 2; // 0=顺序播放, 1=随机播放, 2=单曲循环

interface UsePlaybackModeReturn {
    playMode: PlayMode;
    togglePlayMode: () => void;
    getPlayModeName: () => string;
}

export function usePlaybackMode(): UsePlaybackModeReturn {
    const [playMode, setPlayMode] = useState<PlayMode>(0);

    const togglePlayMode = useCallback(() => {
        setPlayMode(prev => {
            const newMode = ((prev + 1) % 3) as PlayMode;
            return newMode;
        });
    }, []);

    const getPlayModeName = useCallback((): string => {
        const names = ['顺序播放', '随机播放', '单曲循环'];
        return names[playMode];
    }, [playMode]);

    // 当 playMode 变化时，发送事件通知 footer
    useEffect(() => {
        const event = new CustomEvent('play-mode-change', { detail: { playMode } });
        window.dispatchEvent(event);
    }, [playMode]);

    return {
        playMode,
        togglePlayMode,
        getPlayModeName,
    };
}
