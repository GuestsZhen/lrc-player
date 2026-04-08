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
            console.log('[WebAudioPlayer] Initializing...');
            
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
            
            console.log('[WebAudioPlayer] Audio decoded, duration:', this.duration, 'seconds');
            
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
            
            console.log('[WebAudioPlayer] Initialized successfully');
        } catch (error) {
            console.error('[WebAudioPlayer] Initialization failed:', error);
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

        const needPitchShift = Math.abs(this.currentPitch) > 0.01;
        
        if (startOffset > 0 && !needPitchShift) {
            // 无音高调节时，使用原生节点支持 seek
            console.log('[WebAudioPlayer] Using native AudioBufferSourceNode for seek');
            this.sourceNode = this.audioContext.createBufferSource();
            this.sourceNode.buffer = this.audioBuffer;
            this.sourceNode.connect(this.gainNode);
            this.sourceNode.start(0, startOffset);
        } else {
            // 有音高调节或从头播放，使用 PitchShifter
            console.log('[WebAudioPlayer] Using PitchShifter (pitch:', this.currentPitch, ')');
            
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
            this.pitchShifter.connect(this.gainNode);
            console.log('[WebAudioPlayer] PitchShifter connected and ready');
        }
    }

    /**
     * 播放音频
     */
    play(fromTime?: number): void {
        console.log('[WebAudioPlayer] play() called with fromTime:', fromTime);
        console.log('[WebAudioPlayer] Current state - isPlaying:', this.isPlaying, 'audioContext:', !!this.audioContext, 'audioBuffer:', !!this.audioBuffer);
        
        if (!this.audioContext || !this.audioBuffer) {
            console.error('[WebAudioPlayer] Not initialized');
            return;
        }

        // 如果已经在播放，先停止
        if (this.isPlaying) {
            console.log('[WebAudioPlayer] Already playing, stopping first');
            this.stop();
        }

        // 恢复 AudioContext（如果被挂起）
        if (this.audioContext.state === 'suspended') {
            console.log('[WebAudioPlayer] Resuming suspended AudioContext');
            this.audioContext.resume();
        }

        // 计算起始时间
        const offset = fromTime !== undefined ? fromTime : this.pauseOffset;
        
        console.log('[WebAudioPlayer] Creating audio chain from', offset, 'seconds');
        this.createAudioChain(offset);

        this.startTime = this.audioContext.currentTime - offset;
        this.isPlaying = true;
        
        console.log('[WebAudioPlayer] Playing from', offset, 'seconds, pitch:', this.currentPitch, 'semitones');
        console.log('[WebAudioPlayer] isPlaying set to true');
        
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
        
        console.log('[WebAudioPlayer] Play completed');
    }

    /**
     * 暂停播放
     */
    pause(): void {
        console.log('[WebAudioPlayer] pause() called, isPlaying:', this.isPlaying);
        
        if (!this.isPlaying) {
            console.log('[WebAudioPlayer] Already paused, ignoring');
            return;
        }

        // 计算当前播放位置
        if (this.audioContext) {
            const elapsed = this.audioContext.currentTime - this.startTime;
            this.pauseOffset = elapsed * this.currentSpeed;
            console.log('[WebAudioPlayer] Paused at', this.pauseOffset, 'seconds');
        }

        // 停止 PitchShifter 处理
        if (this.pitchShifter) {
            console.log('[WebAudioPlayer] Stopping and disconnecting PitchShifter');
            this.pitchShifter.off();
            try {
                this.pitchShifter.disconnect();  // ✅ 断开输出，真正停止声音
            } catch (e) {
                console.error('[WebAudioPlayer] Error disconnecting PitchShifter:', e);
            }
        } else {
            console.log('[WebAudioPlayer] No PitchShifter to stop');
        }
        
        // 重要：必须先移除 onended 回调，再调用 stop()
        if (this.sourceNode) {
            try {
                console.log('[WebAudioPlayer] Removing onended callback');
                this.sourceNode.onended = null;  // ✅ 先移除回调
                
                // 只有在没有使用 PitchShifter 时才调用 stop()
                // 因为 PitchShifter 模式下 sourceNode 没有调用 start()
                if (!this.pitchShifter) {
                    console.log('[WebAudioPlayer] Stopping sourceNode (native mode)');
                    this.sourceNode.stop();  // ✅ 原生模式需要 stop
                } else {
                    console.log('[WebAudioPlayer] Skipping stop (PitchShifter mode)');
                }
                
                console.log('[WebAudioPlayer] Disconnecting sourceNode');
                this.sourceNode.disconnect();
            } catch (e) {
                console.error('[WebAudioPlayer] Error stopping sourceNode:', e);
            }
            // 不将 sourceNode 设为 null，保留引用
        } else {
            console.log('[WebAudioPlayer] No sourceNode to stop');
        }

        this.isPlaying = false;
        console.log('[WebAudioPlayer] isPlaying set to false');
        this.stopTimeUpdateTimer();
        
        audioStatePubSub.pub({ type: AudioActionType.pause, payload: true });
        console.log('[WebAudioPlayer] Pause completed');
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
        
        console.log('[WebAudioPlayer] Stopped');
    }

    /**
     * 跳转到指定时间
     */
    seek(time: number): void {
        const wasPlaying = this.isPlaying;
        
        console.log('[WebAudioPlayer] Seeking to', time, 'seconds');
        
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
                this.sourceNode.stop();
                this.sourceNode.disconnect();
            } catch {
            }
            this.sourceNode = null;
        }
        
        this.pauseOffset = Math.max(0, Math.min(time, this.duration));
        
        if (wasPlaying) {
            this.play(this.pauseOffset);
        }
    }

    /**
     * 设置音高（半音）
     */
    setPitch(semitones: number): void {
        this.currentPitch = semitones;
        
        console.log('[WebAudioPlayer] setPitch called:', semitones, 'semitones');
        console.log('[WebAudioPlayer] pitchShifter exists:', !!this.pitchShifter);
        console.log('[WebAudioPlayer] isPlaying:', this.isPlaying);
        
        if (this.pitchShifter) {
            // 如果正在播放，直接更新
            this.pitchShifter.pitchSemitones = semitones;
            console.log('[WebAudioPlayer] Pitch updated to', semitones, 'semitones');
            console.log('[WebAudioPlayer] Current pitchSemitones:', this.pitchShifter.pitchSemitones);
        } else {
            // 如果还未播放，只保存值，等 play() 时应用
            console.log('[WebAudioPlayer] pitchShifter not initialized yet, will apply on next play');
        }
    }

    /**
     * 设置播放速度
     */
    setSpeed(speed: number): void {
        this.currentSpeed = Math.max(0.5, Math.min(2.0, speed));
        
        if (this.pitchShifter) {
            this.pitchShifter.tempo = this.currentSpeed;
            console.log('[WebAudioPlayer] Speed set to', this.currentSpeed, 'x');
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
        
        console.log('[WebAudioPlayer] Playback ended');
    }

    destroy(): void {
        this.stop();
        
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
        
        console.log('[WebAudioPlayer] Destroyed');
    }
}

// 导出单例
export const webAudioPlayer = new WebAudioPlayer();
