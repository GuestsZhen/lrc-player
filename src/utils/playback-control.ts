/**
 * 播放控制工具函数
 * 处理上一首/下一首的索引计算和歌曲切换
 */

import type { ITrackInfo } from '../utils/playlist-manager.js';
import { audioRef } from '../utils/audiomodule.js';
import { receiveFile } from './audio-decoder.js';
import { getBaseName } from './file-utils.js';
import { isAndroidNative } from './platform-detector.js';
import { ExoPlayerPlugin, startBackgroundService, stopBackgroundService } from './exoplayer-plugin.js';

/**
 * 播放模式枚举
 */
export enum PlayMode {
    SEQUENTIAL = 0,  // 顺序播放
    RANDOM = 1,      // 随机播放
    REPEAT_ONE = 2   // 单曲循环
}

/**
 * 计算下一个播放索引
 * @param currentIndex - 当前索引
 * @param totalLength - 播放列表总长度
 * @param playMode - 播放模式
 * @param direction - 方向 ('prev' | 'next')
 * @returns 下一个播放索引
 */
export const calculateNextIndex = (
    currentIndex: number,
    totalLength: number,
    playMode: PlayMode,
    direction: 'prev' | 'next'
): number => {
    if (totalLength === 0) return -1;
    
    // 单曲循环:保持当前索引
    if (playMode === PlayMode.REPEAT_ONE) {
        return currentIndex;
    }
    
    // 随机播放:随机选择一个索引(排除当前歌曲)
    if (playMode === PlayMode.RANDOM) {
        if (totalLength === 1) return 0;
        
        let nextIndex: number;
        do {
            nextIndex = Math.floor(Math.random() * totalLength);
        } while (nextIndex === currentIndex);
        
        return nextIndex;
    }
    
    // 顺序播放
    if (direction === 'next') {
        return (currentIndex + 1) % totalLength;
    } else {
        return (currentIndex - 1 + totalLength) % totalLength;
    }
};

/**
 * 加载并播放 MS 音轨(MediaStore)
 * @param tracks - MS 音轨列表
 * @param targetIndex - 目标索引
 * @param readAudioFile - 读取音频文件的函数
 * @param readLrcFile - 读取 LRC 文件的函数
 * @param loadLrcFile - 加载 LRC 文件的回调
 * @param setDisplayTrackName - 设置显示歌名的回调
 */
export const loadMSTrack = async (
    tracks: any[],
    targetIndex: number,
    readAudioFile: (track: any) => Promise<File>,
    readLrcFile: (track: any) => Promise<File | undefined | null>,
    loadLrcFile: (file: File) => void,
    setDisplayTrackName: (name: string) => void
): Promise<void> => {
    try {
        const track = tracks[targetIndex];
        
        // ✅ Android 原生环境使用 ExoPlayer
        if (isAndroidNative()) {
            await loadMSTrackWithExoPlayer(
                track,
                targetIndex,
                readAudioFile,
                readLrcFile,
                loadLrcFile,
                setDisplayTrackName
            );
            return;
        }
        
        // ✅ Web 环境使用原有逻辑
        await loadMSTrackWithWebAudio(
            track,
            targetIndex,
            readAudioFile,
            readLrcFile,
            loadLrcFile,
            setDisplayTrackName
        );
        
    } catch (error) {
        console.error('加载 MS 音轨失败:', error);
        throw error;
    }
};

/**
 * 使用 ExoPlayer 加载 MS 音轨（Android 原生）
 */
const loadMSTrackWithExoPlayer = async (
    track: any,
    targetIndex: number,
    readAudioFile: (track: any) => Promise<File>,
    readLrcFile: (track: any) => Promise<File | undefined | null>,
    loadLrcFile: (file: File) => void,
    setDisplayTrackName: (name: string) => void
): Promise<void> => {
    try {
        
        // ✅ 直接使用 track 的原始路径/URI（content:// 或 file://）
        let audioUri = track.uri || track.filePath || track.path;
        
        if (!audioUri) {
            // 降级方案：读取 File 对象并保存为临时文件
            const audioFile = await readAudioFile(track);
            const lrcFile = await readLrcFile(track);
            
            // 更新全局索引
            (window as any).__msCurrentIndex = targetIndex;
            
            // 初始化 ExoPlayer
            try {
                await ExoPlayerPlugin.initialize();
            } catch (error) {
            }
            
            // 使用 File 对象（需要通过其他方式转换）
            const audioUrl = URL.createObjectURL(audioFile);
            
            // ✅ 更新：传递 title 和 artist 用于通知栏显示
            const trackName = getBaseName(track.fileName);
            await ExoPlayerPlugin.play({ 
                uri: audioUrl, 
                title: trackName,
                artist: '' 
            });
            
            if (lrcFile) {
                loadLrcFile(lrcFile);
            }
            
            setDisplayTrackName(trackName);
            return;
        }
        
        
        const lrcFile = await readLrcFile(track);
        
        // 更新全局索引
        (window as any).__msCurrentIndex = targetIndex;
        
        // ✅ 初始化 ExoPlayer（如果尚未初始化）
        try {
            const initResult = await ExoPlayerPlugin.initialize();
        } catch (error) {
        }
        
        // ✅ 启动后台播放服务
        try {
            await startBackgroundService();
        } catch (error) {
        }
        
        // ✅ 直接使用 content URI 播放，并传递歌曲信息
        const trackName = getBaseName(track.fileName);
        await ExoPlayerPlugin.play({ 
            uri: audioUri,
            title: trackName,
            artist: ''
        });
        
        // 加载 LRC
        if (lrcFile) {
            loadLrcFile(lrcFile);
        }
        
        // 更新显示的歌名
        const name = getBaseName(track.fileName);
        setDisplayTrackName(name);
        
        
    } catch (error) {
        throw error;
    }
};

