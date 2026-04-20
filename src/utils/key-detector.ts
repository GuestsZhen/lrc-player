/**
 * 音频调性检测工具
 * 使用 Essentia.js 进行浏览器端实时音频分析
 */

// 动态导入 Essentia.js
let EssentiaModule: any = null;
let EssentiaWASM: any = null;
let EssentiaExtractor: any = null;

async function loadEssentia() {
    if (!EssentiaModule) {
        try {
            const module = await import('essentia.js');
            
            // essentia.js 导出的是 { Essentia, EssentiaWASM, ... }
            EssentiaModule = module.Essentia;
            EssentiaWASM = module.EssentiaWASM;
            EssentiaExtractor = module.EssentiaExtractor;
        } catch (error) {
            throw error;
        }
    }
    return { EssentiaModule, EssentiaWASM, EssentiaExtractor };
}

export interface KeyDetectionResult {
    key: string;        // 调性名称 (如 "C", "D#", "F")
    scale: string;      // 调式 ("major" 或 "minor")
    strength: number;   // 检测强度 (0-1)
    fullKey: string;    // 完整调性 (如 "C major", "A minor")
}

export interface AudioAnalysisOptions {
    sampleRate?: number;
    analysisDuration?: number;  // 分析时长（秒），默认分析前 30 秒
}

class KeyDetector {
    private essentia: any = null;
    private extractor: any = null;
    private isInitialized: boolean = false;

    /**
     * 初始化 Essentia
     */
    async initialize(): Promise<void> {
        if (this.isInitialized) {
            return;
        }

        try {
            const { EssentiaModule, EssentiaWASM, EssentiaExtractor } = await loadEssentia();
            
            // EssentiaWASM.EssentiaWASM 已经是初始化好的 WASM 实例
            const wasmInstance = EssentiaWASM?.EssentiaWASM;
            
            if (!wasmInstance || typeof wasmInstance !== 'object') {
                throw new Error('Cannot find valid WASM instance');
            }
            
            // 直接使用 WASM 实例创建 Essentia
            this.essentia = new EssentiaModule(wasmInstance);
            
            // 如果有 EssentiaExtractor，也初始化它
            if (EssentiaExtractor) {
                try {
                    this.extractor = new EssentiaExtractor(wasmInstance);
                } catch (e) {
                    // Extractor 初始化失败不影响主功能
                }
            }
            
            this.isInitialized = true;
        } catch (error) {
            throw error;
        }
    }

