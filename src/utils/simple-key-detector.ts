/**
 * 轻量级音频调性检测工具
 * 基于色度特征（Chroma Features）和 Krumhansl-Schmiedler 键配置文件
 */

export interface KeyDetectionResult {
    key: string;        // 调性名称 (如 "C", "D#", "F")
    scale: string;      // 调式 ("major" 或 "minor")
    confidence: number; // 置信度 (0-1)
    fullKey: string;    // 完整调性 (如 "C major", "A minor")
}

// Krumhansl-Schmiedler 键配置文件（大调和小调）
const MAJOR_PROFILE = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
const MINOR_PROFILE = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];

// 音名
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

class SimpleKeyDetector {
    /**
     * 从 AudioBuffer 检测调性
     * @param audioBuffer 音频缓冲区
     * @param startTime 开始时间（秒），默认为 0（文件开头）
     */
    async detectKeyFromBuffer(audioBuffer: AudioBuffer, startTime: number = 0): Promise<KeyDetectionResult> {
        try {
            // 获取音频数据
            const channelData = audioBuffer.getChannelData(0);
            const sampleRate = audioBuffer.sampleRate;
            
            // 计算起始采样点
            const startSample = Math.floor(startTime * sampleRate);
            
            // 验证起始位置是否有效
            if (startSample >= channelData.length) {
                throw new Error(`起始时间 ${startTime}s 超出音频长度`);
            }
            
            // 分析从起始时间点开始的 30 秒
            const maxSamples = Math.min(channelData.length - startSample, sampleRate * 30);
            const samples = channelData.slice(startSample, startSample + maxSamples);
            
            // 计算色度特征
            const chroma = this.computeChroma(samples, sampleRate);
            
            // 使用 Krumhansl-Schmiedler 算法匹配键
            const result = this.matchKey(chroma);
            
            return result;
        } catch (error) {
            console.error('[SimpleKeyDetector] Detection failed:', error);
            throw error;
        }
    }
    
    /**
     * 从 File 对象检测调性
     * @param file 音频文件
     * @param startTime 开始时间（秒），默认为 0（文件开头）
     */
    async detectKeyFromFile(file: File, startTime: number = 0): Promise<KeyDetectionResult> {
        // 将文件转换为 AudioBuffer
        const audioBuffer = await this.fileToAudioBuffer(file);
        return await this.detectKeyFromBuffer(audioBuffer, startTime);
    }
    
