/**
 * ExoPlayer 调性检测适配器
 * 将 Android MediaStore 的 Content URI 转换为可调性检测的格式
 */

import { isAndroidNative } from './platform-detector.js';
import { MediaStore } from './mediastore-plugin.js';
import { simpleKeyDetector, type KeyDetectionResult } from './simple-key-detector.js';

/**
 * 从 Android Content URI 检测调性
 * @param contentUri - Android Content URI (如 content://media/external/audio/media/8349)
 * @param fileName - 文件名（用于创建 File 对象）
 * @param startTime - 开始检测时间（秒），默认从当前位置开始
 */
export async function detectKeyFromContentUri(
    contentUri: string,
    fileName: string,
    startTime: number = 0
): Promise<KeyDetectionResult> {
    if (!isAndroidNative()) {
        throw new Error('detectKeyFromContentUri can only be used in Android native mode');
    }

    try {
        // 1. 从 MediaStore 读取音频文件为 Base64
        const result = await MediaStore.readFileAsBase64({ uri: contentUri });
        
        // 2. 将 Base64 转换为 Blob
        const binaryString = atob(result.base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: 'audio/mpeg' });
        
        // 3. 创建 File 对象
        const file = new File([blob], fileName, { type: 'audio/mpeg' });
        
        // 4. 使用现有的调性检测器
        const keyResult = await simpleKeyDetector.detectKeyFromFile(file, startTime);
        
        return keyResult;
    } catch (error) {
        throw error;
    }
}

/**
 * 获取当前播放曲目的调性（Android 模式）
 */
export async function detectCurrentTrackKey(): Promise<KeyDetectionResult | null> {
    if (!isAndroidNative()) {
        return null;
    }

    try {
        // 从全局变量获取当前曲目信息
        const msTracks = (window as any).__msTracks;
        const msCurrentIndex = (window as any).__msCurrentIndex;
        
        if (!msTracks || msCurrentIndex === undefined || msCurrentIndex < 0) {
            return null;
        }

        const currentTrack = msTracks[msCurrentIndex];
        
        if (!currentTrack?.filePath || !currentTrack?.fileName) {
            return null;
        }

        // 获取当前播放时间（从 ExoPlayer 状态）
        const exoStatus = (window as any).__exoPlayerStatus;
        const currentTime = exoStatus ? exoStatus.currentTime / 1000 : 0;

        // 执行调性检测
        const result = await detectKeyFromContentUri(
            currentTrack.filePath,
            currentTrack.fileName,
            currentTime
        );

        return result;
    } catch (error) {
        return null;
    }
}
