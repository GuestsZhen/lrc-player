import { useState, useEffect } from 'react';

interface PlatformInfo {
  isNative: boolean;
  platform: 'android' | 'ios' | 'web';
  isAndroid: boolean;
  isIOS: boolean;
  isWeb: boolean;
}

/**
 * 平台检测 Hook
 * 用于区分 Web、Android、iOS 环境
 */
export function usePlatform(): PlatformInfo {
  const [platformInfo, setPlatformInfo] = useState<PlatformInfo>({
    isNative: false,
    platform: 'web',
    isAndroid: false,
    isIOS: false,
    isWeb: true,
  });

  useEffect(() => {
    // 动态导入 Capacitor（仅在需要时）
    import('@capacitor/core').then(({ Capacitor }) => {
      const isNative = Capacitor.isNativePlatform();
      const platform = Capacitor.getPlatform() as 'android' | 'ios' | 'web';
      
      setPlatformInfo({
        isNative,
        platform,
        isAndroid: isNative && platform === 'android',
        isIOS: isNative && platform === 'ios',
        isWeb: !isNative || platform === 'web',
      });
    }).catch(() => {
      // Capacitor 未安装，默认为 Web
      setPlatformInfo({
        isNative: false,
        platform: 'web',
        isAndroid: false,
        isIOS: false,
        isWeb: true,
      });
    });
  }, []);

  return platformInfo;
}
