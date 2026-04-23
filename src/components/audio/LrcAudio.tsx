/**
 * LRC 音频播放器主组件（重构版）
 */
import { convertTimeToTag } from "@lrc-maker/lrc-parser";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { audioRef, audioStatePubSub, AudioActionType, type AudioState } from "../../utils/audiomodule.js";
import { appContext, ChangBits } from "../app.context";
// import { loadAudioDialogRef } from "../loadaudio.js";
// import { Waveform } from "../waveform";
// ✅ 使用新创建的子组件和 Hooks
import { TimeLine } from "./TimeLine";
import { RateSlider } from "./RateSlider";
import { PlaybackControls } from "./PlaybackControls";
import { useAudioControl } from '../../hooks/useAudioControl';
import { usePlaybackMode } from '../../hooks/usePlaybackMode';
// ✅ 导入 SVG 图标
import { PreviousSVG, NextSVG, RepeatSVG, ShuffleSVG, RepeatOneSVG, PlaySVG, PauseSVG } from "../svg.js";
import { isAndroidNative } from '../../utils/platform-detector.js';
import { MediaStore } from '../../utils/mediastore-plugin.js';

interface ILrcAudioProps {
    lang: Language;
    currentTrackName?: string;
    /**
     * ✅ Android 模式下传入当前曲目文件路径（用于波形显示）
     */
    currentTrackFilePath?: string;
}

export const LrcAudio: React.FC<ILrcAudioProps> = ({ lang, currentTrackName, currentTrackFilePath }) => {
    
    // ✅ 使用 Hooks 管理状态
    const { paused, duration, currentTime, rate: _rate, togglePlay } = useAudioControl();
    const { playMode, togglePlayMode } = usePlaybackMode();
    
    const [localAudioMode, setLocalAudioMode] = useState(false);
    // ✅ Android 模式下用于波形显示的 Blob URL
    const [audioBlobUrl, setAudioBlobUrl] = useState<string | undefined>(undefined);

    useEffect(() => {
        return audioStatePubSub.sub(Symbol('LrcAudio'), (data: AudioState) => {
            if (data.type === AudioActionType.getDuration) {
                setLocalAudioMode(audioRef.src.startsWith("blob:"));
            }
        });
    }, []);
    
    // ✅ Android 模式下将 Content URI 转换为 Blob URL（用于波形显示）
    useEffect(() => {
        if (!isAndroidNative() || !currentTrackFilePath) {
            // ✅ 清空旧的 Blob URL
            if (audioBlobUrl) {
                URL.revokeObjectURL(audioBlobUrl);
                setAudioBlobUrl(undefined);
            }
            return;
        }
        
        let cancelled = false;
        
        // ❌ 不要在这里清空，会导致闪烁
        // if (audioBlobUrl) {
        //     URL.revokeObjectURL(audioBlobUrl);
        //     setAudioBlobUrl(undefined);
        // }
        
        MediaStore.readFileAsBase64({ uri: currentTrackFilePath })
            .then((result) => {
                if (cancelled) return;
                
                
                // 将 Base64 转换为 Blob
                const byteCharacters = atob(result.base64);
                const byteNumbers = new Array<number>(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], { type: 'audio/mpeg' });
                const url = URL.createObjectURL(blob);
                setAudioBlobUrl(url);
            })
            .catch((_error) => {
            });
        
        return () => {
            cancelled = true;
            // 清理 Blob URL
            if (audioBlobUrl) {
                URL.revokeObjectURL(audioBlobUrl);
            }
        };
    }, [currentTrackFilePath]);

    const { prefState } = useContext(appContext, ChangBits.prefState);
    // ✅ Android 模式下使用 Blob URL，Web 模式使用 localAudioMode
    const showWaveform = isAndroidNative() 
        ? (prefState.showWaveform && !!audioBlobUrl)
        : (prefState.showWaveform && localAudioMode);
    
    const fixed = showWaveform ? prefState.fixed : 0;

    const durationTimeTag = useMemo(() => {
        return duration ? convertTimeToTag(duration, fixed, false) : false;
    }, [duration, fixed]);

    // 上一首歌
    const onPreviousTrack = useCallback(() => {
        window.dispatchEvent(new CustomEvent('previous-track'));
    }, []);

    // 下一首歌
    const onNextTrack = useCallback(() => {
        window.dispatchEvent(new CustomEvent('next-track'));
    }, []);

    return (
        <section className={"lrc-audio" + (paused ? "" : " playing")}>
            {/* 竖屏模式下的三行布局 */}
            <div className="portrait-layout">
                {/* 第一行：当前时间 | 歌曲文件名 | 总时长 */}
                <div className="track-info-row">
                    <time className="track-current-time">
                        {convertTimeToTag(currentTime, fixed, false)}
                    </time>
                    {currentTrackName && (
                        <span className="track-name-text">{currentTrackName}</span>
                    )}
                    {durationTimeTag && (
                        <time className="track-duration-time">
                            {durationTimeTag}
                        </time>
                    )}
                </div>
                
                {/* 第二行：进度条 - 使用提取的 TimeLine 组件 */}
                <div className="timeline-row">
                    {/* ✅ 竖屏模式下不显示时间文本，因为第一行已经显示了 */}
                    <TimeLine 
                        duration={duration} 
                        paused={paused} 
                        showTimeText={false}
                        audioSrc={isAndroidNative() ? audioBlobUrl : undefined}
                    />
                </div>
                
                {/* 第三行：控制按钮 - 使用提取的 PlaybackControls 组件 */}
                <div className="controls-row">
                    <PlaybackControls
                        playMode={playMode}
                        onTogglePlayMode={togglePlayMode}
                        onPrevious={onPreviousTrack}
                        onNext={onNextTrack}
                        onPlayPause={togglePlay}
                        paused={paused}
                        // ✅ Android 原生环境始终启用按钮（ExoPlayer 不通过 duration 判断）
                        hasDuration={isAndroidNative() ? true : !!duration}
                    />
                    
                    {/* 右侧速度按钮 - 使用提取的 RateSlider 组件 */}
                    <div className="controls-right">
                        <RateSlider lang={lang} />
                    </div>
                </div>
            </div>
            
            {/* 横屏模式保持原有布局 */}
            <div className="landscape-layout">
                <button 
                    className="ripple glow" 
                    title={playMode === 0 ? '顺序播放' : playMode === 1 ? '随机播放' : '单曲循环'}
                    onClick={togglePlayMode}
                >
                    {playMode === 0 ? <RepeatSVG /> : playMode === 1 ? <ShuffleSVG /> : <RepeatOneSVG />}
                </button>
                <button 
                    className="ripple glow" 
                    title="上一首歌" 
                    onClick={onPreviousTrack}
                    disabled={!duration}
                >
                    <PreviousSVG />
                </button>
                <button
                    className="ripple glow"
                    title={paused ? lang.audio.play : lang.audio.pause}
                    disabled={!duration}
                    onClick={togglePlay}
                >
                    {paused ? <PlaySVG /> : <PauseSVG />}
                </button>
                <button 
                    className="ripple glow" 
                    title="下一首歌" 
                    onClick={onNextTrack}
                    disabled={!duration}
                >
                    <NextSVG />
                </button>

                <TimeLine duration={duration} paused={paused} />
                <RateSlider lang={lang} />
            </div>
        </section>
    );
};