    /**
     * 从 AudioBuffer 检测调性
     * @param audioBuffer Web Audio API 的 AudioBuffer 对象
     * @param options 分析选项
     */
    async detectKeyFromBuffer(
        audioBuffer: AudioBuffer,
        options: AudioAnalysisOptions = {}
    ): Promise<KeyDetectionResult> {
        await this.ensureInitialized();

        const { analysisDuration = 10 } = options;  // 默认只分析前10秒，减少内存占用

        try {
            // 获取音频数据（单声道）
            const channelData = audioBuffer.getChannelData(0);
            const sampleRate = audioBuffer.sampleRate;

            // 如果音频太长，只分析前面部分以提高性能
            const maxSamples = Math.min(
                channelData.length,
                sampleRate * analysisDuration
            );
            
            // 限制最大采样数，避免内存溢出（最多分析60秒）
            const safeMaxSamples = Math.min(maxSamples, sampleRate * 60);
            const samples = channelData.slice(0, safeMaxSamples);

            // 使用 Essentia 的 Key 提取器
            
            // Essentia.js 的正确用法：直接调用算法，传入参数
            // 需要将 Float32Array 转换为 Essentia 能识别的格式
            
            // 尝试使用 EssentiaExtractor 或直接调用 Key 算法
            let result;
            
            // 优先使用 EssentiaExtractor（如果已初始化）
            if (this.extractor && typeof this.extractor.key === 'function') {
                try {
                    result = await this.extractor.key(samples, sampleRate);
                } catch (e) {
                    throw e;
                }
            } else {
                // 回退到直接调用 Key 算法
                if (typeof this.essentia.Key === 'function') {
                    // 使用 arrayToVector 转换数据
                    const vectorSamples = this.essentia.arrayToVector(samples);
                    result = this.essentia.Key(vectorSamples, sampleRate);
                    
                    // 释放 VectorFloat 内存
                    if (vectorSamples && typeof vectorSamples.delete === 'function') {
                        vectorSamples.delete();
                    }
                } else if (typeof this.essentia.KeyExtractor === 'function') {
                    // 方法2: 使用 KeyExtractor
                    result = this.essentia.KeyExtractor(samples, sampleRate);
                } else {
                    throw new Error('No key detection algorithm available in Essentia');
                }
            }

            // 解析结果
            const key = result.key;
            const scale = result.scale;
            const strength = result.strength;

            // ✅ 如果检测到小调，转换为关系大调显示
            let displayKey = key;
            let displayScale = scale;
            
            if (scale === 'minor') {
                // 小调的关系大调 = 小调主音 + 3 个半音
                const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
                const minorIndex = NOTE_NAMES.indexOf(key);
                if (minorIndex !== -1) {
                    const relativeMajorIndex = (minorIndex + 3) % 12;
                    displayKey = NOTE_NAMES[relativeMajorIndex];
                    displayScale = 'major';
                }
            }

            // 格式化输出
            const fullKey = `${displayKey} ${displayScale === 'major' ? '大调' : '小调'}`;

            return {
                key,
                scale,
                strength,
                fullKey
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * 从 File 对象检测调性
     * @param file 音频文件
     * @param options 分析选项
     */
    async detectKeyFromFile(
        file: File,
        options: AudioAnalysisOptions = {}
    ): Promise<KeyDetectionResult> {
        await this.ensureInitialized();

        try {
            // 将文件转换为 AudioBuffer
            const audioBuffer = await this.fileToAudioBuffer(file);
            return await this.detectKeyFromBuffer(audioBuffer, options);
        } catch (error) {
            throw error;
        }
    }

    /**
     * 从 URL 检测调性
     * @param url 音频文件 URL
     * @param options 分析选项
     */
    async detectKeyFromUrl(
        url: string,
        options: AudioAnalysisOptions = {}
    ): Promise<KeyDetectionResult> {
        await this.ensureInitialized();

        try {
            const audioBuffer = await this.urlToAudioBuffer(url);
            return await this.detectKeyFromBuffer(audioBuffer, options);
        } catch (error) {
            throw error;
        }
    }

    /**
     * 实时流式分析（高级功能）
     * 适用于边播放边分析的场景
     */
    async detectKeyStreaming(
        audioContext: AudioContext,
        sourceNode: AudioNode,
        duration: number = 10
    ): Promise<KeyDetectionResult> {
        await this.ensureInitialized();

        return new Promise((resolve, reject) => {
            try {
                // 创建 ScriptProcessor 节点用于捕获音频流
                const bufferSize = 4096;
                const processor = audioContext.createScriptProcessor(
                    bufferSize,
                    1,
                    1
                );

                const samples: Float32Array[] = [];
                let processedTime = 0;

                processor.onaudioprocess = (event) => {
                    const input = event.inputBuffer.getChannelData(0);
                    samples.push(new Float32Array(input));
                    processedTime += bufferSize / audioContext.sampleRate;

                    // 收集足够的数据后进行分析
                    if (processedTime >= duration) {
                        processor.disconnect();

                        // 合并所有样本
                        const totalLength = samples.reduce(
                            (sum, arr) => sum + arr.length,
                            0
                        );
                        const merged = new Float32Array(totalLength);
                        let offset = 0;
                        samples.forEach((arr) => {
                            merged.set(arr, offset);
                            offset += arr.length;
                        });

                        // 执行调性检测
                        const keyExtractor = this.essentia.KeyExtractor();
                        const result = keyExtractor({
                            audio: merged,
                            sampleRate: audioContext.sampleRate
                        });

                        resolve({
                            key: result.key,
                            scale: result.scale,
                            strength: result.strength,
                            fullKey: `${result.key} ${result.scale === 'major' ? '大调' : '小调'}`
                        });
                    }
                };

                sourceNode.connect(processor);
                processor.connect(audioContext.destination);
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * 销毁实例，释放资源
     */
    destroy(): void {
        if (this.essentia) {
            this.essentia.delete();
            this.essentia = null;
            this.isInitialized = false;
        }
    }

    /**
     * 确保已初始化
     */
    private async ensureInitialized(): Promise<void> {
        if (!this.isInitialized) {
            await this.initialize();
        }
    }

    /**
     * 将 File 转换为 AudioBuffer
     */
    private async fileToAudioBuffer(file: File): Promise<AudioBuffer> {
        const arrayBuffer = await file.arrayBuffer();
        const audioContext = new AudioContext();
        return await audioContext.decodeAudioData(arrayBuffer);
    }

    /**
     * 将 URL 转换为 AudioBuffer
     */
    private async urlToAudioBuffer(url: string): Promise<AudioBuffer> {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const audioContext = new AudioContext();
        return await audioContext.decodeAudioData(arrayBuffer);
    }
}

// 导出单例实例
export const keyDetector = new KeyDetector();

// 导出类以便需要时创建多个实例
export default KeyDetector;
