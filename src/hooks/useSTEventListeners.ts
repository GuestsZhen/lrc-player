/**
 * ST (SoundTouch) 事件监听器 Hook
 * 统一管理所有 ST 相关的事件监听
 */

import { useEffect } from 'react';
import { isAndroidNative } from '../utils/platform-detector.js';

interface UseSTEventListenersOptions {
    setIsStDetectingKey: (value: boolean) => void;
    setStDetectedKey: (value: string) => void;
    setStPitchSemitones: React.Dispatch<React.SetStateAction<number>>;
    setStPlaybackSpeed: React.Dispatch<React.SetStateAction<number>>;
    setStVocalRemoval: React.Dispatch<React.SetStateAction<boolean>>;
    setShowEQPanel: (value: boolean) => void;
    setShowEQModal: (value: boolean) => void;
    setEqBands: React.Dispatch<React.SetStateAction<Array<{ index: number; freq: number; level: number; minLevel: number; maxLevel: number }>>>;
}

export const useSTEventListeners = ({
    setIsStDetectingKey,
    setStDetectedKey,
    setStPitchSemitones,
    setStPlaybackSpeed,
    setStVocalRemoval,
    setShowEQPanel,
    setShowEQModal,
    setEqBands
}: UseSTEventListenersOptions) => {
    
    // 监听 ST 调性检测开始
    useEffect(() => {
        const handleStKeyDetectionStart = () => {
            setIsStDetectingKey(true);
        };
        
        const handleStKeyDetectionResult = (event: CustomEvent<string>) => {
            setStDetectedKey(event.detail);
            setIsStDetectingKey(false);
        };
        
        window.addEventListener('st-key-detection-start' as any, handleStKeyDetectionStart as any);
        window.addEventListener('st-key-detection-result' as any, handleStKeyDetectionResult as any);
        
        return () => {
            window.removeEventListener('st-key-detection-start' as any, handleStKeyDetectionStart as any);
            window.removeEventListener('st-key-detection-result' as any, handleStKeyDetectionResult as any);
        };
    }, [setIsStDetectingKey, setStDetectedKey]);
    
    // 监听普通调性检测更新并同步到 ST 状态
    useEffect(() => {
        const handleKeyDetectionUpdate = (event: CustomEvent<{ fullKey: string; isDetecting: boolean }>) => {
            const { fullKey, isDetecting } = event.detail;
            
            if (isDetecting) {
                setIsStDetectingKey(true);
            } else {
                setIsStDetectingKey(false);
                setStDetectedKey(fullKey || '');
            }
        };
        
        window.addEventListener('key-detection-update' as any, handleKeyDetectionUpdate as any);
        return () => window.removeEventListener('key-detection-update' as any, handleKeyDetectionUpdate as any);
    }, [setIsStDetectingKey, setStDetectedKey]);
    
    // 监听 ST 音高变化
    useEffect(() => {
        const handleStPitchChange = (event: CustomEvent<number>) => {
            setStPitchSemitones(event.detail);
        };
        
        window.addEventListener('st-pitch-change' as any, handleStPitchChange as any);
        return () => window.removeEventListener('st-pitch-change' as any, handleStPitchChange as any);
    }, [setStPitchSemitones]);
    
    // 监听 ST 速度变化
    useEffect(() => {
        const handleStSpeedChange = (event: CustomEvent<number>) => {
            setStPlaybackSpeed(event.detail);
        };
        
        window.addEventListener('st-speed-change' as any, handleStSpeedChange as any);
        return () => window.removeEventListener('st-speed-change' as any, handleStSpeedChange as any);
    }, [setStPlaybackSpeed]);
    
    // 监听 ST 去人声状态变化
    useEffect(() => {
        const handleStVocalRemovalChange = (event: CustomEvent<boolean>) => {
            setStVocalRemoval(event.detail);
        };
        
        window.addEventListener('st-vocal-removal-change' as any, handleStVocalRemovalChange as any);
        return () => window.removeEventListener('st-vocal-removal-change' as any, handleStVocalRemovalChange as any);
    }, [setStVocalRemoval]);
    
    // Android 模式下处理音高、速度、去人声和 EQ 事件
    useEffect(() => {
        const isAndroid = isAndroidNative();
        
        if (!isAndroid) {
            return;
        }
        
        import('../utils/playback-control.js').then(({ setExoPlayerPitch, setExoPlayerSpeed }) => {
            // 音高调节
            const handleAdjustPitch = async (event: CustomEvent<number>) => {
                const semitones = event.detail;
                
                setStPitchSemitones(prevSemitones => {
                    const newSemitones = prevSemitones + semitones;
                    const clampedSemitones = Math.max(-12, Math.min(12, newSemitones));
                    const pitch = Math.pow(1.05946, clampedSemitones);
                    
                    setExoPlayerPitch(pitch).catch(() => {});
                    window.dispatchEvent(new CustomEvent('st-pitch-change', { detail: clampedSemitones }));
                    
                    return clampedSemitones;
                });
            };
            
            // 重置音高
            const handleResetPitch = async () => {
                setStPitchSemitones(0);
                await setExoPlayerPitch(1.0);
                window.dispatchEvent(new CustomEvent('st-pitch-change', { detail: 0 }));
            };
            
            // 速度调节
            const handleAdjustSpeed = async (event: CustomEvent<number>) => {
                const delta = event.detail;
                
                setStPlaybackSpeed(prevSpeed => {
                    const newSpeed = Math.max(0.5, Math.min(2.0, prevSpeed + delta));
                    
                    setExoPlayerSpeed(newSpeed).then(() => {}).catch(() => {});
                    window.dispatchEvent(new CustomEvent('st-speed-change', { detail: newSpeed }));
                    
                    return newSpeed;
                });
            };
            
            // 重置速度
            const handleResetSpeed = async () => {
                setStPlaybackSpeed(1.0);
                await setExoPlayerSpeed(1.0);
                window.dispatchEvent(new CustomEvent('st-speed-change', { detail: 1.0 }));
            };
            
            // 直接设置速度（用于滑动条）
            const handleSetSpeed = async (event: CustomEvent<number>) => {
                const newSpeed = event.detail;
                setStPlaybackSpeed(newSpeed);
                await setExoPlayerSpeed(newSpeed);
                window.dispatchEvent(new CustomEvent('st-speed-change', { detail: newSpeed }));
            };
            
            // 切换去人声
            const handleToggleVocalRemoval = () => {
                setStVocalRemoval(prevState => {
                    const newState = !prevState;
                    
                    import('../utils/exoplayer-plugin.js').then(({ setVocalRemoval, getEQBands }) => {
                        if (newState) {
                            setShowEQPanel(true);
                            setShowEQModal(true);
                        } else {
                            getEQBands()
                                .then(eqData => {
                                    const resetBands = eqData.bands.map(band => ({
                                        ...band,
                                        level: 0
                                    }));
                                    setEqBands(resetBands);
                                    
                                    import('../utils/exoplayer-plugin.js').then(({ setEQBandLevel }) => {
                                        resetBands.forEach(band => {
                                            setEQBandLevel(band.index, 0).catch(() => {
                                                // Failed to reset band
                                            });
                                        });
                                    });
                                })
                                .catch(() => {
                                    // Failed to reset EQ bands
                                });
                        }
                        
                        setVocalRemoval(newState)
                            .then(result => {
                                if (newState) {
                                    getEQBands()
                                        .then(eqData => {
                                            setEqBands(eqData.bands);
                                        })
                                        .catch(() => {
                                            // Failed to get EQ bands
                                        });
                                }
                            })
                            .catch(() => {
                                // Failed to call setVocalRemoval
                                if (newState) {
                                    setShowEQPanel(false);
                                    setShowEQModal(false);
                                }
                            });
                    });
                    
                    return newState;
                });
            };
            
            // 调整 EQ 频段
            const handleAdjustEQBand = async (event: CustomEvent<{ bandIndex: number; level: number }>) => {
                const { bandIndex, level } = event.detail;
                
                try {
                    const { setEQBandLevel } = await import('../utils/exoplayer-plugin.js');
                    await setEQBandLevel(bandIndex, level);
                    
                    setEqBands(prevBands => 
                        prevBands.map(band => 
                            band.index === bandIndex ? { ...band, level } : band
                        )
                    );
                } catch (error) {
                    // Failed to adjust EQ band
                }
            };
            
            // 注册所有事件监听器
            window.addEventListener('st-adjust-pitch' as any, handleAdjustPitch as any);
            window.addEventListener('st-reset-pitch' as any, handleResetPitch as any);
            window.addEventListener('st-adjust-speed' as any, handleAdjustSpeed as any);
            window.addEventListener('st-reset-speed' as any, handleResetSpeed as any);
            window.addEventListener('st-adjust-speed-to' as any, handleSetSpeed as any);
            window.addEventListener('st-toggle-vocal-removal' as any, handleToggleVocalRemoval as any);
            window.addEventListener('st-adjust-eq-band' as any, handleAdjustEQBand as any);
            
            return () => {
                window.removeEventListener('st-adjust-pitch' as any, handleAdjustPitch as any);
                window.removeEventListener('st-reset-pitch' as any, handleResetPitch as any);
                window.removeEventListener('st-adjust-speed' as any, handleAdjustSpeed as any);
                window.removeEventListener('st-reset-speed' as any, handleResetSpeed as any);
                window.removeEventListener('st-adjust-speed-to' as any, handleSetSpeed as any);
                window.removeEventListener('st-toggle-vocal-removal' as any, handleToggleVocalRemoval as any);
                window.removeEventListener('st-adjust-eq-band' as any, handleAdjustEQBand as any);
            };
        });
    }, [setStPitchSemitones, setStPlaybackSpeed, setStVocalRemoval, setShowEQPanel, setShowEQModal, setEqBands]);
};
