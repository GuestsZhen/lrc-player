package com.lrcplayer.app.plugins;

import android.Manifest;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.util.Log;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import androidx.media3.common.MediaItem;
import androidx.media3.common.MediaMetadata;
import androidx.media3.common.PlaybackException;
import androidx.media3.common.Player;
import androidx.media3.common.ForwardingPlayer;
import androidx.media3.exoplayer.ExoPlayer;
import androidx.media3.session.MediaSession;
import androidx.media3.ui.PlayerNotificationManager;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Context;
import android.graphics.Bitmap;
import android.os.Build;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.lrcplayer.app.services.PlaybackService;

/**
 * ExoPlayer 音频播放插件
 * 用于在 Android 原生环境中播放音频文件
 */
@CapacitorPlugin(name = "ExoPlayerPlugin")
public class ExoPlayerPlugin extends Plugin {
    
    private static final String TAG = "ExoPlayerPlugin";
    
    private ExoPlayer exoPlayer;
    private ForwardingPlayer forwardingPlayer;  // ✅ 用于拦截上一曲/下一曲事件
    private static MediaSession mediaSession;  // ✅ 静态 MediaSession，供 PlaybackService 使用
    private PlayerNotificationManager notificationManager;  // ✅ 通知管理器
    private boolean isInitialized = false;
    private android.os.Handler statusUpdateHandler;
    private Runnable statusUpdateRunnable;
    private static int sessionCounter = 0;  // ✅ 用于生成唯一的 Session ID
    
    // ✅ 通知渠道配置
    private static final String NOTIFICATION_CHANNEL_ID = "lrc_player_channel";
    private static final String NOTIFICATION_CHANNEL_NAME = "LRC Player Controls";
    private static final int NOTIFICATION_ID = 1001;
    
    /**
     * ✅ 静态方法：获取 MediaSession（供 PlaybackService 使用）
     */
    public static MediaSession getMediaSession() {
        return mediaSession;
    }
    
    @Override
    public void load() {
        super.load();

    }
    
