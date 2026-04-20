import { registerPlugin } from '@capacitor/core';

export interface AudioTrack {
  id: string;
  name: string;
  fileName: string;
  filePath: string;
  path: string;
  size?: number;
  duration?: number;
  artist?: string;
  album?: string;
  lrcPath?: string; // LRC 歌词文件路径
}

export interface MediaStorePlugin {
  // 扫描所有音频文件
  scanAudioFiles(): Promise<{
    tracks: AudioTrack[];
    count: number;
  }>;
  
  // 获取指定文件夹下的歌曲
  getTracksInFolder(options: { folderPath: string }): Promise<{
    tracks: AudioTrack[];
    count: number;
  }>;
  
  // 获取音频文件的实际路径
  getAudioFilePath(options: { contentUri: string }): Promise<{
    filePath: string;
  }>;
  
  // 查找歌词文件
  findLrcFile(options: { audioPath: string }): Promise<{
    lrcPath?: string;
  }>;
  
  // 读取音频文件为 Base64（用于 Web Audio API）
  readFileAsBase64(options: { uri: string }): Promise<{
    base64: string;
  }>;
  
  // 刷新媒体库（触发媒体扫描）
  refreshLibrary(options?: { folder?: string }): Promise<{
    success: boolean;
    message?: string;
  }>;
}

const MediaStore = registerPlugin<MediaStorePlugin>('MediaStore');

export { MediaStore };
