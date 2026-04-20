/**
 * ExoPlayer 通知栏控制模块
 * 处理来自 Android 通知栏的播放控制事件
 */

/**
 * 初始化通知栏事件监听
 * 必须在应用启动时调用
 */
export const initializeNotificationControls = (): void => {
    console.log('🔧 ========== Initializing notification controls... ==========');
    
    // ✅ 测试：显示一个提示，确认函数被调用
    if (typeof window !== 'undefined') {
        console.log('✅ Window object exists');
        console.log('✅ Adding event listener for onNotificationAction');
    }
    
    // ✅ 使用 Capacitor 的 addListener 方法监听插件事件
    // 注意：这里我们需要通过 window 对象直接监听，因为 ExoPlayerPlugin 还没有导出
    window.addEventListener('onNotificationAction', (event: Event) => {
        const customEvent = event as CustomEvent<{ action: string; timestamp: number }>;
        const { action } = customEvent.detail;
        
        console.log('🎵 ========== onNotificationAction RECEIVED ==========');
        console.log('🔍 Action:', action);
        console.log('🔍 Timestamp:', customEvent.detail.timestamp);
        console.log('🔍 Event type:', event.type);
        
        switch (action) {
            case 'next':
                console.log('⏭️ Handling NEXT track action');
                handleNextTrack();
                break;
            case 'previous':
                console.log('⏮️ Handling PREVIOUS track action');
                handlePreviousTrack();
                break;
            default:
                console.warn('⚠️ Unknown notification action:', action);
        }
        
        console.log('🎵 ========== onNotificationAction HANDLED ==========');
    });
    
    console.log('✅ Notification controls initialized successfully');
};

/**
 * 处理下一曲事件
 */
const handleNextTrack = (): void => {
    console.log('⏭️ ========== handleNextTrack() START ==========');
    console.log('🔍 Dispatching next-track custom event');
    
    // ✅ 触发 footer.tsx 中的 onNextTrack 逻辑
    const nextTrackEvent = new CustomEvent('next-track', {
        detail: { source: 'notification', timestamp: Date.now() }
    });
    window.dispatchEvent(nextTrackEvent);
    
    console.log('✅ next-track event dispatched');
    console.log('⏭️ ========== handleNextTrack() END ==========');
};

/**
 * 处理上一曲事件
 */
const handlePreviousTrack = (): void => {
    console.log('⏮️ ========== handlePreviousTrack() START ==========');
    console.log('🔍 Dispatching previous-track custom event');
    
    // ✅ 触发 footer.tsx 中的 onPreviousTrack 逻辑
    const previousTrackEvent = new CustomEvent('previous-track', {
        detail: { source: 'notification', timestamp: Date.now() }
    });
    window.dispatchEvent(previousTrackEvent);
    
    console.log('✅ previous-track event dispatched');
    console.log('⏮️ ========== handlePreviousTrack() END ==========');
};
