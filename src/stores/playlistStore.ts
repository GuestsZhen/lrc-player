/**
 * 播放列表状态管理 Store
 * 统一管理播放列表相关的状态和操作
 */
import { create } from 'zustand';
import type { ITrackInfo } from '../utils/playlist-manager.js';

interface PlaylistState {
    // 状态
    playlist: ITrackInfo[];
    currentTrackIndex: number;
    displayTrackName: string;
    showPlaylist: boolean;
    searchQuery: string;
    
    // Android MediaStore 临时数据（替代 window.__msTracks）
    msTracks: any[] | null;
    msCurrentIndex: number;
    
    // 操作
    setPlaylist: (playlist: ITrackInfo[]) => void;
    addTracks: (tracks: ITrackInfo[]) => void;
    removeTrack: (index: number) => void;
    setCurrentTrack: (index: number) => void;
    setDisplayTrackName: (name: string) => void;
    setSearchQuery: (query: string) => void;
    togglePlaylist: () => void;
    showPlaylistPanel: () => void;
    hidePlaylistPanel: () => void;
    clearPlaylist: () => void;
    
    // Android MediaStore 相关操作
    setMSTracks: (tracks: any[], currentIndex: number) => void;
    clearMSTracks: () => void;
}

export const usePlaylistStore = create<PlaylistState>((set, _get) => ({
    // 初始状态
    playlist: [],
    currentTrackIndex: -1,
    displayTrackName: '',
    showPlaylist: false,
    searchQuery: '',
    msTracks: null,
    msCurrentIndex: -1,
    
    // 播放列表操作
    setPlaylist: (playlist) => set({ playlist }),
    
    addTracks: (tracks) => set((state) => ({
        playlist: [...state.playlist, ...tracks]
    })),
    
    removeTrack: (index) => set((state) => {
        const newPlaylist = state.playlist.filter((_, i) => i !== index);
        let newIndex = state.currentTrackIndex;
        
        // 如果删除的是当前播放的歌曲，重置索引
        if (index === state.currentTrackIndex) {
            newIndex = -1;
        } else if (index < state.currentTrackIndex) {
            // 如果删除的歌曲在当前播放歌曲之前，调整索引
            newIndex = state.currentTrackIndex - 1;
        }
        
        return {
            playlist: newPlaylist,
            currentTrackIndex: newIndex
        };
    }),
    
    setCurrentTrack: (currentTrackIndex) => set({ currentTrackIndex }),
    setDisplayTrackName: (displayTrackName) => set({ displayTrackName }),
    setSearchQuery: (searchQuery) => set({ searchQuery }),
    
    togglePlaylist: () => set((state) => ({
        showPlaylist: !state.showPlaylist
    })),
    
    showPlaylistPanel: () => set({ showPlaylist: true }),
    hidePlaylistPanel: () => set({ showPlaylist: false }),
    
    clearPlaylist: () => set({
        playlist: [],
        currentTrackIndex: -1,
        displayTrackName: '',
        searchQuery: ''
    }),
    
    // Android MediaStore 操作
    setMSTracks: (msTracks, msCurrentIndex) => set({ 
        msTracks, 
        msCurrentIndex 
    }),
    
    clearMSTracks: () => set({ 
        msTracks: null, 
        msCurrentIndex: -1 
    }),
}));
