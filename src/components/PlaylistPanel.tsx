/**
 * 播放列表面板组件
 * 负责播放列表的UI渲染和交互
 */
import { useMemo } from "react";
import type { ITrackInfo } from "../utils/playlist-manager.js";
import { CloseSVG, FolderSVG, SearchSVG, DeleteSVG } from "./svg.js";

interface IPlaylistPanelProps {
    playlist: ITrackInfo[];
    currentTrackIndex: number;
    showPlaylist: boolean;
    isHiding: boolean;
    isDragging: boolean;
    dragOffset: number;
    searchQuery: string;
    lang: any;
    
    // 回调函数
    onClose: () => void;
    onClear: () => void;
    onSearchChange: (query: string) => void;
    onPlayTrack: (track: ITrackInfo, index: number) => void;
    onOpenFile: () => void;
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: (e: React.TouchEvent) => void;
}

export const PlaylistPanel: React.FC<IPlaylistPanelProps> = ({
    playlist,
    currentTrackIndex,
    showPlaylist,
    isHiding,
    isDragging,
    dragOffset,
    searchQuery,
    lang,
    onClose,
    onClear,
    onSearchChange,
    onPlayTrack,
    onOpenFile,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
}) => {
    // 过滤播放列表
    const filteredPlaylist = useMemo(() => {
        if (!searchQuery.trim()) {
            return playlist;
        }
        
        const query = searchQuery.toLowerCase();
        return playlist.filter(track => 
            track.name.toLowerCase().includes(query) ||
            track.fileName.toLowerCase().includes(query)
        );
    }, [playlist, searchQuery]);

    return (
        <div 
            className={`playlist-panel${showPlaylist ? ' show' : ''}${isHiding ? ' hiding' : ''}${isDragging ? ' dragging' : ''}`}
            style={isDragging ? { transform: `translateY(${dragOffset}px)` } : undefined}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
        >
            {/* iOS 风格的拖拽手柄 */}
            <div className="playlist-drag-handle" onTouchStart={onTouchStart}>
                <div className="drag-handle-bar" />
            </div>
            
            <div className="playlist-header">
                <span>{lang.playlist.title} ({playlist.length}{lang.playlist.tracks})</span>
                <div className="playlist-header-actions">
                    <button 
                        className="clear-playlist-btn-icon"
                        onClick={onClear}
                        title={lang.playlist.clearPlaylist}
                        disabled={playlist.length === 0}
                    >
                        <DeleteSVG />
                    </button>
                    <button 
                        className="close-playlist-btn" 
                        title={lang.playlist.close}
                        onClick={onClose}
                    >
                        <CloseSVG />
                    </button>
                </div>
            </div>
            
            <div className="playlist-content">
                {playlist.length === 0 ? (
                    <div className="empty-playlist">
                        <p>{lang.playlist.noTracks}</p>
                        <button 
                            className="open-file-btn"
                            onClick={onOpenFile}
                        >
                            <FolderSVG />
                            <span>{lang.playlist.openFile}</span>
                        </button>
                    </div>
                ) : (
                    <ul className="playlist-items">
                        {filteredPlaylist.map((track) => {
                            // 找到原 playlist 中的索引
                            const originalIndex = playlist.findIndex(t => t.id === track.id);
                            return (
                                <li 
                                    key={track.id}
                                    className={`playlist-item ${originalIndex === currentTrackIndex ? 'playing' : ''}`}
                                    onClick={() => onPlayTrack(track, originalIndex)}
                                >
                                    <span className="track-name">{track.name}</span>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
            
            {/* 搜索和工具栏 - 移到底部 */}
            <div className="playlist-toolbar">
                <button 
                    className="toolbar-open-file-btn"
                    onClick={onOpenFile}
                    title={lang.playlist.openFile}
                >
                    <FolderSVG />
                </button>
                <div className="playlist-search">
                    <SearchSVG />
                    <input
                        type="text"
                        placeholder={lang.playlist.searchPlaceholder}
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="playlist-search-input"
                    />
                    {searchQuery && (
                        <button 
                            className="clear-search-btn"
                            onClick={() => onSearchChange('')}
                            title={lang.playlist.clearSearch}
                        >
                            <CloseSVG />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
