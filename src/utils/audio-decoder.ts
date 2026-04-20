/**
 * 音频文件解码工具
 * 支持 NCM、QMC 等加密格式的解密
 */

import SSK from "#const/session_key.json" assert { type: "json" };
import { toastPubSub } from '../components/toast.js';

type TsetAudioSrc = (src: string) => void;

const MimeType = {
    fLaC: 0x664c6143,
    OggS: 0x4f676753,
    RIFF: 0x52494646,
    WAVE: 0x57415645,
};

/**
 * 检测音频文件的 MIME 类型
 * @param dataArray - 音频数据
 * @returns MIME 类型字符串
 */
export const detectMimeType = (dataArray: Uint8Array): string => {
    const magicNumber = new DataView(dataArray.buffer).getUint32(0, false);
    switch (magicNumber) {
        case MimeType.fLaC:
            return "audio/flac";

        case MimeType.OggS:
            return "audio/ogg";

        case MimeType.RIFF:
        case MimeType.WAVE:
            return "audio/wav";

        default:
            return "audio/mpeg";
    }
};

/**
 * 处理音频文件,支持普通音频和加密格式(NCM/QMC)
 * @param file - 音频文件
 * @param setAudioSrc - 设置音频源的回调函数
 */
export const receiveFile = (file: File, setAudioSrc: TsetAudioSrc): void => {
    try {
        // 清除 sessionStorage 中的旧音频源
        sessionStorage.removeItem(SSK.audioSrc);

        if (file) {
            // 普通音频文件
            if (file.type.startsWith("audio/")) {
                const url = URL.createObjectURL(file);
                setAudioSrc(url);
                return;
            }

            // NCM 格式解密
            if (file.name.endsWith(".ncm")) {
                const worker = new Worker(new URL("/worker/ncmc-worker.js", import.meta.url));
                worker.addEventListener(
                    "message",
                    (ev: MessageEvent<{ type: string; payload: any }>) => {
                        if (ev.data.type === "success") {
                            const dataArray = ev.data.payload;
                            const musicFile = new Blob([dataArray], {
                                type: detectMimeType(dataArray),
                            });
                            setAudioSrc(URL.createObjectURL(musicFile));
                        }
                        if (ev.data.type === "error") {
                            toastPubSub.pub({
                                type: "warning",
                                text: ev.data.payload,
                            });
                        }
                    },
                    { once: true },
                );

                worker.addEventListener(
                    "error",
                    (ev) => {
                        toastPubSub.pub({
                            type: "warning",
                            text: ev.message,
                        });
                        worker.terminate();
                    },
                    { once: true },
                );

                worker.postMessage(file);
                return;
            }

            // QMC 格式解密
            if (/\.qmc(?:flac|0|1|2|3)$/.test(file.name)) {
                const worker = new Worker(new URL("/worker/qmc-worker.js", import.meta.url));
                worker.addEventListener(
                    "message",
                    (ev: MessageEvent<{ type: string; payload: any }>) => {
                        if (ev.data.type === "success") {
                            const dataArray = ev.data.payload;
                            const musicFile = new Blob([dataArray], {
                                type: detectMimeType(dataArray),
                            });
                            setAudioSrc(URL.createObjectURL(musicFile));
                        }
                    },
                    { once: true },
                );

                worker.postMessage(file);
            }
        }
    } catch (err) {
    }
};
