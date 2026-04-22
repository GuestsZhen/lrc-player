/**
 * ExoPlayer 通知栏控制模块
 * 处理来自 Android 通知栏的播放控制事件
 */

/**
 * 初始化通知栏事件监听
 * 必须在应用启动时调用
 */
export const initializeNotificationControls = (): void => {

    // ✅ 测试：显示一个提示，确认函数被调用
    if (typeof window !== 'undefined') {

    }
    
    // ✅ 使用 Capacitor 的 addListener 方法监听插件事件
    // 注意：这里我们需要通过 window 对象直接监听，因为 ExoPlayerPlugin 还没有导出
    window.addEventListener('onNotificationAction', (event: Event) => {
        const customEvent = event as CustomEvent<{ action: string; timestamp: number }>;
        const { action } = customEvent.detail;
        

        switch (action) {
            case 'next':

                handleNextTrack();
                break;
            case 'previous':

                handlePreviousTrack();
                break;
            default:

        }
        

    });
    

};

/**
 * 处理下一曲事件
 */
const handleNextTrack = (): void => {

    // ✅ 触发 footer.tsx 中的 onNextTrack 逻辑
    const nextTrackEvent = new CustomEvent('next-track', {
        detail: { source: 'notification', timestamp: Date.now() }
    });
    window.dispatchEvent(nextTrackEvent);
    

};

/**
 * 处理上一曲事件
 */
const handlePreviousTrack = (): void => {

    // ✅ 触发 footer.tsx 中的 onPreviousTrack 逻辑
    const previousTrackEvent = new CustomEvent('previous-track', {
        detail: { source: 'notification', timestamp: Date.now() }
    });
    window.dispatchEvent(previousTrackEvent);
    

};
