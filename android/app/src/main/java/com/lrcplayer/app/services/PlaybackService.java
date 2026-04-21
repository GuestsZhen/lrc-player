package com.lrcplayer.app.services;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Intent;
import android.os.Build;
import android.os.PowerManager;
import android.util.Log;

import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;
import androidx.media3.session.MediaSessionService;

/**
 * 后台播放服务 - 简化的前台服务实现
 * 
 * 功能：
 * 1. 应用切换到后台时继续播放
 * 2. 锁屏后继续播放
 * 3. 通知栏显示（不包含播放控制）
 * 
 * 注意：
 * - 此服务不负责创建 ExoPlayer，ExoPlayer 由 ExoPlayerPlugin 管理
 * - 播放完成事件由 ExoPlayerPlugin 监听并通知 Web 层
 * - Web 层的 footer.tsx 已经实现了自动切换下一首的逻辑
 * - 此服务只负责保持前台运行，防止系统杀死进程
 */
public class PlaybackService extends MediaSessionService {
    private static final String TAG = "PlaybackService";
    private static final String CHANNEL_ID = "lrc_player_playback_channel";
    private static final int NOTIFICATION_ID = 1001;  // ✅ 与 ExoPlayerPlugin 保持一致
    private static final String WAKE_LOCK_TAG = "LRCPlayer:PlaybackWakeLock";
    
    private PowerManager.WakeLock wakeLock = null;
    
    @Override
    public void onCreate() {
        super.onCreate();
        Log.d(TAG, "=== Service onCreate ===");
        Log.d(TAG, "📱 Build.VERSION.SDK_INT: " + Build.VERSION.SDK_INT);
        Log.d(TAG, "📱 Package name: " + getPackageName());
        
        // 创建通知渠道（Android 8.0+）
        createNotificationChannel();
        
        // ✅ 获取 WakeLock，防止熄屏后 CPU 休眠
        acquireWakeLock();
        
        // ⚠️ Android 要求 startForegroundService() 启动的服务必须在 5 秒内调用 startForeground()
        // PlayerNotificationManager 会稍后更新这个通知为媒体控制通知
        Notification notification = buildSimpleNotification();
        startForeground(NOTIFICATION_ID, notification);
        Log.d(TAG, "✅ Foreground service started with simple notification (will be updated by PlayerNotificationManager)");
        Log.d(TAG, "=== Service onCreate Complete ===");
    }
    
    @Override
    public void onTaskRemoved(@Nullable Intent rootIntent) {
        Log.d(TAG, "=== onTaskRemoved ===");
        Log.d(TAG, "Task removed from recent apps");
        // 不主动停止服务，让系统根据前台服务规则处理
        Log.d(TAG, "=== onTaskRemoved End ===");
    }
    
    @Override
    public void onDestroy() {
        Log.d(TAG, "=== Service onDestroy ===");
        Log.d(TAG, "Reason: Service is being destroyed");
        
        // ✅ 释放 WakeLock
        releaseWakeLock();
        
        super.onDestroy();
        Log.d(TAG, "=== Service Destroyed ===");
    }
    
    @Nullable
    @Override
    public androidx.media3.session.MediaSession onGetSession(androidx.media3.session.MediaSession.ControllerInfo controllerInfo) {
        // ✅ 返回 ExoPlayerPlugin 的 MediaSession，让系统显示播放控制通知
        androidx.media3.session.MediaSession session = com.lrcplayer.app.plugins.ExoPlayerPlugin.getMediaSession();
        Log.d(TAG, "🔍🔍🔍 onGetSession called by: " + controllerInfo.getPackageName());
        Log.d(TAG, "🔍 MediaSession: " + (session != null ? "exists" : "null"));
        if (session != null) {
            Log.d(TAG, "🔍 Session player: " + session.getPlayer());
            Log.d(TAG, "🔍 Session playbackState: " + session.getPlayer().getPlaybackState());
            Log.d(TAG, "🔍 Session currentMediaItem: " + session.getPlayer().getCurrentMediaItem());
            if (session.getPlayer().getCurrentMediaItem() != null) {
                Log.d(TAG, "🔍 Song title: " + session.getPlayer().getCurrentMediaItem().mediaMetadata.title);
            }
            
            // ✅ 当 MediaSession 可用时，更新通知以包含媒体控制
            updateNotificationWithMediaControls(session);
        } else {
            Log.e(TAG, "❌❌❌ MediaSession is NULL - notification controls will NOT appear!");
        }
        return session;
    }
    
    /**
     * ✅ 当 MediaSession 可用时，更新通知
     */
    private void updateNotificationWithMediaControls(androidx.media3.session.MediaSession session) {
        Log.d(TAG, "🔄 Updating notification with MediaSession controls...");
        
        // MediaSession 会自动管理通知，我们只需要确保服务处于前台状态
        // Media3 的 MediaSessionService 会自动处理通知更新
        Log.d(TAG, "✅ MediaSessionService will automatically manage notification via MediaSession");
    }
    
    /**
     * 创建通知渠道（Android 8.0+ 必需）
     */
    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "LRC Player Playback",
                NotificationManager.IMPORTANCE_LOW  // 低优先级，不干扰用户
            );
            channel.setDescription("Media playback controls");
            channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
            
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
                Log.d(TAG, "Notification channel created: " + CHANNEL_ID);
            }
        }
    }
    
    /**
     * 构建简单通知（当前实现）
     * ⚠️ 注意：要获得完整的媒体控制（播放按钮、进度条等），需要使用 DefaultMediaNotificationProvider
     */
    private Notification buildSimpleNotification() {
        Log.d(TAG, "🔨 Building simple notification...");
        
        // ✅ 创建点击通知时的 Intent（打开应用）
        Intent openAppIntent = getPackageManager().getLaunchIntentForPackage(getPackageName());
        PendingIntent openAppPendingIntent = PendingIntent.getActivity(
            this,
            0,
            openAppIntent,
            PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT
        );
        
        // ✅ 构建简单通知
        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("LRC Player")
            .setContentText("Playing music")
            .setSmallIcon(android.R.drawable.ic_media_play)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setOngoing(true)
            .setShowWhen(false)
            .setContentIntent(openAppPendingIntent);
        
        Log.d(TAG, "🔨 Simple notification built");
        return builder.build();
    }
    
    private void acquireWakeLock() {
        if (wakeLock == null) {
            PowerManager powerManager = (PowerManager) getSystemService(POWER_SERVICE);
            if (powerManager != null) {
                // PARTIAL_WAKE_LOCK: 保持 CPU 运行，但允许屏幕关闭
                wakeLock = powerManager.newWakeLock(
                    PowerManager.PARTIAL_WAKE_LOCK,
                    WAKE_LOCK_TAG
                );
                wakeLock.setReferenceCounted(false);  // 不使用引用计数
                wakeLock.acquire(10 * 60 * 1000L);  // 最多持有 10 分钟
                Log.d(TAG, "✅ WakeLock acquired (PARTIAL_WAKE_LOCK)");
            } else {
                Log.e(TAG, "❌ Failed to get PowerManager");
            }
        }
    }
    
    /**
     * 释放 WakeLock
     */
    private void releaseWakeLock() {
        if (wakeLock != null && wakeLock.isHeld()) {
            wakeLock.release();
            wakeLock = null;
            Log.d(TAG, "✅ WakeLock released");
        }
    }
}
