/**
 * Web Audio API 音频管理器（SoundTouchJS 版本）
 * 使用 AudioBuffer 替代 HTMLAudioElement，支持音高和速度调节
 */

import { PitchShifter } from 'soundtouchjs';
import { audioStatePubSub, AudioActionType } from './audiomodule.js';

export interface WebAudioConfig {
    audioFile: File | Blob;
    initialPitch?: number; // 初始音高（半音）
    initialSpeed?: number; // 初始速度倍率
}

export class WebAudioPlayer {
    private audioContext: AudioContext | null = null;
    private audioBuffer: AudioBuffer | null = null;
    private sourceNode: AudioBufferSourceNode | null = null;
    private pitchShifter: PitchShifter | null = null;
    private gainNode: GainNode | null = null;
    
    // Vocal Removal 相关节点
    private vocalRemovalSplitter: ChannelSplitterNode | null = null;
    private vocalRemovalMerger: ChannelMergerNode | null = null;
    private vocalRemovalInverterL: GainNode | null = null;  // 左声道反相
    private vocalRemovalInverterR: GainNode | null = null;  // 右声道反相
    private vocalRemovalCopyL: GainNode | null = null;      // 左声道复制
    private vocalRemovalCopyR: GainNode | null = null;      // 右声道复制
    private isVocalRemovalEnabled: boolean = false;
    
    private isPlaying: boolean = false;
    private startTime: number = 0;
    private pauseOffset: number = 0;
    private duration: number = 0;
    
    private currentPitch: number = 0;
    private currentSpeed: number = 1.0;
    
    private currentSrc: string = '';
    
    private onTimeUpdate: ((time: number) => void) | null = null;
    private onEnded: (() => void) | null = null;
    private timeUpdateInterval: number | null = null;

    /**
     * 初始化音频播放器
     */
    async init(config: WebAudioConfig): Promise<void> {
        try {
            if (this.isPlaying || this.pitchShifter) {
                this.stop();
            }
            
            if (this.audioContext && this.audioContext.state !== 'closed') {
                await this.audioContext.close();
            }
            
            if (this.pitchShifter) {
                try {
                    this.pitchShifter.off();
                    this.pitchShifter.disconnect();
                } catch {
                }
                this.pitchShifter = null;
            }
            
            if (this.sourceNode) {
                try {
                    this.sourceNode.disconnect();
                } catch {
                }
                this.sourceNode = null;
            }
            
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            
            const arrayBuffer = await config.audioFile.arrayBuffer();
            this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            this.duration = this.audioBuffer.duration;
            
            this.currentPitch = config.initialPitch || 0;
            this.currentSpeed = config.initialSpeed || 1.0;
            
            if (config.audioFile instanceof File) {
                this.currentSrc = URL.createObjectURL(config.audioFile);
            } else {
                this.currentSrc = 'blob:webaudio';
            }
            
            this.pauseOffset = 0;
            
            this.gainNode = this.audioContext.createGain();
            this.gainNode.connect(this.audioContext.destination);
        } catch (error) {
            throw error;
        }
    }

