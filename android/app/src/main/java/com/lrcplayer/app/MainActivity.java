package com.lrcplayer.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Capacitor 8.x: 插件通过 @CapacitorPlugin 注解自动发现
        // MediaStorePlugin 已在 plugins 目录中，会自动加载
    }
}