/**
 * 使用 Web Audio 加载 MS 音轨（Web 环境）
 */
const loadMSTrackWithWebAudio = async (
    track: any,
    targetIndex: number,
    readAudioFile: (track: any) => Promise<File>,
    readLrcFile: (track: any) => Promise<File | undefined | null>,
    loadLrcFile: (file: File) => void,
    setDisplayTrackName: (name: string) => void
): Promise<void> => {
    try {
        // 读取文件
        const audioFile = await readAudioFile(track);
        const lrcFile = await readLrcFile(track);
        
        // 更新全局索引
        (window as any).__msCurrentIndex = targetIndex;
        
        // 设置音频源
        const audioUrl = URL.createObjectURL(audioFile);
        if (audioRef.current) {
            audioRef.current.src = audioUrl;
            setTimeout(() => {
                audioRef.current?.play();
            }, 200);
        }
        
        // 加载 LRC
        if (lrcFile) {
            loadLrcFile(lrcFile);
        }
        
        // 更新显示的歌名
        const name = getBaseName(track.fileName);
        setDisplayTrackName(name);
        
    } catch (error) {
        throw error;
    }
};

/**
 * 加载并播放普通播放列表中的歌曲
 * @param track - 轨道信息
 * @param index - 轨道索引
 * @param playlist - 播放列表
 * @param setCurrentTrackIndex - 设置当前索引的回调
 * @param loadLrcFile - 加载 LRC 文件的回调
 * @param updateCurrentTrackName - 更新当前歌名的回调
 */
export const loadNormalTrack = (
    track: ITrackInfo,
    index: number,
    playlist: ITrackInfo[],
    setCurrentTrackIndex: (index: number) => void,
    loadLrcFile: (file: File) => void,
    updateCurrentTrackName: (index: number, playlist: ITrackInfo[]) => void
): void => {
    if (!track.file) return;
    
    // 加载音频
    receiveFile(track.file, (src: string) => {
        // setAudioSrc 会通过 footer 组件内部的状态管理处理
        const event = new CustomEvent('set-audio-src', { detail: src });
        window.dispatchEvent(event);
    });
    
    setCurrentTrackIndex(index);
    
    // 延迟播放
    setTimeout(() => {
        audioRef.current?.play();
    }, 200);
    
    // 加载 LRC
    if (track.lrcFile) {
        loadLrcFile(track.lrcFile);
    }
    
    // 通知 content.tsx 更新当前播放文件
    window.dispatchEvent(new CustomEvent('current-playing-file-change', {
        detail: { fileName: track.fileName }
    }));
    
    // 更新 Header 显示的歌名
    updateCurrentTrackName(index, playlist);
};

// ==================== ExoPlayer 控制函数 ====================

/**
 * 暂停 ExoPlayer 播放
 */
export const pauseExoPlayer = async (): Promise<void> => {
    if (!isAndroidNative()) return;
    
    try {
        await ExoPlayerPlugin.pause();
    } catch (error) {
    }
};

/**
 * 恢复 ExoPlayer 播放
 */
export const resumeExoPlayer = async (): Promise<void> => {
    if (!isAndroidNative()) return;
    
    try {
        // ✅ 使用专门的 resume 方法，不需要传递 URI
        await ExoPlayerPlugin.resume();
    } catch (error) {
        throw error;
    }
};

/**
 * 停止 ExoPlayer 播放
 */
export const stopExoPlayer = async (): Promise<void> => {
    if (!isAndroidNative()) return;
    
    try {
        await ExoPlayerPlugin.stop();
        
        // ✅ 停止后台播放服务
        await stopBackgroundService();
    } catch (error) {
    }
};

/**
 * 设置 ExoPlayer 播放速度
 * @param speed - 播放速度 (0.25 - 8.0)
 */
export const setExoPlayerSpeed = async (speed: number): Promise<void> => {
    if (!isAndroidNative()) return;
    
    try {
        await ExoPlayerPlugin.setSpeed({ speed });
        
        // ✅ 立即更新全局状态，避免延迟
        if ((window as any).__exoPlayerStatus) {
            (window as any).__exoPlayerStatus.speed = speed;
        }
    } catch (error) {
    }
};

/**
 * 设置 ExoPlayer 音高
 * @param pitch - 音调系数 (0.5 - 2.0)，1.0 为原调
 */
export const setExoPlayerPitch = async (pitch: number): Promise<void> => {
    if (!isAndroidNative()) return;
    
    try {
        await ExoPlayerPlugin.setPitch({ pitch });
    } catch (error) {
    }
};

/**
 * 获取 ExoPlayer 当前状态
 */
export const getExoPlayerStatus = async () => {
    if (!isAndroidNative()) {
        return null;
    }
    
    try {
        const status = await ExoPlayerPlugin.getStatus();
        return status;
    } catch (error) {
        return null;
    }
};

/**
 * 跳转到指定位置
 * @param position - 位置（毫秒）
 */
export const seekExoPlayerTo = async (position: number): Promise<void> => {
    if (!isAndroidNative()) return;
    
    try {
        await ExoPlayerPlugin.seekTo({ position });
    } catch (error) {
    }
};