    /**
     * 创建并连接音频节点链
     */
    private createAudioChain(startOffset: number = 0): void {
        if (!this.audioContext || !this.audioBuffer || !this.gainNode) {
            throw new Error('WebAudioPlayer not initialized');
        }

        if (this.pitchShifter) {
            try {
                this.pitchShifter.off();
                this.pitchShifter.disconnect();
            } catch {
            }
            this.pitchShifter = null;
        }
        
        // 清理 Vocal Removal 节点（如果存在）
        if (this.vocalRemovalSplitter) {
            this.vocalRemovalSplitter.disconnect();
            this.vocalRemovalSplitter = null;
        }
        if (this.vocalRemovalMerger) {
            this.vocalRemovalMerger.disconnect();
            this.vocalRemovalMerger = null;
        }
        if (this.vocalRemovalInverterL) {
            this.vocalRemovalInverterL.disconnect();
            this.vocalRemovalInverterL = null;
        }
        if (this.vocalRemovalInverterR) {
            this.vocalRemovalInverterR.disconnect();
            this.vocalRemovalInverterR = null;
        }
        if (this.vocalRemovalCopyL) {
            this.vocalRemovalCopyL.disconnect();
            this.vocalRemovalCopyL = null;
        }
        if (this.vocalRemovalCopyR) {
            this.vocalRemovalCopyR.disconnect();
            this.vocalRemovalCopyR = null;
        }
        
        // 断开 gainNode 的所有现有连接
        this.gainNode.disconnect();
        
        // 确定最终输出节点
        let finalOutputNode: AudioNode;
        
        // 如果启用了 Vocal Removal，创建 Vocal Removal 链并连接到 destination
        if (this.isVocalRemovalEnabled) {
            const vocalRemovalOutput = this.createVocalRemovalChain(this.gainNode);
            vocalRemovalOutput.connect(this.audioContext.destination);  // 连接到扬声器
            finalOutputNode = this.gainNode;  // 音源连接到 gainNode
        } else {
            // 不启用 Vocal Removal，gainNode 直接连接到 destination
            this.gainNode.connect(this.audioContext.destination);
            finalOutputNode = this.gainNode;
        }
        
        // ✅ 关键修复：根据是否需要音高/速度调节来选择音频处理方式
        const needPitchShift = Math.abs(this.currentPitch) > 0.01 || Math.abs(this.currentSpeed - 1.0) > 0.01;
        
        if (needPitchShift) {
            // 需要音高/速度调节：使用 PitchShifter
            this.sourceNode = this.audioContext.createBufferSource();
            this.sourceNode.buffer = this.audioBuffer;
            
            this.pitchShifter = new PitchShifter(
                this.audioContext,
                this.audioBuffer,
                2048
            );
            
            this.pitchShifter.pitchSemitones = this.currentPitch;
            this.pitchShifter.tempo = this.currentSpeed;
            
            // 连接节点链（SoundTouchJS 会在连接后自动开始处理）
            this.pitchShifter.connect(finalOutputNode);
        } else {
            // 不需要音高/速度调节：使用原生 AudioBufferSourceNode（支持 seek）
            this.pitchShifter = null;
            this.sourceNode = this.audioContext.createBufferSource();
            this.sourceNode.buffer = this.audioBuffer;
            this.sourceNode.connect(finalOutputNode);
            
            // ✅ 关键：原生节点支持从指定位置开始播放
            this.sourceNode.start(0, startOffset);
        }
    }

    /**
     * 播放音频
     */
    play(fromTime?: number): void {
        if (!this.audioContext || !this.audioBuffer) {
            return;
        }

        // ✅ 关键修复：如果是从 PitchShifter 暂停状态恢复，只需恢复音量
        if (this.isPlaying && this.pitchShifter && this.gainNode) {
            // 已经在播放，无需操作
            return;
        }
        
        // 检查是否是从 PitchShifter 暂停状态恢复（pitchShifter 还存在，但被静音了）
        const isResumingFromPitchShifterPause = this.pitchShifter !== null && this.sourceNode !== null;
        
        if (isResumingFromPitchShifterPause) {
            // ✅ 从 PitchShifter 暂停恢复：只需恢复音量
            this.gainNode!.gain.setValueAtTime(1, this.audioContext.currentTime);
            
            // 更新 startTime 以反映暂停期间的时间流逝
            this.startTime = this.audioContext.currentTime - (this.pauseOffset / this.currentSpeed);
            
            this.isPlaying = true;
            
            // 发布播放状态
            audioStatePubSub.pub({ type: AudioActionType.pause, payload: false });
            
            // 启动时间更新定时器
            this.startTimeUpdateTimer();
            
            return;
        }

        // 如果已经在播放，先停止
        if (this.isPlaying) {
            this.stop();
        }

        // 恢复 AudioContext（如果被挂起）
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        // 计算起始时间
        const offset = fromTime !== undefined ? fromTime : this.pauseOffset;
        
        this.createAudioChain(offset);

        // ✅ 关键修复：对于原生节点，startTime 需要考虑 offset
        // getCurrentTime() = (audioContext.currentTime - startTime) * speed
        // 所以 startTime = audioContext.currentTime - (offset / speed)
        this.startTime = this.audioContext.currentTime - (offset / this.currentSpeed);
        this.isPlaying = true;
        
        // 发布播放状态
        audioStatePubSub.pub({ type: AudioActionType.pause, payload: false });
        
        // 启动时间更新定时器
        this.startTimeUpdateTimer();
        
        // 监听播放结束
        if (this.sourceNode) {
            this.sourceNode.onended = () => {
                this.handleEnded();
            };
        }
    }

