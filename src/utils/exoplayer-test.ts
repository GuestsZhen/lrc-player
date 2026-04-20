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
  console.log('=== ExoPlayer Integration Test ===');
  
  // 1. 检查平台
  if (!isAndroidNative()) {
    console.warn('⚠️  Not running on Android native. Skipping ExoPlayer tests.');
    return;
  }
  
  console.log('✅ Platform check passed: Android Native');
  
  try {
    // 2. 初始化 ExoPlayer
    console.log('📦 Initializing ExoPlayer...');
    const initResult = await ExoPlayerPlugin.initialize();
    console.log('✅ Initialize result:', initResult);
    
    // 3. 获取初始状态
    console.log('📊 Getting initial status...');
    const status = await getExoPlayerStatus();
    console.log('✅ Initial status:', status);
    
    // 4. 测试速度设置
    console.log('⚡ Testing speed control...');
    await setExoPlayerSpeed(1.5);
    console.log('✅ Speed set to 1.5x');
    
    // 5. 测试音高设置
    console.log('🎵 Testing pitch control...');
    await setExoPlayerPitch(1.2);
    console.log('✅ Pitch set to 1.2');
    
    // 6. 获取更新后的状态
    console.log('📊 Getting updated status...');
    const updatedStatus = await getExoPlayerStatus();
    console.log('✅ Updated status:', updatedStatus);
    console.log('   - Speed:', updatedStatus?.speed);
    console.log('   - Pitch:', updatedStatus?.pitch);
    
    // 7. 重置速度和音高
    console.log('🔄 Resetting speed and pitch...');
    await setExoPlayerSpeed(1.0);
    await setExoPlayerPitch(1.0);
    console.log('✅ Reset complete');
    
    // 8. 测试暂停（需要先有正在播放的内容）
    console.log('⏸️  Testing pause...');
    await pauseExoPlayer();
    console.log('✅ Pause command sent');
    
    // 9. 测试停止
    console.log('⏹️  Testing stop...');
    await stopExoPlayer();
    console.log('✅ Stop command sent');
    
    console.log('\n🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

/**
 * 测试 ExoPlayer 事件监听
 */
export const testExoPlayerEvents = async () => {
  console.log('=== ExoPlayer Event Listener Test ===');
  
  if (!isAndroidNative()) {
    console.warn('⚠️  Not running on Android native. Skipping event tests.');
    return;
  }
  
  try {
    // 监听播放状态变化
    console.log('👂 Setting up playback state listener...');
    await ExoPlayerPlugin.addListener('onPlaybackStateChanged', (event) => {
      console.log('📢 Playback state changed:', event.state);
    });
    
    // 监听错误事件
    console.log('👂 Setting up error listener...');
    await ExoPlayerPlugin.addListener('onPlayerError', (event) => {
      console.error('📢 Player error:', event.error);
    });
    
    console.log('✅ Event listeners registered');
    console.log('💡 Note: Events will be logged when playback state changes');
    
  } catch (error) {
    console.error('❌ Failed to setup event listeners:', error);
  }
};

/**
 * 运行所有测试
 */
export const runAllTests = async () => {
  await testExoPlayer();
  console.log('\n---\n');
  await testExoPlayerEvents();
};

// 导出以便在控制台调用
(window as any).testExoPlayer = testExoPlayer;
(window as any).testExoPlayerEvents = testExoPlayerEvents;
(window as any).runAllExoPlayerTests = runAllTests;

console.log('💡 ExoPlayer test functions available:');
console.log('   - window.testExoPlayer()');
console.log('   - window.testExoPlayerEvents()');
console.log('   - window.runAllExoPlayerTests()');
