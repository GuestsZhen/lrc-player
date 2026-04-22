/**
 * ExoPlayer 集成测试脚本
 * 用于验证 ExoPlayer 是否正常工作
 */

import { isAndroidNative } from './platform-detector.js';
import { ExoPlayerPlugin } from './exoplayer-plugin.js';
import { 
  pauseExoPlayer, 
  stopExoPlayer, 
  setExoPlayerSpeed,
  setExoPlayerPitch,
  getExoPlayerStatus,
  seekExoPlayerTo
} from './playback-control.js';

/**
 * 测试 ExoPlayer 基本功能
 */
export const testExoPlayer = async () => {

  // 1. 检查平台
  if (!isAndroidNative()) {

    return;
  }
  

  try {
    // 2. 初始化 ExoPlayer

    const initResult = await ExoPlayerPlugin.initialize();

    // 3. 获取初始状态

    const status = await getExoPlayerStatus();

    // 4. 测试速度设置

    await setExoPlayerSpeed(1.5);

    // 5. 测试音高设置

    await setExoPlayerPitch(1.2);

    // 6. 获取更新后的状态

    const updatedStatus = await getExoPlayerStatus();

    // 7. 重置速度和音高

    await setExoPlayerSpeed(1.0);
    await setExoPlayerPitch(1.0);

    // 8. 测试暂停（需要先有正在播放的内容）

    await pauseExoPlayer();

    // 9. 测试停止

    await stopExoPlayer();

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

/**
 * 测试 ExoPlayer 事件监听
 */
export const testExoPlayerEvents = async () => {

  if (!isAndroidNative()) {

    return;
  }
  
  try {
    // 监听播放状态变化

    await ExoPlayerPlugin.addListener('onPlaybackStateChanged', (event) => {

    });
    
    // 监听错误事件

    await ExoPlayerPlugin.addListener('onPlayerError', (event) => {
      console.error('📢 Player error:', event.error);
    });
    

  } catch (error) {
    console.error('❌ Failed to setup event listeners:', error);
  }
};

/**
 * 运行所有测试
 */
export const runAllTests = async () => {
  await testExoPlayer();

  await testExoPlayerEvents();
};

// 导出以便在控制台调用
(window as any).testExoPlayer = testExoPlayer;
(window as any).testExoPlayerEvents = testExoPlayerEvents;
(window as any).runAllExoPlayerTests = runAllTests;

