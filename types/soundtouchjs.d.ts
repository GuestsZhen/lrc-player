declare module 'soundtouchjs' {
    export class PitchShifter {
        constructor(
            context: AudioContext,
            buffer: AudioBuffer,
            bufferSize: number,
            onEnd?: () => void
        );

        tempo: number;
        rate: number;
        pitch: number;
        pitchSemitones: number;
        duration: number;
        sampleRate: number;
        timePlayed: number;
        sourcePosition: number;

        readonly node: AudioNode;
        readonly formattedDuration: string;
        readonly formattedTimePlayed: string;
        readonly percentagePlayed: number;

        connect(toNode: AudioNode): void;
        disconnect(): void;
        play(): void;
        off(eventName?: string): void;
        on(eventName: string, cb: (detail: any) => void): void;
    }

    export class SoundTouch {
        pitch: number;
        pitchSemitones: number;
        rate: number;
        tempo: number;
    }

    export function getWebAudioNode(
        context: AudioContext,
        filter: any,
        onUpdate: (position: number) => void,
        bufferSize: number
    ): AudioNode;

    export class SimpleFilter {
        constructor(source: any, soundTouch: SoundTouch, onEnd?: () => void);
        sourcePosition: number;
    }

    export class WebAudioBufferSource {
        constructor(buffer: AudioBuffer);
    }

    export class AbstractFifoSamplePipe {
        // Base class
    }

    export class RateTransposer extends AbstractFifoSamplePipe {
        // Rate transposition
    }

    export class Stretch extends AbstractFifoSamplePipe {
        // Time stretching
    }
}
