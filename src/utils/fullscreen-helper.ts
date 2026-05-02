/**
 * 全屏切换工具函数
 * 兼容 iOS 和各种浏览器的全屏 API
 */

/**
 * 切换全屏模式
 * @param isCurrentlyFullscreen 当前是否处于全屏状态
 * @returns Promise<void>
 */
export const toggleFullscreen = async (isCurrentlyFullscreen: boolean): Promise<void> => {
    try {
        const element = document.documentElement;
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        
        if (!isCurrentlyFullscreen) {
            // 进入全屏
            if (isIOS) {
                // iOS 设备特殊处理
                if (element.requestFullscreen) {
                    try {
                        await element.requestFullscreen();
                        return;
                    } catch {
                        // 静默失败
                    }
                }
                
                // iOS 不支持，提示用户
                alert('iOS 浏览器限制：\n\n要获得最佳全屏体验，请：\n1. 点击分享按钮 📤\n2. 选择"添加到主屏幕"\n3. 从主屏幕打开应用');
                return;
            }
            
            // 非 iOS 设备
            if (element.requestFullscreen) {
                await element.requestFullscreen();
            } else if ((element as any).webkitRequestFullscreen) {
                await (element as any).webkitRequestFullscreen();
            } else if ((element as any).msRequestFullscreen) {
                await (element as any).msRequestFullscreen();
            }
        } else {
            // 退出全屏
            if (document.exitFullscreen) {
                await document.exitFullscreen();
            } else if ((document as any).webkitExitFullscreen) {
                await (document as any).webkitExitFullscreen();
            } else if ((document as any).msExitFullscreen) {
                await (document as any).msExitFullscreen();
            }
        }
    } catch (error) {
        // 全屏切换失败，静默处理
    }
};

/**
 * 获取当前全屏状态
 * @returns boolean 是否处于全屏状态
 */
export const getFullscreenStatus = (): boolean => {
    return !!(document.fullscreenElement || 
              (document as any).webkitFullscreenElement ||
              (document as any).msFullscreenElement);
};
