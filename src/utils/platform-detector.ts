import { Capacitor } from '@capacitor/core';

export interface PlatformInfo {
  isNative: boolean;
  platform: 'android' | 'ios' | 'web';
  isAndroid: boolean;
  isIOS: boolean;
  isWeb: boolean;
}

/**
 * 获取当前平台信息
 */
export function getPlatformInfo(): PlatformInfo {
  const isNative = Capacitor.isNativePlatform();
  const platform = Capacitor.getPlatform() as 'android' | 'ios' | 'web';
  
  return {
    isNative,
    platform,
    isAndroid: isNative && platform === 'android',
    isIOS: isNative && platform === 'ios',
    isWeb: !isNative || platform === 'web',
  };
}

/**
 * 便捷函数：是否在 Android 原生环境
 */
export function isAndroidNative(): boolean {
  return getPlatformInfo().isAndroid;
}

/**
 * 便捷函数：是否在 Web 环境
 */
export function isWebEnvironment(): boolean {
  return getPlatformInfo().isWeb;
}
