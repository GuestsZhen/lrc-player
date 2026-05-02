/**
 * 文件处理工具函数
 * 处理文件选择、音频文件过滤和 LRC 匹配
 */

export interface AudioTrackWithLrc {
    file: File;
    lrcFile?: File;
}

/**
 * 检查文件是否为音频文件
 */
export const isAudioFile = (file: File): boolean => {
    return file.type.startsWith('audio/') || 
           ['.ncm', '.qmcflac', '.qmc0', '.qmc1', '.qmc2', '.qmc3', '.qmcogg'].some(ext => 
               file.name.toLowerCase().endsWith(ext)
           );
};

/**
 * 检查文件是否为 LRC 歌词文件
 */
export const isLrcFile = (file: File): boolean => {
    return file.name.toLowerCase().endsWith('.lrc');
};

/**
 * 为音频文件匹配对应的 LRC 文件
 */
export const matchLrcFiles = (audioFiles: File[], lrcFiles: File[]): AudioTrackWithLrc[] => {
    return audioFiles.map(file => {
        const baseName = file.name.substring(0, file.name.lastIndexOf('.'));
        let matchedLrc: File | undefined;
        
        for (const lrcFile of lrcFiles) {
            const lrcBaseName = lrcFile.name.substring(0, lrcFile.name.lastIndexOf('.'));
            if (lrcBaseName === baseName) {
                matchedLrc = lrcFile;
                break;
            }
        }
        
        return { file, lrcFile: matchedLrc };
    });
};

/**
 * 处理文件选择事件
 * @param files 选择的文件列表
 * @param onFilesSelected 文件选择回调
 * @param onAddToPlaylist 添加到播放列表回调
 */
export const handleFileSelection = (
    files: FileList | null,
    onFilesSelected?: (fileNames: string[]) => void,
    onAddToPlaylist?: (tracks: AudioTrackWithLrc[]) => void
) => {
    if (!files || files.length === 0) {
        return;
    }
    
    const allFiles = Array.from(files);
    const fileNames = allFiles.map(f => f.name);
    
    // 通知文件选择
    if (onFilesSelected) {
        window.dispatchEvent(new CustomEvent('files-selected', {
            detail: { fileNames }
        }));
    }
    
    // 过滤音频文件和 LRC 文件
    const audioFiles = allFiles.filter(isAudioFile);
    const lrcFiles = allFiles.filter(isLrcFile);
    
    // 匹配 LRC 文件并通知添加到播放列表
    if (audioFiles.length > 0 && onAddToPlaylist) {
        const tracks = matchLrcFiles(audioFiles, lrcFiles);
        window.dispatchEvent(new CustomEvent('add-files-to-playlist', {
            detail: { tracks }
        }));
    }
};

/**
 * 触发文件选择对话框
 */
export const triggerFileSelection = (
    multiple: boolean = true,
    onFilesSelected?: (fileNames: string[]) => void,
    onAddToPlaylist?: (tracks: AudioTrackWithLrc[]) => void
) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = multiple;
    
    input.onchange = (e) => {
        const files = (e.target as HTMLInputElement).files;
        handleFileSelection(files, onFilesSelected, onAddToPlaylist);
    };
    
    input.click();
};
