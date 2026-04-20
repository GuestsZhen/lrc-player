/**
 * 播放控制按钮组件
 */
import { useCallback } from 'react';
import { PreviousSVG, NextSVG, RepeatSVG, ShuffleSVG, RepeatOneSVG, PlaySVG, PauseSVG } from "../svg.js";
import type { PlayMode } from '../../hooks/usePlaybackMode';

interface IPlaybackControlsProps {
    playMode: PlayMode;
    onTogglePlayMode: () => void;
    onPrevious: () => void;
    onNext: () => void;
    onPlayPause: () => void;
    paused: boolean;
    hasDuration: boolean;
}

export const PlaybackControls: React.FC<IPlaybackControlsProps> = ({
    playMode,
    onTogglePlayMode,
    onPrevious,
    onNext,
    onPlayPause,
    paused,
    hasDuration,
}) => {
    // 添加调试日志
    const handlePrevious = useCallback(() => {
        onPrevious();
    }, [onPrevious]);
    
    const handleNext = useCallback(() => {
        onNext();
    }, [onNext]);
    
    const handlePlayPause = useCallback(() => {
        onPlayPause();
    }, [onPlayPause, paused]);
    
    return (
        <>
            {/* 左下角播放顺序按钮 - 绝对定位 */}
            <button 
                className="ripple glow play-mode-button-left" 
                title={playMode === 0 ? '顺序播放' : playMode === 1 ? '随机播放' : '单曲循环'}
                onClick={onTogglePlayMode}
            >
                {playMode === 0 ? <RepeatSVG /> : playMode === 1 ? <ShuffleSVG /> : <RepeatOneSVG />}
            </button>
            
            {/* 中间按钮组 */}
            <div className="controls-center">
                <button 
                    className="ripple glow previous-button" 
                    title="上一首歌" 
                    onClick={handlePrevious}
                    disabled={!hasDuration}
                >
                    <PreviousSVG />
                </button>
                <button
                    className="ripple glow play-button"
                    title={paused ? '播放' : '暂停'}
                    disabled={!hasDuration}
                    onClick={handlePlayPause}
                >
                    {paused ? <PlaySVG /> : <PauseSVG />}
                </button>
                <button 
                    className="ripple glow next-button" 
                    title="下一首歌" 
                    onClick={handleNext}
                    disabled={!hasDuration}
                >
                    <NextSVG />
                </button>
            </div>
        </>
    );
};
