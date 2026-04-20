/**
 * 音频状态管理 Store
 * 统一管理音频相关的状态和操作
 */
import { create } from 'zustand';
import { audioRef } from '../utils/audiomodule.js';

interface AudioState {
    // 状态
    paused: boolean;
    duration: number;
    currentTime: number;
    rate: number;
    playMode: number;  // 0=顺序, 1=随机, 2=单曲循环
    
    // 操作
    setPaused: (paused: boolean) => void;
    setDuration: (duration: number) => void;
    setCurrentTime: (time: number) => void;
    setRate: (rate: number) => void;
    setPlayMode: (mode: number) => void;
    togglePlay: () => void;
    seekTo: (time: number) => void;
    stepForward: (seconds?: number) => void;
    stepBackward: (seconds?: number) => void;
    previousTrack: () => void;
    nextTrack: () => void;
}

export const useAudioStore = create<AudioState>((set, get) => ({
    // 初始状态
    paused: true,
    duration: 0,
    currentTime: 0,
    rate: 1,
    playMode: 0,
    
    // 状态更新方法
    setPaused: (paused) => set({ paused }),
    setDuration: (duration) => set({ duration }),
    setCurrentTime: (currentTime) => set({ currentTime }),
    setRate: (rate) => set({ rate }),
    setPlayMode: (playMode) => set({ playMode }),
    
    // 操作方法
    togglePlay: () => {
        audioRef.toggle();
        // 注意：实际状态变化会通过 audioStatePubSub 通知
    },
    
    seekTo: (time) => {
        audioRef.currentTime = time;
        set({ currentTime: time });
    },
    
    stepForward: (seconds = 5) => {
        audioRef.step({ altKey: false, shiftKey: false } as any, seconds);
    },
    
    stepBackward: (seconds = 5) => {
        audioRef.step({ altKey: false, shiftKey: false } as any, -seconds);
    },
    
    previousTrack: () => {
        // 触发 footer 的上一首逻辑
        window.dispatchEvent(new CustomEvent('previous-track'));
    },
    
    nextTrack: () => {
        // 触发 footer 的下一首逻辑
        window.dispatchEvent(new CustomEvent('next-track'));
    },
}));
