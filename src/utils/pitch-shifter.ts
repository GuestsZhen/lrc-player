/**
 * 音高调节工具 - 基于 SoundTouchJS
 * 支持在不改变播放速度的情况下调节音高
 */

import { PitchShifter } from 'soundtouchjs';

export interface PitchShiftOptions {
    audioContext: AudioContext;
    audioBuffer: AudioBuffer;
    semitones: number; // 半音数（-12 到 +12）
}

export class PitchShifterManager {
    private shifter: PitchShifter | null = null;
    private audioContext: AudioContext | null = null;
    private gainNode: GainNode | null = null;
    private currentSemitones: number = 0;

    /**
     * 初始化音高调节器
     */
    async init(options: PitchShiftOptions): Promise<void> {
        try {
            this.audioContext = options.audioContext;
            this.currentSemitones = options.semitones;

            // 创建增益节点
            this.gainNode = this.audioContext.createGain();
            this.gainNode.connect(this.audioContext.destination);

            // 创建 PitchShifter 实例
            this.shifter = new PitchShifter(
                this.audioContext,
                options.audioBuffer,
                1024 // 缓冲区大小
            );

            // 设置音高（使用半音）和速度
            this.shifter.pitchSemitones = options.semitones;
            this.shifter.tempo = 1.0; // 保持原速

            // 连接到输出
            this.shifter.connect(this.gainNode);
        } catch (error) {
            throw error;
        }
    }

    /**
     * 开始播放
     */
    play(): void {
        if (this.shifter) {
            this.shifter.play();
        }
    }

    /**
     * 停止播放
     */
    stop(): void {
        if (this.shifter) {
            this.shifter.off();
        }
    }

    /**
     * 更新音高（按半音）
     * @param semitones 半音数（-12 到 +12）
     */
    setPitch(semitones: number): void {
        if (!this.shifter) {
            return;
        }

        this.currentSemitones = semitones;
        
        // 直接设置半音数
        this.shifter.pitchSemitones = semitones;
        this.shifter.tempo = 1.0; // 始终保持原速
    }

    /**
     * 获取当前半音数
     */
    getSemitones(): number {
        return this.currentSemitones;
    }

    /**
     * 销毁实例
     */
    destroy(): void {
        if (this.shifter) {
            this.shifter.off();
            this.shifter = null;
        }
        if (this.gainNode) {
            this.gainNode.disconnect();
            this.gainNode = null;
        }
    }
}

// 导出单例
export const pitchShifterManager = new PitchShifterManager();
