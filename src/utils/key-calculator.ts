/**
 * 调性计算工具函数
 * 根据检测到的调和半音偏移计算当前调
 */

export interface KeyCalculationResult {
    currentKey: string;
    semitones: number;
}

/**
 * 根据基础调和半音偏移计算当前调
 * @param baseKey 基础调（如 "C Major"）
 * @param semitones 半音偏移量
 * @returns 当前调名称
 */
export const calculateCurrentKey = (baseKey: string, semitones: number): string => {
    if (!baseKey) {
        return semitones === 0 ? '原调' : (semitones > 0 ? `+${semitones}` : semitones.toString());
    }
    
    const baseKeyName = baseKey.split(' ')[0];
    const keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const baseIndex = keys.indexOf(baseKeyName);
    
    if (baseIndex === -1) {
        return `${baseKeyName}${semitones > 0 ? '+' : ''}${semitones}`;
    }
    
    const newIndex = (baseIndex + semitones + 12) % 12;
    return keys[newIndex];
};

/**
 * 获取显示用的调性文本
 * @param detectedKey 检测到的调
 * @param semitones 半音偏移
 * @returns 显示的调性文本
 */
export const getDisplayKey = (detectedKey: string, semitones: number): string => {
    if (!detectedKey) {
        return semitones === 0 ? '原调' : (semitones > 0 ? `+${semitones}` : semitones.toString());
    }
    
    return calculateCurrentKey(detectedKey, semitones);
};
