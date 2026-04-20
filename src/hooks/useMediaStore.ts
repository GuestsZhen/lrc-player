/**
 * MediaStore 集成 Hook
 * 封装 Android MediaStore 文件读取逻辑，消除重复代码
 */
import { useCallback } from 'react';
import { MediaStore, type AudioTrack } from '../utils/mediastore-plugin.js';

interface UseMediaStoreReturn {
    readAudioFile: (track: AudioTrack) => Promise<File>;
    readLrcFile: (track: AudioTrack) => Promise<File | undefined>;
    decodeBase64ToBlob: (base64: string, mimeType?: string) => Blob;
}

export function useMediaStore(): UseMediaStoreReturn {
    /**
     * 统一的 Base64 解码逻辑
     */
    const decodeBase64ToBlob = useCallback((base64: string, mimeType: string = 'audio/mpeg'): Blob => {
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return new Blob([bytes], { type: mimeType });
    }, []);

    /**
     * 读取音频文件
     */
    const readAudioFile = useCallback(async (track: AudioTrack): Promise<File> => {
        const audioResult = await MediaStore.readFileAsBase64({ 
            uri: track.filePath 
        });
        
        const blob = decodeBase64ToBlob(audioResult.base64, 'audio/mpeg');
        return new File([blob], track.fileName, { type: 'audio/mpeg' });
    }, [decodeBase64ToBlob]);

    /**
     * 读取 LRC 歌词文件
     */
    const readLrcFile = useCallback(async (track: AudioTrack): Promise<File | undefined> => {
        if (!track.lrcPath) {
            return undefined;
        }

        try {
            const lrcResult = await MediaStore.readFileAsBase64({ 
                uri: track.lrcPath 
            });
            
            // 解码为文本
            const lrcBinaryString = atob(lrcResult.base64);
            const lrcBytes = new Uint8Array(lrcBinaryString.length);
            for (let i = 0; i < lrcBinaryString.length; i++) {
                lrcBytes[i] = lrcBinaryString.charCodeAt(i);
            }
            
            const lrcText = new TextDecoder('utf-8').decode(lrcBytes);
            const lrcFileName = track.fileName.replace(/\.[^.]+$/, '.lrc');
            const lrcBlob = new Blob([lrcText], { type: 'text/plain' });
            
            return new File([lrcBlob], lrcFileName, { type: 'text/plain' });
        } catch (error) {
            // LRC 文件读取失败，返回 undefined
            return undefined;
        }
    }, []);

    return { 
        readAudioFile, 
        readLrcFile,
        decodeBase64ToBlob 
    };
}
