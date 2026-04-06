/**
 * 屏幕常亮管理器
 * 使用原生 Wake Lock API（iOS 不支持，会优雅降级）
 * 
 * 兼容性：
 * - ✅ Chrome/Edge 84+ (桌面 & Android)
 * - ✅ Firefox 126+
 * - ❌ iOS Safari/Chrome (不支持，自动禁用)
 */

class ScreenWakeLockManager {
    private wakeLock: WakeLockSentinel | null = null;
    private isVisible: boolean = true;
    private isSupported: boolean;

    constructor() {
        // 检查浏览器是否支持 Wake Lock API
        this.isSupported = 'wakeLock' in navigator;
        
        if (!this.isSupported) {
            console.log('[WakeLockManager] 浏览器不支持 Wake Lock API（iOS），屏幕常亮功能已禁用');
        }

        // 监听页面可见性变化
        document.addEventListener('visibilitychange', async () => {
            this.isVisible = document.visibilityState === 'visible';
            
            // 页面重新可见时，如果需要保持唤醒则重新请求
            if (this.isVisible && this.isSupported) {
                // 注意：request() 方法会检查是否需要重新激活
            }
        });
    }

    /**
     * 请求屏幕常亮
     * 必须在用户交互事件中调用（如点击、触摸）
     */
    async request(): Promise<void> {
        if (!this.isSupported) {
            // iOS 不支持，静默返回
            return;
        }

        try {
            if ('wakeLock' in navigator) {
                this.wakeLock = await navigator.wakeLock.request('screen');
                console.log('[WakeLockManager] 屏幕常亮已激活');

                // 监听自动释放事件
                this.wakeLock.addEventListener('release', () => {
                    console.log('[WakeLockManager] Wake Lock 已自动释放');
                    this.wakeLock = null;
                });
            }
        } catch (error) {
            console.error('[WakeLockManager] 请求屏幕常亮失败:', error);
        }
    }

    /**
     * 释放屏幕常亮
     */
    async release(): Promise<void> {
        if (!this.isSupported) {
            return;
        }

        try {
            if (this.wakeLock !== null) {
                await this.wakeLock.release();
                this.wakeLock = null;
                console.log('[WakeLockManager] 屏幕常亮已释放');
            }
        } catch (error) {
            console.error('[WakeLockManager] 释放屏幕常亮失败:', error);
        }
    }

    /**
     * 获取当前状态
     */
    isActive(): boolean {
        return this.wakeLock !== null && !this.wakeLock.released;
    }

    /**
     * 检查是否支持 Wake Lock
     */
    static isSupported(): boolean {
        return 'wakeLock' in navigator;
    }

    /**
     * 判断当前设备是否支持
     */
    isDeviceSupported(): boolean {
        return this.isSupported;
    }
}

// 导出单例
export const wakeLockManager = new ScreenWakeLockManager();
