/**
 * 文件处理工具函数
 */

/**
 * 从文件名获取基础名称(不含扩展名)
 * @param fileName - 完整文件名
 * @returns 不含扩展名的文件名
 */
export const getBaseName = (fileName: string): string => {
    return fileName.replace(/\.[^.]+$/, '');
};

/**
 * 查找同名的 LRC 歌词文件
 * @param audioFileName - 音频文件名
 * @param files - 文件列表
 * @returns 匹配的 LRC 文件,未找到返回 null
 */
export const findMatchingLrcFile = (audioFileName: string, files: FileList | File[]): File | null => {
    const audioBaseName = getBaseName(audioFileName).toLowerCase();
    
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.name.toLowerCase().endsWith('.lrc')) {
            const lrcBaseName = getBaseName(file.name).toLowerCase();
            if (lrcBaseName === audioBaseName) {
                return file;
            }
        }
    }
    
    return null;
};