    /**
     * 初始化 ExoPlayer 实例
     */
    @PluginMethod
    public void initialize(PluginCall call) {
        // ✅ 必须在主线程执行 ExoPlayer 操作
        getActivity().runOnUiThread(() -> {
            try {
                // ✅ 检查并请求通知权限（Android 13+）
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                    if (ContextCompat.checkSelfPermission(getContext(), Manifest.permission.POST_NOTIFICATIONS) 
                            != PackageManager.PERMISSION_GRANTED) {

                        // ✅ 直接在主线程请求权限
                        ActivityCompat.requestPermissions(
                            getActivity(),
                            new String[]{Manifest.permission.POST_NOTIFICATIONS},
                            1001  // 请求码
                        );
                        
                        // ✅ 保存调用，等待权限结果
                        saveCall(call);
                        return;
                    }
                }
                
                // 继续初始化 ExoPlayer
                initializeExoPlayer(call);
            } catch (Exception e) {
                Log.e(TAG, "Failed to initialize ExoPlayer", e);
                call.reject("Failed to initialize: " + e.getMessage());
            }
        });
    }
    
    /**
     * ✅ 实际初始化 ExoPlayer 的逻辑
     */
    private void initializeExoPlayer(PluginCall call) {
        try {
            if (exoPlayer != null) {
                // 已经初始化，直接返回
                JSObject result = new JSObject();
                result.put("success", true);
                result.put("message", "Already initialized");
                call.resolve(result);
                return;
            }
            
            Context context = getContext();
            
            // 创建 ExoPlayer
            exoPlayer = new ExoPlayer.Builder(context).build();

            // ✅ 创建 ForwardingPlayer 包装 ExoPlayer，拦截上一曲/下一曲事件
            forwardingPlayer = new ForwardingPlayer(exoPlayer) {
                @Override
                public void seekToNext() {

                    playNextTrack();
                }
                
                @Override
                public void seekToPrevious() {

                    playPreviousTrack();
                }
                
                @Override
                public void seekToNextMediaItem() {

                    playNextTrack();
                }
                
                @Override
                public void seekToPreviousMediaItem() {

                    playPreviousTrack();
                }
                
                // ✅ 处理快进（通知栏按钮触发）
                @Override
                public void seekForward() {
                    long currentPosition = exoPlayer.getCurrentPosition();
                    long duration = exoPlayer.getDuration();
                    long newPosition = Math.min(currentPosition + 10000, duration);  // 快进 10 秒

                    exoPlayer.seekTo(newPosition);
                }
                
                // ✅ 处理快退（通知栏按钮触发）
                @Override
                public void seekBack() {
                    long currentPosition = exoPlayer.getCurrentPosition();
                    long newPosition = Math.max(currentPosition - 10000, 0);  // 快退 10 秒

                    exoPlayer.seekTo(newPosition);
                }
                
                // ✅ 关键修复：强制返回包含所有导航命令的 Commands 对象
                // PlayerNotificationManager 会检查 getAvailableCommands() 来决定是否显示按钮
                @Override
                public androidx.media3.common.Player.Commands getAvailableCommands() {
                    androidx.media3.common.Player.Commands originalCommands = super.getAvailableCommands();
                    
                    // ✅ 强制添加所有导航命令，即使队列只有一个 MediaItem
                    return originalCommands.buildUpon()
                        .add(Player.COMMAND_SEEK_TO_NEXT)
                        .add(Player.COMMAND_SEEK_TO_PREVIOUS)
                        .add(Player.COMMAND_SEEK_TO_NEXT_MEDIA_ITEM)
                        .add(Player.COMMAND_SEEK_TO_PREVIOUS_MEDIA_ITEM)
                        .add(Player.COMMAND_SEEK_FORWARD)
                        .add(Player.COMMAND_SEEK_BACK)
                        .build();
                }
            };

            // ✅ 释放旧的 MediaSession（如果存在）
            if (mediaSession != null) {

                mediaSession.release();
                mediaSession = null;
            }
            
            // ✅ 创建点击通知时打开应用的 PendingIntent
            Intent sessionIntent = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
            PendingIntent sessionPendingIntent = PendingIntent.getActivity(
                context,
                0,
                sessionIntent,
                PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT
            );
            
            // ✅ 创建 MediaSession，关联到 ForwardingPlayer（使用唯一 ID）
            String sessionId = "LRCPlayer_" + System.currentTimeMillis() + "_" + (++sessionCounter);
            mediaSession = new MediaSession.Builder(context, forwardingPlayer)
                .setId(sessionId)  // ✅ 设置唯一的 Session ID
                .setSessionActivity(sessionPendingIntent)  // 点击通知打开应用
                .build();

            // ✅ 创建通知渠道（Android 8.0+）
            createNotificationChannel(context);
            
            // ✅ 初始化 PlayerNotificationManager
            initializeNotificationManager(context);
            
            // 添加播放器监听器
            exoPlayer.addListener(new Player.Listener() {
                @Override
                public void onPlaybackStateChanged(int playbackState) {
                    String stateStr = getStateString(playbackState);

                    JSObject event = new JSObject();
                    event.put("state", stateStr);
                    notifyListeners("onPlaybackStateChanged", event);
                    
                    // ✅ 当播放器准备就绪时，启动状态更新
                    if (playbackState == Player.STATE_READY) {

                        startStatusUpdates();
                    }
                    
                    // ✅ 处理播放完成事件
                    if (playbackState == Player.STATE_ENDED) {

                        JSObject endedEvent = new JSObject();
                        endedEvent.put("type", "ended");
                        endedEvent.put("timestamp", System.currentTimeMillis());
                        
                        try {
                            notifyListeners("onTrackEnded", endedEvent);

                        } catch (Exception e) {
                            Log.e(TAG, "❌❌❌ Failed to dispatch onTrackEnded event", e);
                        }
                        
                        // 播放完成后停止状态更新
                        stopStatusUpdates();
                    }
                    
                    // ✅ 当播放器空闲或缓冲时，停止状态更新
                    if (playbackState == Player.STATE_IDLE || playbackState == Player.STATE_BUFFERING) {

                        stopStatusUpdates();
                    }
                }
                
                @Override
                public void onPlayerError(PlaybackException error) {
                    JSObject event = new JSObject();
                    event.put("error", error.getMessage());
                    notifyListeners("onPlayerError", event);
                    Log.e(TAG, "Player error: " + error.getMessage());
                }
            });
            
            isInitialized = true;
            
            JSObject result = new JSObject();
            result.put("success", true);
            result.put("message", "ExoPlayer initialized successfully");
            call.resolve(result);
            

        } catch (Exception e) {
            Log.e(TAG, "Failed to initialize ExoPlayer", e);
            call.reject("Failed to initialize: " + e.getMessage());
        }
    }
    
    /**
     * 加载并播放音频文件
     * @param call - 包含 uri (音频文件路径)
     */
    @PluginMethod
    public void play(PluginCall call) {
        // ✅ 必须在主线程执行 ExoPlayer 操作
        getActivity().runOnUiThread(() -> {
            try {
                if (!isInitialized || exoPlayer == null) {
                    Log.e(TAG, "❌ ExoPlayer not initialized");
                    call.reject("ExoPlayer not initialized. Call initialize() first.");
                    return;
                }
                
                String uri = call.getString("uri");
                if (uri == null || uri.isEmpty()) {
                    Log.e(TAG, "❌ URI is empty");
                    call.reject("URI is required");
                    return;
                }
                
                // ✅ 获取歌曲名字用于通知栏显示
                String title = call.getString("title", "Unknown Title");
                String artist = call.getString("artist", "Unknown Artist");
                            

                // 构建 MediaItem 并设置元数据（用于通知栏显示歌曲名）
                MediaItem mediaItem = new MediaItem.Builder()
                    .setUri(Uri.parse(uri))
                    .setMediaMetadata(new MediaMetadata.Builder()
                        .setTitle(title)
                        .setArtist(artist)
                        .setAlbumArtist(artist)
                        .build())
                    .build();
                            
                // 设置媒体项
                exoPlayer.setMediaItem(mediaItem);
                
                // 准备播放器
                exoPlayer.prepare();
                
                // ✅ 等待播放器准备好后，通过 ExoPlayer 自动更新 MediaSession 元数据
                // Media3 会自动从 MediaItem 的 MediaMetadata 同步到 MediaSession
                // 我们只需要确保 MediaItem 包含 duration 信息
                Player.Listener metadataListener = new Player.Listener() {
                    @Override
                    public void onPlaybackStateChanged(int playbackState) {
                        if (playbackState == Player.STATE_READY) {
                            long duration = exoPlayer.getDuration();

                            // ✅ 更新当前 MediaItem 的元数据，添加时长
                            MediaItem currentItem = exoPlayer.getCurrentMediaItem();
                            if (currentItem != null) {
                                MediaItem updatedItem = currentItem.buildUpon()
                                    .setMediaMetadata(currentItem.mediaMetadata.buildUpon()
                                        .setDurationMs(duration)  // ✅ 关键：设置时长，启用进度条
                                        .build())
                                    .build();
                                
                                // 替换当前媒体项（保持播放位置）
                                int currentIndex = exoPlayer.getCurrentMediaItemIndex();
                                exoPlayer.replaceMediaItem(currentIndex, updatedItem);
                                

                            }
                            
                            // 移除这个一次性监听器
                            exoPlayer.removeListener(this);
                        }
                    }
                };
                exoPlayer.addListener(metadataListener);
                
                // 开始播放（使用 ForwardingPlayer）
                forwardingPlayer.setPlayWhenReady(true);
                
                // ✅ Media3 MediaSession 会在播放时自动激活

                // ✅ 状态更新将在 onPlaybackStateChanged(STATE_READY) 中启动
                
                JSObject result = new JSObject();
                result.put("success", true);
                result.put("message", "Playing started");
                call.resolve(result);
                

            } catch (Exception e) {
                Log.e(TAG, "❌ Failed to play", e);
                call.reject("Failed to play: " + e.getMessage());
            }
        });
    }
    
    /**
     * 暂停播放
     */
    @PluginMethod
    public void pause(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            if (!isInitialized || exoPlayer == null) {
                call.reject("ExoPlayer not initialized");
                return;
            }
            
            forwardingPlayer.setPlayWhenReady(false);
            
            // ✅ 更新 MediaSession 状态
            if (mediaSession != null) {

            }
            
            JSObject result = new JSObject();
            result.put("success", true);
            result.put("message", "Paused");
            call.resolve(result);
            

        });
    }
    
    /**
     * 恢复播放（从暂停状态继续）
     */
    @PluginMethod
    public void resume(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            if (!isInitialized || exoPlayer == null) {
                call.reject("ExoPlayer not initialized");
                return;
            }
            
            forwardingPlayer.setPlayWhenReady(true);
            
            JSObject result = new JSObject();
            result.put("success", true);
            result.put("message", "Resumed");
            call.resolve(result);
            

        });
    }
    
    /**
     * 停止播放并释放资源
     */
    @PluginMethod
    public void stop(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            if (!isInitialized || exoPlayer == null) {
                call.reject("ExoPlayer not initialized");
                return;
            }
            
            exoPlayer.stop();
            exoPlayer.clearMediaItems();
            
            JSObject result = new JSObject();
            result.put("success", true);
            result.put("message", "Stopped");
            call.resolve(result);
            

        });
    }
    
    /**
     * 跳转到指定位置（毫秒）
     * @param call - 包含 position (毫秒)
     */
    @PluginMethod
    public void seekTo(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            if (!isInitialized || exoPlayer == null) {
                call.reject("ExoPlayer not initialized");
                return;
            }
            
            Double positionDouble = call.getDouble("position");
            if (positionDouble == null) {
                call.reject("Position is required");
                return;
            }
            
            long position = positionDouble.longValue();
            exoPlayer.seekTo(position);
            
            JSObject result = new JSObject();
            result.put("success", true);
            result.put("message", "Seeked to " + position + "ms");
            call.resolve(result);
            

        });
    }
    
    /**
     * 设置播放速度
     * @param call - 包含 speed (0.5 - 2.0)
     */
    @PluginMethod
    public void setSpeed(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            if (!isInitialized || exoPlayer == null) {
                call.reject("ExoPlayer not initialized");
                return;
            }
            
            Float speed = call.getFloat("speed");
            if (speed == null || speed <= 0) {
                call.reject("Invalid speed value");
                return;
            }
            
            speed = Math.max(0.25f, Math.min(8.0f, speed));
            forwardingPlayer.setPlaybackSpeed(speed);
            
            JSObject result = new JSObject();
            result.put("success", true);
            result.put("message", "Speed set to " + speed);
            call.resolve(result);
            

        });
    }
    
    /**
     * 设置音高（音调）
     * @param call - 包含 pitch (0.5 - 2.0)，1.0 为原调
     */
    @PluginMethod
    public void setPitch(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            if (!isInitialized || exoPlayer == null) {
                call.reject("ExoPlayer not initialized");
                return;
            }
            
            Float pitch = call.getFloat("pitch");
            if (pitch == null || pitch < 0.5f || pitch > 2.0f) {
                call.reject("Invalid pitch value. Must be between 0.5 and 2.0");
                return;
            }
            
            float currentSpeed = forwardingPlayer.getPlaybackParameters().speed;
            androidx.media3.common.PlaybackParameters params = 
                new androidx.media3.common.PlaybackParameters(currentSpeed, pitch);
            forwardingPlayer.setPlaybackParameters(params);
            
            JSObject result = new JSObject();
            result.put("success", true);
            result.put("message", "Pitch set to " + pitch);
            call.resolve(result);
            

        });
    }
    
    /**
     * 获取当前播放状态
     */
    @PluginMethod
    public void getStatus(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            if (!isInitialized || exoPlayer == null) {
                call.reject("ExoPlayer not initialized");
                return;
            }
            
            JSObject result = new JSObject();
            result.put("isPlaying", forwardingPlayer.isPlaying());
            result.put("isPaused", !forwardingPlayer.getPlayWhenReady());
            result.put("duration", exoPlayer.getDuration());
            result.put("currentPosition", exoPlayer.getCurrentPosition());
            result.put("playbackState", getStateString(exoPlayer.getPlaybackState()));
            result.put("speed", forwardingPlayer.getPlaybackParameters().speed);
            result.put("pitch", forwardingPlayer.getPlaybackParameters().pitch);
            
            call.resolve(result);
        });
    }
    
    /**
     * 释放 ExoPlayer 资源
     */
    @PluginMethod
    public void release(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            if (exoPlayer != null) {
                exoPlayer.release();
                exoPlayer = null;
                isInitialized = false;

            }
            
            JSObject result = new JSObject();
            result.put("success", true);
            result.put("message", "Released");
            call.resolve(result);
        });
    }
    
    /**
     * 将播放状态转换为字符串
     */
    private String getStateString(int state) {
        switch (state) {
            case Player.STATE_IDLE:
                return "IDLE";
            case Player.STATE_BUFFERING:
                return "BUFFERING";
            case Player.STATE_READY:
                return "READY";
            case Player.STATE_ENDED:
                return "ENDED";
            default:
                return "UNKNOWN";
        }
    }
    
    /**
     * ✅ 启动定期状态更新（每 100ms 推送一次）
     */
    private void startStatusUpdates() {
        if (statusUpdateHandler != null) {
            // 已经启动，无需重复
            return;
        }
        
        // ✅ 在 CapacitorPlugins 线程中创建 Handler（与 ExoPlayer 同一线程）
        statusUpdateHandler = new android.os.Handler(android.os.Looper.myLooper());
        statusUpdateRunnable = new Runnable() {
            @Override
            public void run() {
                if (exoPlayer != null && isInitialized) {
                    try {
                        JSObject status = new JSObject();
                        status.put("duration", exoPlayer.getDuration());
                        status.put("currentTime", exoPlayer.getCurrentPosition());
                        status.put("isPlaying", forwardingPlayer.isPlaying());
                        notifyListeners("onStatusUpdate", status);
                    } catch (Exception e) {
                        Log.e(TAG, "Error getting status", e);
                    }
                }
                
                // 继续下一次更新
                if (statusUpdateHandler != null) {
                    statusUpdateHandler.postDelayed(this, 100);
                }
            }
        };
        
        statusUpdateHandler.post(statusUpdateRunnable);

    }
    
    /**
     * ✅ 停止定期状态更新
     */
    private void stopStatusUpdates() {
        if (statusUpdateHandler != null && statusUpdateRunnable != null) {
            statusUpdateHandler.removeCallbacks(statusUpdateRunnable);
            statusUpdateHandler = null;
            statusUpdateRunnable = null;

        }
    }
    
    @Override
    protected void handleOnDestroy() {
        super.handleOnDestroy();
        
        // ✅ 停止状态更新
        stopStatusUpdates();
        
        if (exoPlayer != null) {
            exoPlayer.release();
            exoPlayer = null;
            forwardingPlayer = null;  // ✅ 释放 ForwardingPlayer
            isInitialized = false;

        }
    }
    
    /**
     * 启动后台播放服务
     */
    @PluginMethod
    public void startBackgroundService(PluginCall call) {
        try {
            Context context = getContext();
            Intent serviceIntent = new Intent(context, PlaybackService.class);
            
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(serviceIntent);

            } else {
                context.startService(serviceIntent);

            }
            
            JSObject result = new JSObject();
            result.put("success", true);
            result.put("message", "Background service started");
            call.resolve(result);
        } catch (Exception e) {
            Log.e(TAG, "Failed to start background service", e);
            JSObject error = new JSObject();
            error.put("success", false);
            error.put("message", "Failed to start service: " + e.getMessage());
            call.resolve(error);
        }
    }
    
    /**
     * 停止后台播放服务
     */
    @PluginMethod
    public void stopBackgroundService(PluginCall call) {
        try {
            Context context = getContext();
            Intent serviceIntent = new Intent(context, PlaybackService.class);
            context.stopService(serviceIntent);
            

            JSObject result = new JSObject();
            result.put("success", true);
            result.put("message", "Background service stopped");
            call.resolve(result);
        } catch (Exception e) {
            Log.e(TAG, "Failed to stop background service", e);
            JSObject error = new JSObject();
            error.put("success", false);
            error.put("message", "Failed to stop service: " + e.getMessage());
            call.resolve(error);
        }
    }
    
    /**
     * ✅ 播放下一曲（由通知栏按钮触发）
     * 这个方法会被 MediaSession 自动调用，无需 Web 层直接调用
     */
    private void playNextTrack() {

        // ✅ 通过 WebView 执行 JavaScript 触发自定义事件
        String jsCode = "window.dispatchEvent(new CustomEvent('onNotificationAction', {" +
                       "detail: { action: 'next', timestamp: " + System.currentTimeMillis() + " }" +
                       "}));";
        

        getActivity().runOnUiThread(() -> {
            bridge.getWebView().evaluateJavascript(jsCode, null);

        });
        

    }
    
    /**
     * ✅ 播放上一曲（由通知栏按钮触发）
     * 这个方法会被 MediaSession 自动调用，无需 Web 层直接调用
     */
    private void playPreviousTrack() {

        // ✅ 通过 WebView 执行 JavaScript 触发自定义事件
        String jsCode = "window.dispatchEvent(new CustomEvent('onNotificationAction', {" +
                       "detail: { action: 'previous', timestamp: " + System.currentTimeMillis() + " }" +
                       "}));";
        

        getActivity().runOnUiThread(() -> {
            bridge.getWebView().evaluateJavascript(jsCode, null);

        });
        

    }
    
    /**
     * ✅ 处理权限请求回调
     */
    @Override
    protected void handleRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.handleRequestPermissionsResult(requestCode, permissions, grantResults);
        
        if (requestCode == 1001) {  // POST_NOTIFICATIONS 权限请求
            PluginCall savedCall = getSavedCall();
            if (savedCall == null) {

                return;
            }
            
            boolean granted = grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED;

            // ✅ 在主线程继续初始化
            getActivity().runOnUiThread(() -> {
                try {
                    initializeExoPlayer(savedCall);
                } catch (Exception e) {
                    Log.e(TAG, "Failed to initialize ExoPlayer after permission", e);
                    savedCall.reject("Failed to initialize: " + e.getMessage());
                }
            });
        }
    }
    
    /**
     * ✅ Android 12及以下：手动更新通知以显示进度条
     * 通过 setUsesChronometer 和 setWhen 实现计时器效果
     */
    private void updateNotificationWithProgress(int notificationId) {
        if (exoPlayer == null || !isInitialized) {
            return;
        }
        
        try {
            long duration = exoPlayer.getDuration();
            long currentPosition = exoPlayer.getCurrentPosition();
            
            // ✅ 只有当有有效时长时才更新
            if (duration <= 0) {

                return;
            }
            
            // ✅ 计算已播放时间（用于 chronometer）
            long elapsedTime = System.currentTimeMillis() - currentPosition;
            

            // ✅ 注意：PlayerNotificationManager 会自动管理通知更新
            // 在 Android 12及以下，进度条由 MediaSession 的 PlaybackState 控制
            // 我们只需要确保 MediaSession 正确设置了 ACTION_SEEK_TO
            
        } catch (Exception e) {
            Log.e(TAG, "❌ Failed to update notification with progress", e);
        }
    }
    
    /**
     * ✅ 创建通知渠道（Android 8.0+）
     */
    private void createNotificationChannel(Context context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                NOTIFICATION_CHANNEL_ID,
                NOTIFICATION_CHANNEL_NAME,
                NotificationManager.IMPORTANCE_LOW  // 低重要性，避免打扰用户
            );
            channel.setDescription("Controls for LRC Player audio playback");
            channel.setLockscreenVisibility(android.app.Notification.VISIBILITY_PUBLIC);  // 锁屏可见
            
            NotificationManager notificationManager = context.getSystemService(NotificationManager.class);
            notificationManager.createNotificationChannel(channel);
            

        }
    }
    
    /**
     * ✅ 初始化 PlayerNotificationManager
     */
    private void initializeNotificationManager(Context context) {
        try {
            // ✅ 使用 Builder 模式创建通知管理器
            notificationManager = new PlayerNotificationManager.Builder(
                context,
                NOTIFICATION_ID,
                NOTIFICATION_CHANNEL_ID
            )
            .setMediaDescriptionAdapter(new PlayerNotificationManager.MediaDescriptionAdapter() {
                @Override
                public CharSequence getCurrentContentTitle(Player player) {
                    // ✅ 返回歌曲标题
                    if (player.getCurrentMediaItem() != null && 
                        player.getCurrentMediaItem().mediaMetadata.title != null) {
                        return player.getCurrentMediaItem().mediaMetadata.title;
                    }
                    return "Unknown Title";
                }
                
                @Override
                public PendingIntent createCurrentContentIntent(Player player) {
                    // ✅ 点击通知时打开应用
                    Intent intent = context.getPackageManager()
                        .getLaunchIntentForPackage(context.getPackageName());
                    return PendingIntent.getActivity(
                        context,
                        0,
                        intent,
                        PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT
                    );
                }
                
                @Override
                public CharSequence getCurrentContentText(Player player) {
                    // ✅ 返回艺术家名称
                    if (player.getCurrentMediaItem() != null && 
                        player.getCurrentMediaItem().mediaMetadata.artist != null) {
                        return player.getCurrentMediaItem().mediaMetadata.artist;
                    }
                    return "Unknown Artist";
                }
                
                @Override
                public Bitmap getCurrentLargeIcon(Player player, PlayerNotificationManager.BitmapCallback callback) {
                    // ✅ 暂时返回 null，后续可以添加专辑封面支持
                    // TODO: 加载专辑封面图片
                    return null;
                }
            })
            .setNotificationListener(new PlayerNotificationManager.NotificationListener() {
                @Override
                public void onNotificationPosted(int notificationId, android.app.Notification notification, boolean ongoing) {

                    if (notification.actions != null) {
                        for (int i = 0; i < notification.actions.length; i++) {

                        }
                    }
                    
                    // ✅ 手动添加进度条到通知
                    if (exoPlayer != null && isInitialized) {
                        long duration = exoPlayer.getDuration();
                        long currentPosition = exoPlayer.getCurrentPosition();
                        
                        if (duration > 0) {

                            try {
                                // 复制原有的 notification 并添加进度条
                                androidx.core.app.NotificationCompat.Builder builder = 
                                    new androidx.core.app.NotificationCompat.Builder(context, NOTIFICATION_CHANNEL_ID)
                                    .setSmallIcon(android.R.drawable.ic_media_play)
                                    .setContentTitle(notification.extras.getString(android.app.Notification.EXTRA_TITLE))
                                    .setContentText(notification.extras.getString(android.app.Notification.EXTRA_TEXT))
                                    .setOngoing(ongoing)
                                    .setVisibility(androidx.core.app.NotificationCompat.VISIBILITY_PUBLIC)
                                    .setShowWhen(true)
                                    .setUsesChronometer(true)
                                    .setWhen(System.currentTimeMillis() - currentPosition);
                                
                                // 复制原有的 action buttons
                                if (notification.actions != null) {
                                    for (android.app.Notification.Action action : notification.actions) {
                                        // 转换为 NotificationCompat.Action
                                        androidx.core.app.NotificationCompat.Action compatAction = 
                                            new androidx.core.app.NotificationCompat.Action.Builder(
                                                android.R.drawable.ic_media_play,
                                                action.title,
                                                action.actionIntent
                                            ).build();
                                        builder.addAction(compatAction);
                                    }
                                }
                                
                                // 设置 MediaStyle
                                androidx.media3.session.MediaStyleNotificationHelper.MediaStyle mediaStyle = 
                                    new androidx.media3.session.MediaStyleNotificationHelper.MediaStyle(mediaSession)
                                    .setShowActionsInCompactView(0, 1, 2);
                                
                                builder.setStyle(mediaStyle);
                                
                                // 重新发布通知
                                android.app.NotificationManager nm = 
                                    context.getSystemService(android.app.NotificationManager.class);
                                nm.notify(notificationId, builder.build());
                                

                            } catch (Exception e) {
                                Log.e(TAG, "❌ Failed to update notification", e);
                            }
                        }
                    }
                }
                
                @Override
                public void onNotificationCancelled(int notificationId, boolean dismissedByUser) {

                }
            })
            .build();
            
            // ✅ 配置通知样式
            notificationManager.setSmallIcon(android.R.drawable.ic_media_play);  // 使用系统图标
            notificationManager.setUsePlayPauseActions(true);   // 显示播放/暂停按钮
            notificationManager.setUsePreviousAction(true);     // 显示上一曲按钮
            notificationManager.setUseNextAction(true);         // 显示下一曲按钮
            notificationManager.setUseStopAction(false);        // 不显示停止按钮
            
            // ✅ 注意：快进/快退按钮由 MediaSession 的 PlaybackState 自动控制
            // ForwardingPlayer 中的 seekForward/seekBack 已实现，系统会自动显示按钮
            
            notificationManager.setPriority(androidx.core.app.NotificationCompat.PRIORITY_LOW);  // 低优先级
            
            // ✅ 关联 ExoPlayer（使用 ForwardingPlayer）
            notificationManager.setPlayer(forwardingPlayer);
            

        } catch (Exception e) {
            Log.e(TAG, "❌ Failed to initialize notification manager", e);
        }
    }
    
    
}
