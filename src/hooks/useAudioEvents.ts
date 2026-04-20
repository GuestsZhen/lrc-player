/**
 * 音频事件处理 Hook
 * 封装所有 HTMLAudioElement 的事件回调
 */
import { useCallback, useContext } from "react";
import { audioStatePubSub, AudioActionType, currentTimePubSub, audioRef } from "../utils/audiomodule.js";
import { appContext, ChangBits } from "../components/app.context.js";
import { toastPubSub } from "../components/toast.js";

interface UseAudioEventsReturn {
    onAudioLoadedMetadata: () => void;
    onAudioPlay: () => void;
    onAudioPause: () => void;
    onAudioEnded: () => void;
    onAudioTimeUpdate: () => void;
    onAudioRateChange: () => void;
    onAudioError: (ev: React.SyntheticEvent<HTMLAudioElement>) => void;
}

export function useAudioEvents(): UseAudioEventsReturn {
    const { lang } = useContext(appContext, ChangBits.lang);

    const onAudioLoadedMetadata = useCallback(() => {
        if (audioRef.current) {
            audioStatePubSub.pub({
                type: AudioActionType.getDuration,
                payload: audioRef.current.duration,
            });
        }
    }, []);

    const syncCurrentTime = useCallback(() => {
        if (audioRef.current) {
            currentTimePubSub.pub(audioRef.current.currentTime);
        }
    }, []);

    const onAudioPlay = useCallback(() => {
        audioStatePubSub.pub({
            type: AudioActionType.pause,
            payload: false,
        });
    }, []);

    const onAudioPause = useCallback(() => {
        audioStatePubSub.pub({
            type: AudioActionType.pause,
            payload: true,
        });
        syncCurrentTime();
    }, [syncCurrentTime]);

    const onAudioEnded = useCallback(() => {
        // 触发下一首事件
        window.dispatchEvent(new CustomEvent('next-track'));
    }, []);

    const onAudioTimeUpdate = useCallback(() => {
        if (audioRef.current && !audioRef.current.paused) {
            syncCurrentTime();
        }
    }, [syncCurrentTime]);

    const onAudioRateChange = useCallback(() => {
        if (audioRef.current) {
            audioStatePubSub.pub({
                type: AudioActionType.rateChange,
                payload: audioRef.current.playbackRate,
            });
        }
    }, []);

    const onAudioError = useCallback(
        (ev: React.SyntheticEvent<HTMLAudioElement>) => {
            const audio = ev.target as HTMLAudioElement;
            const error = audio.error!;
            const message = lang.audio.error[error.code] || error.message || lang.audio.error[0];
            
            toastPubSub.pub({
                text: message,
                type: 'warning',  // toast 只支持 info/success/warning
            });
        },
        [lang]
    );

    return {
        onAudioLoadedMetadata,
        onAudioPlay,
        onAudioPause,
        onAudioEnded,
        onAudioTimeUpdate,
        onAudioRateChange,
        onAudioError,
    };
}
