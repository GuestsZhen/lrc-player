import { MediaStore, type AudioTrack } from './mediastore-plugin.js';

export class AudioFileAdapter {
  /**
   * 从 MediaStore 加载音频文件列表
   */
  static async loadAudioFiles(folder?: string): Promise<AudioTrack[]> {
    try {
      let result;
      
      if (folder) {
        // ✅ 使用 getTracksInFolder 扫描指定文件夹
        result = await MediaStore.getTracksInFolder({ folderPath: folder });
      } else {
        // 扫描所有音频文件
        result = await MediaStore.scanAudioFiles();
      }
      
      // ✅ 为每个音频文件查找对应的 LRC 歌词文件
      const tracksWithLrc = await Promise.all(
        result.tracks.map(async (track) => {
          try {
            const audioPath = track.path || track.filePath;
            
            // 使用 track.path（真实文件路径）来查找 LRC
            const lrcResult = await MediaStore.findLrcFile({ 
              audioPath: audioPath
            });
            
            if (lrcResult.lrcPath) {
              return { ...track, lrcPath: lrcResult.lrcPath };
            }
          } catch (error) {
            // LRC 查找失败，返回原始 track
          }
          
          return track;
        })
      );
      
      return tracksWithLrc;
    } catch (error) {
      // 加载音频文件失败处理
      return [];
    }
  }
  
  /**
   * 将 Content URI 转换为 File 对象（用于 Web Audio API）
   */
  static async uriToFile(uri: string, customFileName?: string): Promise<File> {
    try {
      // 使用原生插件读取文件为 Base64
      const result = await MediaStore.readFileAsBase64({ uri });
      
      // 将 Base64 转换为 Blob
      const binaryString = atob(result.base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const blob = new Blob([bytes], { type: 'audio/mpeg' });
      
      // ✅ 修复：优先使用自定义文件名，否则从 URI 提取
      const fileName = customFileName || uri.split('/').pop() || 'audio.mp3';
      
      return new File([blob], fileName, { type: 'audio/mpeg' });
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * 刷新媒体库
   */
  static async refreshLibrary(folder?: string): Promise<boolean> {
    try {
      const result = await MediaStore.refreshLibrary({ folder });
      return result.success;
    } catch (error) {
      return false;
    }
  }
}