    /**
     * 暂停播放
     */
    pause(): void {
        if (!this.isPlaying) {
            return;
        }

        // 计算当前播放位置
        if (this.audioContext) {
            const elapsed = this.audioContext.currentTime - this.startTime;
            this.pauseOffset = elapsed * this.currentSpeed;
        }

        // ✅ 关键修复：根据是否使用 PitchShifter 选择不同的暂停策略
        if (this.pitchShifter) {
            // 使用 PitchShifter：通过 GainNode 静音
            if (this.gainNode) {
                this.gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            }
        } else {
            // 使用原生节点：必须停止节点（原生节点不能暂停后恢复）
            if (this.sourceNode) {
                try {
                    this.sourceNode.onended = null;  // 移除回调，防止触发 handleEnded
                    this.sourceNode.stop();
                    this.sourceNode.disconnect();
                } catch {}
                this.sourceNode = null;
            }
        }
        
        // 停止时间更新定时器
        this.stopTimeUpdateTimer();

        this.isPlaying = false;
        
        audioStatePubSub.pub({ type: AudioActionType.pause, payload: true });
    }

    /**
     * 停止播放
     */
    stop(): void {
        if (this.pitchShifter) {
            this.pitchShifter.off();
        }
        
        if (this.sourceNode) {
            try {
                this.sourceNode.disconnect();
            } catch {
            }
            this.sourceNode = null;
        }
        
        this.isPlaying = false;
        this.stopTimeUpdateTimer();
    }

    /**
     * 跳转到指定时间
     */
    seek(time: number): void {
        const wasPlaying = this.isPlaying;
        
        // ✅ 关键修复：检查是否需要切换音频处理方式
        const needPitchShift = Math.abs(this.currentPitch) > 0.01 || Math.abs(this.currentSpeed - 1.0) > 0.01;
        
        if (this.pitchShifter) {
            try {
                this.pitchShifter.off();
                this.pitchShifter.disconnect();
            } catch {}
            this.pitchShifter = null;
        }
        
        if (this.sourceNode) {
            try {
                // ✅ 关键修复：先移除 onended 回调，防止 stop() 触发 handleEnded
                this.sourceNode.onended = null;
                this.sourceNode.stop();
                this.sourceNode.disconnect();
            } catch {}
            this.sourceNode = null;
        }
        
        // ✅ 关键修复：PitchShifter 不支持 seek，只能从头播放
        // 如果需要 PitchShifter，强制从头播放
        let actualStartOffset = time;
        if (needPitchShift) {
            actualStartOffset = 0;
        }
        
        this.pauseOffset = Math.max(0, Math.min(actualStartOffset, this.duration));
        
        // ✅ 关键修复：先将 isPlaying 设为 false，强制 play() 重新创建音频链
        this.isPlaying = false;
        
        // 总是从目标位置开始播放（无论之前是否在播放）
        this.play(this.pauseOffset);
        
        // ✅ 如果从头播放，重置 startTime
        if (actualStartOffset === 0) {
            this.pauseOffset = 0;
            if (this.audioContext) {
                this.startTime = this.audioContext.currentTime;
            }
        }
    }

