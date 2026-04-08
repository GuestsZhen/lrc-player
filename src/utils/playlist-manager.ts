// 播放列表曲目信息
export interface ITrackInfo {
    id: string;
    name: string;
    fileName: string;
    file?: File;
    lrcFile?: File;
}

const DB_NAME = 'MusicPlayerDB';
const DB_VERSION = 1;
const STORE_NAME = 'tracks';

class PlaylistManager {
    private db: IDBDatabase | null = null;
    private initPromise: Promise<void> | null = null;

    // 初始化数据库
    async init(): Promise<void> {
        if (this.db) {
            return Promise.resolve();
        }

        if (this.initPromise) {
            return this.initPromise;
        }

        this.initPromise = new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            
            request.onerror = () => {
                console.error('IndexedDB 打开失败');
                reject(request.error);
            };
            
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };
            
            request.onupgradeneeded = (event) => {
                const database = (event.target as IDBOpenDBRequest).result;
                
                if (!database.objectStoreNames.contains(STORE_NAME)) {
                    const store = database.createObjectStore(STORE_NAME, { keyPath: 'id' });
                    store.createIndex('name', 'name', { unique: false });
                    store.createIndex('fileName', 'fileName', { unique: false });
                }
            };
        });

        return this.initPromise;
    }

    // 确保数据库已初始化
    private async ensureInitialized(): Promise<void> {
        if (!this.db) {
            await this.init();
        }
    }

    // 保存音轨到数据库
    async saveTrack(track: ITrackInfo): Promise<void> {
        await this.ensureInitialized();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.put(track);
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    // 批量保存音轨
    async saveTracks(tracks: ITrackInfo[]): Promise<void> {
        for (const track of tracks) {
            await this.saveTrack(track);
        }
    }

    // 从数据库加载音轨
    async loadTrack(id: string): Promise<ITrackInfo | undefined> {
        await this.ensureInitialized();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get(id);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // 加载所有音轨
    async loadAllTracks(): Promise<ITrackInfo[]> {
        await this.ensureInitialized();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.getAll();
            
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    }

    // 删除音轨
    async deleteTrack(id: string): Promise<void> {
        await this.ensureInitialized();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.delete(id);
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    // 清空所有音轨
    async clearAllTracks(): Promise<void> {
        await this.ensureInitialized();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.clear();
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    // 关闭数据库
    close(): void {
        if (this.db) {
            this.db.close();
            this.db = null;
            this.initPromise = null;
        }
    }
}

// 导出单例
export const playlistManager = new PlaylistManager();
