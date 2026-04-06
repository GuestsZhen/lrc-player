declare module 'essentia.js' {
    interface EssentiaModule {
        new (wasm: any): any;
    }
    
    interface EssentiaWASM {
        (): Promise<any>;
    }
    
    export const Essentia: EssentiaModule;
    export const EssentiaWASM: EssentiaWASM;
    export const EssentiaModel: any;
    export const EssentiaExtractor: any;
    export const EssentiaPlot: any;
}