    /**
     * 设置音高（半音）
     */
    setPitch(semitones: number): void {
        const wasUsingPitchShifter = this.pitchShifter !== null;
        this.currentPitch = semitones;
        
        // 检查是否需要切换音频处理方式
        const needPitchShift = Math.abs(this.currentPitch) > 0.01 || Math.abs(this.currentSpeed - 1.0) > 0.01;
        
        if (needPitchShift && !wasUsingPitchShifter) {
            // 从原生节点切换到 PitchShifter，需要重建音频链
            if (this.isPlaying && this.audioContext) {
                // ✅ 关键修复：不停止定时器，直接重建音频链，从头播放
                // 1. 先断开旧节点
                if (this.sourceNode) {
                    try {
                        this.sourceNode.onended = null;
                        this.sourceNode.disconnect();
                    } catch {}
                    this.sourceNode = null;
                }
                
                // 2. 重新创建音频链，从 0 开始
                this.createAudioChain(0);
                
                // 3. 重置 pauseOffset 和 startTime
                this.pauseOffset = 0;
                this.startTime = this.audioContext.currentTime;
            }
        } else if (!needPitchShift && wasUsingPitchShifter) {
            // 从 PitchShifter 切换到原生节点，需要重建音频链
            if (this.isPlaying && this.audioContext) {
                // ✅ 关键修复：不停止定时器，直接重建音频链，从头播放
                // 1. 先断开旧节点
                if (this.pitchShifter) {
                    try {
                        this.pitchShifter.off();
                        this.pitchShifter.disconnect();
                    } catch {}
                    this.pitchShifter = null;
                }
                
                // 2. 重新创建音频链，从 0 开始
                this.createAudioChain(0);
                
                // 3. 重置 pauseOffset 和 startTime
                this.pauseOffset = 0;
                this.startTime = this.audioContext.currentTime;
            }
        } else if (this.pitchShifter) {
            // 继续使用 PitchShifter，直接更新参数
            this.pitchShifter.pitchSemitones = semitones;
        }
    }

    /**
     * 设置播放速度
     */
    setSpeed(speed: number): void {
        const wasUsingPitchShifter = this.pitchShifter !== null;
        this.currentSpeed = Math.max(0.5, Math.min(2.0, speed));
        
        // 检查是否需要切换音频处理方式
        const needPitchShift = Math.abs(this.currentPitch) > 0.01 || Math.abs(this.currentSpeed - 1.0) > 0.01;
        
        if (needPitchShift && !wasUsingPitchShifter) {
            // 从原生节点切换到 PitchShifter，需要重建音频链
            if (this.isPlaying && this.audioContext) {
                // ✅ 关键修复：不停止定时器，直接重建音频链，从头播放
                // 1. 先断开旧节点
                if (this.sourceNode) {
                    try {
                        this.sourceNode.onended = null;
                        this.sourceNode.disconnect();
                    } catch {}
                    this.sourceNode = null;
                }
                
                // 2. 重新创建音频链，从 0 开始
                this.createAudioChain(0);
                
                // 3. 重置 pauseOffset 和 startTime
                this.pauseOffset = 0;
                this.startTime = this.audioContext.currentTime;
            }
        } else if (!needPitchShift && wasUsingPitchShifter) {
            // 从 PitchShifter 切换到原生节点，需要重建音频链
            if (this.isPlaying && this.audioContext) {
                // ✅ 关键修复：不停止定时器，直接重建音频链，从头播放
                // 1. 先断开旧节点
                if (this.pitchShifter) {
                    try {
                        this.pitchShifter.off();
                        this.pitchShifter.disconnect();
                    } catch {}
                    this.pitchShifter = null;
                }
                
                // 2. 重新创建音频链，从 0 开始
                this.createAudioChain(0);
                
                // 3. 重置 pauseOffset 和 startTime
                this.pauseOffset = 0;
                this.startTime = this.audioContext.currentTime;
            }
        } else if (this.pitchShifter) {
            // 继续使用 PitchShifter，直接更新参数
            this.pitchShifter.tempo = this.currentSpeed;
        }
    }