    /**
     * 将 File 转换为 AudioBuffer
     */
    private async fileToAudioBuffer(file: File): Promise<AudioBuffer> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const arrayBuffer = e.target?.result as ArrayBuffer;
                    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
                    resolve(audioBuffer);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    }
    
    /**
     * 计算色度特征（简化版）
     * 使用 FFT 提取频率信息并映射到 12 个半音
     */
    private computeChroma(samples: Float32Array, sampleRate: number): number[] {
        const chroma = Array.from({ length: 12 }, () => 0);
        
        // 简化：使用时域过零率和能量分布来估计色度
        // 这是一个简化的启发式方法
        
        const frameSize = 4096;  // 增加帧大小以提高频率分辨率
        const hopSize = 2048;    // 增加跳步
        const numFrames = Math.floor((samples.length - frameSize) / hopSize);
        
        // 增加处理的帧数上限到 500 帧（约 17 秒@48kHz）
        const maxFrames = Math.min(numFrames, 500);
        
        for (let i = 0; i < maxFrames; i++) {
            const start = i * hopSize;
            const frame = samples.slice(start, start + frameSize);
            
            // 简化的频谱分析（实际应该使用 FFT）
            // 这里使用一个简化的方法来估计主要频率
            const energy = this.calculateFrameEnergy(frame);
            
            if (energy > 0.005) { // 降低阈值以捕捉更多音符
                // 简化的音高估计
                const pitchClass = this.estimatePitchClass(frame, sampleRate);
                if (pitchClass >= 0 && pitchClass < 12) {
                    chroma[pitchClass] += energy;
                }
            }
        }
        
        // 归一化
        const max = Math.max(...chroma);
        if (max > 0) {
            for (let i = 0; i < 12; i++) {
                chroma[i] /= max;
            }
        }
        
        return chroma;
    }
    
    /**
     * 计算帧能量
     */
    private calculateFrameEnergy(frame: Float32Array): number {
        let energy = 0;
        for (let i = 0; i < frame.length; i++) {
            energy += frame[i] * frame[i];
        }
        return energy / frame.length;
    }
    
    /**
     * 估计音高类别（简化版）
     * 使用时域自相关方法
     */
    private estimatePitchClass(frame: Float32Array, sampleRate: number): number {
        // 简化的自相关方法
        const maxLag = Math.floor(sampleRate / 50); // 最低 50Hz
        let bestLag = 0;
        let bestCorr = 0;
        
        for (let lag = Math.floor(sampleRate / 1000); lag < maxLag; lag++) { // 最高 1000Hz
            let corr = 0;
            for (let i = 0; i < frame.length - lag; i++) {
                corr += frame[i] * frame[i + lag];
            }
            
            if (corr > bestCorr) {
                bestCorr = corr;
                bestLag = lag;
            }
        }
        
        if (bestLag === 0) return -1;
        
        // 将频率转换为 MIDI 音符
        const frequency = sampleRate / bestLag;
        const midiNote = 12 * Math.log2(frequency / 440) + 69;
        const pitchClass = Math.round(midiNote) % 12;
        
        return pitchClass;
    }
    
    /**
     * 使用 Krumhansl-Schmiedler 算法匹配键
     */
    private matchKey(chroma: number[]): KeyDetectionResult {
        let bestScore = -Infinity;
        let bestKey = 0;
        let bestScale = 'major';
        
        // 尝试所有 12 个大调和 12 个小调
        for (let key = 0; key < 12; key++) {
            // 大调
            const majorScore = this.correlation(chroma, this.rotateProfile(MAJOR_PROFILE, key));
            if (majorScore > bestScore) {
                bestScore = majorScore;
                bestKey = key;
                bestScale = 'major';
            }
            
            // 小调
            const minorScore = this.correlation(chroma, this.rotateProfile(MINOR_PROFILE, key));
            if (minorScore > bestScore) {
                bestScore = minorScore;
                bestKey = key;
                bestScale = 'minor';
            }
        }
        
        const keyName = NOTE_NAMES[bestKey];
        const scaleName = bestScale === 'major' ? '大调' : '小调';
        const fullKey = `${keyName} ${scaleName}`;
        
        // 计算置信度（简化）
        const confidence = Math.min(1, Math.max(0, (bestScore + 1) / 2));
        
        return {
            key: keyName,
            scale: bestScale,
            confidence,
            fullKey
        };
    }
    
    /**
     * 计算两个向量的皮尔逊相关系数
     */
    private correlation(a: number[], b: number[]): number {
        const n = a.length;
        let sumA = 0, sumB = 0, sumAB = 0, sumA2 = 0, sumB2 = 0;
        
        for (let i = 0; i < n; i++) {
            sumA += a[i];
            sumB += b[i];
            sumAB += a[i] * b[i];
            sumA2 += a[i] * a[i];
            sumB2 += b[i] * b[i];
        }
        
        const numerator = n * sumAB - sumA * sumB;
        const denominator = Math.sqrt((n * sumA2 - sumA * sumA) * (n * sumB2 - sumB * sumB));
        
        return denominator === 0 ? 0 : numerator / denominator;
    }
    
    /**
     * 旋转配置文件
     */
    private rotateProfile(profile: number[], shift: number): number[] {
        const rotated = Array.from({ length: 12 }, () => 0);
        for (let i = 0; i < 12; i++) {
            rotated[i] = profile[(i - shift + 12) % 12];
        }
        return rotated;
    }
}

export const simpleKeyDetector = new SimpleKeyDetector();
