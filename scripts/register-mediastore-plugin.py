#!/usr/bin/env python3
"""
自动注册 MediaStore 和 ExoPlayer 插件到 capacitor.plugins.json
在每次 npx cap sync 后运行此脚本
"""

import json
import sys
import os

def register_plugins():
    plugin_json_path = 'android/app/src/main/assets/capacitor.plugins.json'
    
    # 检查文件是否存在
    if not os.path.exists(plugin_json_path):
        print(f'❌ 文件不存在: {plugin_json_path}')
        sys.exit(1)
    
    # 读取现有插件配置
    with open(plugin_json_path, 'r', encoding='utf-8') as f:
        plugins = json.load(f)
    
    print('当前已注册的插件:')
    for plugin in plugins:
        print(f'  - {plugin.get("pkg")}')
    
    # 检查并注册 MediaStore 插件
    if any(p.get('pkg') == 'MediaStore' for p in plugins):
        print('\n✅ MediaStore 插件已注册，无需重复添加')
    else:
        plugins.append({
            'pkg': 'MediaStore',
            'classpath': 'com.lrcplayer.app.plugins.MediaStorePlugin'
        })
        print('\n✅ MediaStore 插件已成功注册')
    
    # ✅ 检查并注册 ExoPlayer 插件
    if any(p.get('pkg') == 'ExoPlayerPlugin' for p in plugins):
        print('✅ ExoPlayerPlugin 插件已注册，无需重复添加')
    else:
        plugins.append({
            'pkg': 'ExoPlayerPlugin',
            'classpath': 'com.lrcplayer.app.plugins.ExoPlayerPlugin'
        })
        print('✅ ExoPlayerPlugin 插件已成功注册')
    
    # 写回文件
    with open(plugin_json_path, 'w', encoding='utf-8') as f:
        json.dump(plugins, f, indent='\t')
        f.write('\n')
    
    print('\n最终插件列表:')
    for plugin in plugins:
        print(f'  - {plugin.get("pkg")}: {plugin.get("classpath")}')

if __name__ == '__main__':
    register_plugins()