    /**
     * 获取当前播放时间
     */
    getCurrentTime(): number {
        if (!this.isPlaying || !this.audioContext) {
            return this.pauseOffset;
        }
        
        const elapsed = this.audioContext.currentTime - this.startTime;
        return elapsed * this.currentSpeed;
    }

    /**
     * 获取音频总时长
     */
    getDuration(): number {
        return this.duration;
    }

    /**
     * 检查是否正在播放
     */
    getIsPlaying(): boolean {
        return this.isPlaying;
    }
    isCurrentlyPlaying(): boolean {
        return this.isPlaying;
    }

    getPitch(): number {
        return this.currentPitch;
    }

    getSpeed(): number {
        return this.currentSpeed;
    }

    getSrc(): string {
        return this.currentSrc;
    }

    setTimeUpdateCallback(callback: (time: number) => void): void {
        this.onTimeUpdate = callback;
    }

    setEndedCallback(callback: () => void): void {
        this.onEnded = callback;
    }

    private startTimeUpdateTimer(): void {
        this.stopTimeUpdateTimer();
        
        this.timeUpdateInterval = window.setInterval(() => {
            if (this.onTimeUpdate) {
                const currentTime = this.getCurrentTime();
                this.onTimeUpdate(currentTime);
                
                if (currentTime >= this.duration) {
                    this.handleEnded();
                }
            }
        }, 100);
    }

    private stopTimeUpdateTimer(): void {
        if (this.timeUpdateInterval !== null) {
            clearInterval(this.timeUpdateInterval);
            this.timeUpdateInterval = null;
        }
    }

    private handleEnded(): void {
        this.stop();
        this.pauseOffset = 0;
        
        if (this.onEnded) {
            this.onEnded();
        }
    }

