import { useWavesurfer } from "@wavesurfer/react";
import { useEffect, useRef } from "react";
import "./waveform.css";

interface IWaveformProps {
    // time in seconds
    value: number;
    /**
     * @param time seconds
     */
    onSeek: (time: number) => void;
    className?: string;
    /**
     * ✅ Android 模式下传入音频文件路径
     */
    audioSrc?: string;
}

export const Waveform: React.FC<IWaveformProps> = ({ value, onSeek, className, audioSrc }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    const style = getComputedStyle(document.documentElement);
    const themeColor = style.getPropertyValue("--theme-color");
    const { wavesurfer } = useWavesurfer({
        container: containerRef,
        waveColor: "#eeeeee",
        progressColor: themeColor,
        cursorColor: themeColor,
        normalize: true,
        height: "auto",
        interact: true,
        dragToSeek: true,
    });

    // attach drag listener
    useEffect(() => {
        return wavesurfer?.on("interaction", (currentTime) => {
            onSeek(currentTime);
        });
    }, [wavesurfer, onSeek]);

    // Update the seekTo position when value prop changes
    useEffect(() => {
        wavesurfer?.setTime(value);
    }, [wavesurfer, value]);

    useEffect(() => {
        let cancelled = false;
        
        if (wavesurfer) {
            // ✅ Android 模式下使用传入的 audioSrc，Web 模式也使用传入的 audioSrc
            const src = audioSrc;
            
            if (src) {
                // ✅ 切换歌曲时先清空旧波形
                wavesurfer.empty();
                
                wavesurfer.load(src)
                    .then(() => {
                        if (!cancelled) {
                            wavesurfer?.setTime(value);
                        }
                    })
                    .catch((error) => {
                        // 忽略 AbortError，这是正常的取消操作
                        if (error.name !== 'AbortError') {
                            console.error('Waveform load error:', error);
                        }
                    });
            } else {
                // ✅ 没有音频源时清空波形
                wavesurfer.empty();
            }
        }
        
        return () => {
            cancelled = true;
        };
    }, [wavesurfer, audioSrc]);  // ✅ 只依赖 audioSrc，当切换歌曲时重新加载

    return <div className={`waveform ${className || ""}`} ref={containerRef}></div>;
};
