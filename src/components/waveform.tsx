import { useWavesurfer } from "@wavesurfer/react";
import { useEffect, useRef } from "react";
import { audioRef } from "../utils/audiomodule";
import "./waveform.css";

interface IWaveformProps {
    // time in seconds
    value: number;
    /**
     * @param time seconds
     */
    onSeek: (time: number) => void;
    className?: string;
}

export const Waveform: React.FC<IWaveformProps> = ({ value, onSeek, className }) => {
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
        
        if (wavesurfer && audioRef.src) {
            wavesurfer.load(audioRef.src)
                .then(() => {
                    if (!cancelled) {
                        wavesurfer?.setTime(value);
                    }
                })
                .catch((error) => {
                    // 忽略 AbortError，这是正常的取消操作
                    if (error.name !== 'AbortError') {
                        console.error('[Waveform] Load error:', error);
                    }
                });
        }
        
        return () => {
            cancelled = true;
        };
    }, [wavesurfer, audioRef.src]);

    return <div className={`waveform ${className || ""}`} ref={containerRef}></div>;
};