    /**
     * 启用/禁用 Vocal Removal（相位抵消法）
     */
    setVocalRemoval(enabled: boolean): void {
        if (this.isVocalRemovalEnabled === enabled) {
            return; // 状态未改变
        }
        
        this.isVocalRemovalEnabled = enabled;
        
        // ✅ 使用 gainNode 静音过渡，然后重建音频链
        if (this.isPlaying && this.audioContext && this.gainNode) {
            // ✅ 关键修复：PitchShifter 状态下切换去人声会从头播放（已知问题）
            // 所以直接从头播放，确保歌词同步
            const shouldResetToStart = this.pitchShifter !== null;
            const startOffset = shouldResetToStart ? 0 : this.getCurrentTime();
            
            // 1. 快速淡出
            const fadeOutTime = this.audioContext.currentTime;
            this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, fadeOutTime);
            this.gainNode.gain.linearRampToValueAtTime(0, fadeOutTime + 0.05);
            
            // 2. 短暂延迟后停止并重新播放
            setTimeout(() => {
                this.stop();
                
                // 3. 重新创建音频链
                this.play(startOffset);
                
                // 4. 如果从头播放，重置 pauseOffset 和 startTime
                if (shouldResetToStart) {
                    this.pauseOffset = 0;
                    if (this.audioContext) {
                        this.startTime = this.audioContext.currentTime;
                    }
                }
                
                // 5. 淡入恢复音量
                if (this.gainNode && this.audioContext) {
                    const fadeInTime = this.audioContext.currentTime;
                    this.gainNode.gain.setValueAtTime(0, fadeInTime);
                    this.gainNode.gain.linearRampToValueAtTime(1, fadeInTime + 0.05);
                }
            }, 60);
        }
    }
    
    /**
     * 获取 Vocal Removal 状态
     */
    getVocalRemoval(): boolean {
        return this.isVocalRemovalEnabled;
    }
    
    /**
     * 创建 Vocal Removal 节点链（相位抵消法）
     * 原理：(L - R) 和 (R - L) 可以消除居中人声
     * 注意：由于 Web Audio API 限制，一个节点的输出只能连接一次
     */
    private createVocalRemovalChain(inputNode: AudioNode): AudioNode {
        if (!this.audioContext) {
            throw new Error('AudioContext not initialized');
        }
        
        // 创建节点
        const splitter = this.audioContext.createChannelSplitter(2);
        const merger = this.audioContext.createChannelMerger(2);
        const inverterL = this.audioContext.createGain();  // 左声道反相
        const inverterR = this.audioContext.createGain();  // 右声道反相
        
        // 设置反相增益
        inverterL.gain.value = -1;
        inverterR.gain.value = -1;
        
        // 保存引用以便清理
        this.vocalRemovalSplitter = splitter;
        this.vocalRemovalMerger = merger;
        this.vocalRemovalInverterL = inverterL;
        this.vocalRemovalInverterR = inverterR;
        
        try {
            // 输入 -> Splitter
            inputNode.connect(splitter);
            
            // 关键：每个 splitter 输出只能连接一次！
            // 所以我们不能同时连接到 merger 和 inverter
            
            // 解决方案：使用中间节点来复制信号
            this.vocalRemovalCopyL = this.audioContext.createGain();  // 复制左声道
            this.vocalRemovalCopyR = this.audioContext.createGain();  // 复制右声道
            this.vocalRemovalCopyL.gain.value = 1;
            this.vocalRemovalCopyR.gain.value = 1;
            
            // 左声道分支：splitter[0] -> copyL -> [merger, inverterR]
            splitter.connect(this.vocalRemovalCopyL, 0);                  // L -> copyL
            this.vocalRemovalCopyL.connect(merger, 0, 0);                 // L -> merger左输入
            this.vocalRemovalCopyL.connect(inverterR, 0);                 // L -> inverterR（用于右声道）
            inverterR.connect(merger, 0, 1);             // -L -> merger右输入
            
            // 右声道分支：splitter[1] -> copyR -> [merger, inverterL]
            splitter.connect(this.vocalRemovalCopyR, 1);                  // R -> copyR
            this.vocalRemovalCopyR.connect(merger, 0, 1);                 // R -> merger右输入
            this.vocalRemovalCopyR.connect(inverterL, 0);                 // R -> inverterL（用于左声道）
            inverterL.connect(merger, 0, 0);             // -R -> merger左输入
        } catch (error) {
            throw error;
        }
        
        return merger;
    }

    destroy(): void {
        this.stop();
        
        // 清理 Vocal Removal 节点
        if (this.vocalRemovalSplitter) {
            this.vocalRemovalSplitter.disconnect();
            this.vocalRemovalSplitter = null;
        }
        if (this.vocalRemovalMerger) {
            this.vocalRemovalMerger.disconnect();
            this.vocalRemovalMerger = null;
        }
        if (this.vocalRemovalInverterL) {
            this.vocalRemovalInverterL.disconnect();
            this.vocalRemovalInverterL = null;
        }
        if (this.vocalRemovalInverterR) {
            this.vocalRemovalInverterR.disconnect();
            this.vocalRemovalInverterR = null;
        }
        if (this.vocalRemovalCopyL) {
            this.vocalRemovalCopyL.disconnect();
            this.vocalRemovalCopyL = null;
        }
        if (this.vocalRemovalCopyR) {
            this.vocalRemovalCopyR.disconnect();
            this.vocalRemovalCopyR = null;
        }
        
        if (this.gainNode) {
            this.gainNode.disconnect();
            this.gainNode = null;
        }
        
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
        
        this.audioBuffer = null;
        this.onTimeUpdate = null;
        this.onEnded = null;
    }
}

// 导出单例
export const webAudioPlayer = new WebAudioPlayer();
