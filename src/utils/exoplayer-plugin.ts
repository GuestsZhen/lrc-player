/**
 * ExoPlayer Capacitor 插件封装
 * 用于在 Android 原生环境中播放音频
 */

import { registerPlugin } from '@capacitor/core';

/**
 * ExoPlayer 播放状态
 */
export type PlaybackState = 'IDLE' | 'BUFFERING' | 'READY' | 'ENDED' | 'UNKNOWN';

/**
 * ExoPlayer 状态信息
 */
export interface ExoPlayerStatus {
  isPlaying: boolean;
  isPaused: boolean;
  duration: number; // 毫秒
  currentPosition: number; // 毫秒
  playbackState: PlaybackState;
  speed: number;
  pitch: number;
}

/**
 * ExoPlayer 插件接口定义
 */
export interface ExoPlayerPlugin {
  /**
   * 初始化 ExoPlayer 实例
   */
  initialize(): Promise<{ success: boolean; message: string }>;
  
  /**
   * 加载并播放音频文件
   * @param options - 包含 uri (音频文件路径), title (歌曲名), artist (艺术家)
   */
  play(options: { uri: string; title?: string; artist?: string }): Promise<{ success: boolean; message: string }>;
  
  /**
   * 暂停播放
   */
  pause(): Promise<{ success: boolean; message: string }>;
  
  /**
   * 恢复播放（从暂停状态继续）
   */
  resume(): Promise<{ success: boolean; message: string }>;
  
  /**
   * 停止播放并释放资源
   */
  stop(): Promise<{ success: boolean; message: string }>;
  
  /**
   * 跳转到指定位置（毫秒）
   * @param options - 包含 position (毫秒)
   */
  seekTo(options: { position: number }): Promise<{ success: boolean; message: string }>;
  
  /**
   * 设置播放速度
   * @param options - 包含 speed (0.25 - 8.0)
   */
  setSpeed(options: { speed: number }): Promise<{ success: boolean; message: string }>;
  
  /**
   * 设置音高（音调）
   * @param options - 包含 pitch (0.5 - 2.0)，1.0 为原调
   */
  setPitch(options: { pitch: number }): Promise<{ success: boolean; message: string }>;
  
  /**
   * 获取当前播放状态
   */
  getStatus(): Promise<ExoPlayerStatus>;
  
  /**
   * 释放 ExoPlayer 资源
   */
  release(): Promise<{ success: boolean; message: string }>;
  
  /**
   * 启动后台播放服务
   */
  startBackgroundService(): Promise<{ success: boolean; message: string }>;
  
  /**
   * 停止后台播放服务
   */
  stopBackgroundService(): Promise<{ success: boolean; message: string }>;
  
  /**
   * ✅ 启用/禁用去人声功能（相位抵消法）
   * @param options - 包含 enabled (boolean)
   */
  setVocalRemoval(options: { enabled: boolean }): Promise<{ success: boolean; enabled: boolean; message: string }>;
  
  /**
   * ✅ 获取去人声状态
   */
  getVocalRemovalStatus(): Promise<{ enabled: boolean; available: boolean; stats?: string }>;
  
  /**
   * 添加事件监听器
   * @param eventName - 事件名称
   * @param listenerFunc - 回调函数
   */
  addListener(
    eventName: 'onPlaybackStateChanged',
    listenerFunc: (state: { state: PlaybackState }) => void
  ): Promise<void>;
  
  addListener(
    eventName: 'onPlayerError',
    listenerFunc: (error: { error: string }) => void
  ): Promise<void>;
  
  addListener(
    eventName: 'onTrackEnded',
    listenerFunc: () => void
  ): Promise<void>;
  
  /**
   * 监听状态更新事件（定期推送 duration 和 currentTime）
   */
  addListener(
    eventName: 'onStatusUpdate',
    listenerFunc: (status: { duration: number; currentTime: number; isPlaying: boolean }) => void
  ): Promise<void>;
  
  /**
   * 移除所有监听器
   */
  removeAllListeners(): Promise<void>;
}

// 注册插件
const ExoPlayerPlugin = registerPlugin<ExoPlayerPlugin>('ExoPlayerPlugin');

/**
 * 添加播放完成事件监听器
 * @param callback - 回调函数
 * @returns 取消监听的函数
 */
export const addTrackEndedListener = (
  callback: () => void
): Promise<void> => {
  return ExoPlayerPlugin.addListener('onTrackEnded', callback);
};

/**
 * 添加状态更新监听器（定期接收 duration 和 currentTime）
 * @param callback - 回调函数
 * @returns 清理函数
 */
export const addStatusUpdateListener = (
  callback: (status: { duration: number; currentTime: number; isPlaying: boolean }) => void
): (() => void) => {
  // Capacitor addListener 返回 Promise<PluginListenerHandle>
  let handle: { remove: () => void } | undefined;
  
  ExoPlayerPlugin.addListener('onStatusUpdate', callback).then((h) => {
    handle = h as any;
  });
  
  return () => {
    if (handle) {
      handle.remove();
    }
  };
};

/**
 * 启动后台播放服务
 */
export const startBackgroundService = async (): Promise<void> => {
  try {
    const result = await ExoPlayerPlugin.startBackgroundService();
  } catch (error) {
    throw error;
  }
};

/**
 * 停止后台播放服务
 */
export const stopBackgroundService = async (): Promise<void> => {
  try {
    const result = await ExoPlayerPlugin.stopBackgroundService();
  } catch (error) {
    throw error;
  }
};

/**
 * ✅ 启用/禁用去人声功能（相位抵消法）
 * @param enabled - 是否启用
 */
export const setVocalRemoval = async (enabled: boolean): Promise<{ success: boolean; enabled: boolean; message: string }> => {
  try {
    const result = await ExoPlayerPlugin.setVocalRemoval({ enabled });
    console.log('🎤 Vocal removal:', enabled ? 'ENABLED' : 'DISABLED');
    return result;
  } catch (error) {
    console.error('❌ Failed to set vocal removal:', error);
    throw error;
  }
};

/**
 * ✅ 获取去人声状态
 */
export const getVocalRemovalStatus = async (): Promise<{ enabled: boolean; available: boolean; stats?: string }> => {
  try {
    const status = await ExoPlayerPlugin.getVocalRemovalStatus();
    console.log('📊 Vocal removal status:', status);
    return status;
  } catch (error) {
    console.error('❌ Failed to get vocal removal status:', error);
    throw error;
  }
};

export { ExoPlayerPlugin };
