package com.lrcplayer.app.plugins;

import android.content.ContentResolver;
import android.content.Context;
import android.database.Cursor;
import android.net.Uri;
import android.provider.MediaStore;
import android.util.Log;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;

@CapacitorPlugin(name = "MediaStore")
public class MediaStorePlugin extends Plugin {

    private static final String TAG = "MediaStorePlugin";

    /**
     * 扫描所有音频文件
     */
    @PluginMethod
    public void scanAudioFiles(PluginCall call) {
        Log.d(TAG, "========== scanAudioFiles called ==========");
        
        try {
            Context context = getContext();
            ContentResolver resolver = context.getContentResolver();
            
            Uri uri = MediaStore.Audio.Media.EXTERNAL_CONTENT_URI;
            
            String[] projection = {
                MediaStore.Audio.Media._ID,
                MediaStore.Audio.Media.TITLE,
                MediaStore.Audio.Media.DISPLAY_NAME,
                MediaStore.Audio.Media.DATA,
                MediaStore.Audio.Media.SIZE,
                MediaStore.Audio.Media.DURATION,
                MediaStore.Audio.Media.ARTIST,
                MediaStore.Audio.Media.ALBUM
            };
            
            // ✅ 关键：先查询所有文件，看看是否能访问
            Log.d(TAG, "Testing: Querying ALL audio files first...");
            Cursor allCursor = resolver.query(uri, projection, null, null, null);
            if (allCursor != null) {
                Log.d(TAG, "ALL files count: " + allCursor.getCount());
                if (allCursor.moveToFirst()) {
                    int dataCol = allCursor.getColumnIndexOrThrow(MediaStore.Audio.Media.DATA);
                    String firstPath = allCursor.getString(dataCol);
                    Log.d(TAG, "First file path: " + firstPath);
                }
                allCursor.close();
            }
            
            Cursor cursor = resolver.query(uri, projection, null, null, 
                                          MediaStore.Audio.Media.TITLE + " ASC");
            
            if (cursor == null) {
                Log.e(TAG, "Cursor is null");
                call.reject("Failed to query MediaStore");
                return;
            }
            
            JSArray tracks = new JSArray();
            int count = 0;
            
            int idColumn = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media._ID);
            int titleColumn = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.TITLE);
            int nameColumn = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.DISPLAY_NAME);
            int dataColumn = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.DATA);
            int sizeColumn = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.SIZE);
            int durationColumn = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.DURATION);
            int artistColumn = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.ARTIST);
            int albumColumn = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.ALBUM);
            
            while (cursor.moveToNext()) {
                JSObject track = new JSObject();
                
                String id = cursor.getString(idColumn);
                String title = cursor.getString(titleColumn);
                String displayName = cursor.getString(nameColumn);
                String data = cursor.getString(dataColumn);
                
                // ✅ 修复：优先使用 DISPLAY_NAME（文件名），而不是 TITLE（元数据）
                // 参考 /lrc-player-ANDROID 的实现，只显示文件名
                String fileName = displayName != null ? displayName : "";
                String nameWithoutExt = fileName;
                if (fileName.contains(".")) {
                    nameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.'));
                }
                
                track.put("id", id != null ? id : "");
                track.put("name", nameWithoutExt);  // ✅ 使用不含扩展名的文件名
                track.put("fileName", fileName);
                track.put("filePath", "content://media/external/audio/media/" + id);
                track.put("path", data != null ? data : "");
                
                long size = cursor.getLong(sizeColumn);
                if (size > 0) {
                    track.put("size", size);
                }
                
                long duration = cursor.getLong(durationColumn);
                if (duration > 0) {
                    track.put("duration", duration);
                }
                
                String artist = cursor.getString(artistColumn);
                if (artist != null && !artist.isEmpty()) {
                    track.put("artist", artist);
                }
                
                String album = cursor.getString(albumColumn);
                if (album != null && !album.isEmpty()) {
                    track.put("album", album);
                }
                
                tracks.put(track);
                count++;
            }
            
            cursor.close();
            
            Log.d(TAG, "Query returned " + count + " tracks");
            
            JSObject result = new JSObject();
            result.put("tracks", tracks);
            result.put("count", count);
            
            call.resolve(result);
            
        } catch (Exception e) {
            Log.e(TAG, "Error scanning audio files", e);
            call.reject("Error: " + e.getMessage());
        }
    }

    /**
     * 获取指定文件夹下的歌曲
     */
    @PluginMethod
    public void getTracksInFolder(PluginCall call) {
        Log.d(TAG, "========== getTracksInFolder called ==========");
        
        String folderPath = call.getString("folderPath");
        Log.d(TAG, "Input folderPath: " + folderPath);
        
        if (folderPath == null || folderPath.isEmpty()) {
            Log.e(TAG, "folderPath is null or empty");
            call.reject("folderPath is required");
            return;
        }
        
        try {
            Context context = getContext();
            ContentResolver resolver = context.getContentResolver();
            
            Uri uri = MediaStore.Audio.Media.EXTERNAL_CONTENT_URI;
            
            String[] projection = {
                MediaStore.Audio.Media._ID,
                MediaStore.Audio.Media.TITLE,
                MediaStore.Audio.Media.DISPLAY_NAME,
                MediaStore.Audio.Media.DATA,
                MediaStore.Audio.Media.SIZE,
                MediaStore.Audio.Media.DURATION,
                MediaStore.Audio.Media.ARTIST,
                MediaStore.Audio.Media.ALBUM
            };
            
            // 调试：先查询所有文件，看看是否能访问
            Log.d(TAG, "Testing: Querying ALL audio files first...");
            Cursor allCursor = resolver.query(uri, projection, null, null, null);
            if (allCursor != null) {
                Log.d(TAG, "ALL files count: " + allCursor.getCount());
                if (allCursor.moveToFirst()) {
                    int dataCol = allCursor.getColumnIndexOrThrow(MediaStore.Audio.Media.DATA);
                    String firstPath = allCursor.getString(dataCol);
                    Log.d(TAG, "First file path: " + firstPath);
                }
                allCursor.close();
            }
            
            // 使用 LIKE 查询过滤文件夹
            String selection = MediaStore.Audio.Media.DATA + " LIKE ?";
            String[] selectionArgs = new String[]{ folderPath + "%" };
            
            Log.d(TAG, "Using selection: " + selection);
            Log.d(TAG, "With args: " + folderPath + "%");
            Log.d(TAG, "Selection args length: " + selectionArgs.length);
            Log.d(TAG, "Selection args[0]: '" + selectionArgs[0] + "'");
            
            Cursor cursor = resolver.query(uri, projection, selection, selectionArgs, 
                                          MediaStore.Audio.Media.TITLE + " ASC");
            
            if (cursor == null) {
                Log.e(TAG, "Cursor is null");
                call.reject("Failed to query MediaStore");
                return;
            }
            
            // 调试：打印 cursor 计数
            Log.d(TAG, "Cursor count: " + cursor.getCount());
            
            JSArray tracks = new JSArray();
            int count = 0;
            
            // 提取列索引
            int idColumn = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media._ID);
            int titleColumn = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.TITLE);
            int nameColumn = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.DISPLAY_NAME);
            int dataColumn = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.DATA);
            int sizeColumn = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.SIZE);
            int durationColumn = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.DURATION);
            int artistColumn = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.ARTIST);
            int albumColumn = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.ALBUM);
            
            while (cursor.moveToNext()) {
                JSObject track = new JSObject();
                
                String id = cursor.getString(idColumn);
                String title = cursor.getString(titleColumn);
                String displayName = cursor.getString(nameColumn);
                String data = cursor.getString(dataColumn);
                
                // ✅ 修复：优先使用 DISPLAY_NAME（文件名），而不是 TITLE（元数据）
                // 参考 /lrc-player-ANDROID 的实现，只显示文件名
                String fileName = displayName != null ? displayName : "";
                String nameWithoutExt = fileName;
                if (fileName.contains(".")) {
                    nameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.'));
                }
                
                track.put("id", id != null ? id : "");
                track.put("name", nameWithoutExt);  // ✅ 使用不含扩展名的文件名
                track.put("fileName", fileName);
                track.put("filePath", "content://media/external/audio/media/" + id);
                track.put("path", data != null ? data : "");
                
                long size = cursor.getLong(sizeColumn);
                if (size > 0) {
                    track.put("size", size);
                }
                
                long duration = cursor.getLong(durationColumn);
                if (duration > 0) {
                    track.put("duration", duration);
                }
                
                String artist = cursor.getString(artistColumn);
                if (artist != null && !artist.isEmpty()) {
                    track.put("artist", artist);
                }
                
                String album = cursor.getString(albumColumn);
                if (album != null && !album.isEmpty()) {
                    track.put("album", album);
                }
                
                tracks.put(track);
                count++;
            }
            
            cursor.close();
            
            Log.d(TAG, "Query returned " + count + " tracks");
            
            JSObject result = new JSObject();
            result.put("tracks", tracks);
            result.put("count", count);
            
            call.resolve(result);
            
        } catch (Exception e) {
            Log.e(TAG, "Error getting tracks in folder", e);
            call.reject("Error: " + e.getMessage());
        }
    }

    /**
     * 获取音频文件的实际路径
     */
    @PluginMethod
    public void getAudioFilePath(PluginCall call) {
        String contentUri = call.getString("contentUri");
        Log.d(TAG, "getAudioFilePath called with: " + contentUri);
        
        if (contentUri == null || contentUri.isEmpty()) {
            call.reject("contentUri is required");
            return;
        }
        
        try {
            // 如果已经是文件路径，直接返回
            if (!contentUri.startsWith("content://")) {
                JSObject result = new JSObject();
                result.put("filePath", contentUri);
                call.resolve(result);
                return;
            }
            
            // 从 content URI 提取 ID
            Uri uri = Uri.parse(contentUri);
            String id = uri.getLastPathSegment();
            
            if (id == null) {
                call.reject("Invalid content URI");
                return;
            }
            
            Context context = getContext();
            ContentResolver resolver = context.getContentResolver();
            
            String[] projection = { MediaStore.Audio.Media.DATA };
            String selection = MediaStore.Audio.Media._ID + " = ?";
            String[] selectionArgs = new String[]{ id };
            
            Cursor cursor = resolver.query(MediaStore.Audio.Media.EXTERNAL_CONTENT_URI, 
                                          projection, selection, selectionArgs, null);
            
            if (cursor != null && cursor.moveToFirst()) {
                int columnIndex = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.DATA);
                String filePath = cursor.getString(columnIndex);
                cursor.close();
                
                Log.d(TAG, "Found file path: " + filePath);
                
                JSObject result = new JSObject();
                result.put("filePath", filePath);
                call.resolve(result);
            } else {
                if (cursor != null) {
                    cursor.close();
                }
                call.reject("File not found in MediaStore");
            }
            
        } catch (Exception e) {
            Log.e(TAG, "Error getting audio file path", e);
            call.reject("Error: " + e.getMessage());
        }
    }

    /**
     * 查找歌词文件
     */
    @PluginMethod
    public void findLrcFile(PluginCall call) {
        String audioPath = call.getString("audioPath");
        Log.d(TAG, "========== findLrcFile START ==========");
        Log.d(TAG, "Input audioPath: " + audioPath);
        
        if (audioPath == null || audioPath.isEmpty()) {
            Log.e(TAG, "audioPath is null or empty!");
            call.reject("audioPath is required");
            return;
        }
        
        try {
            String realAudioPath = audioPath;
            
            // ✅ 关键修复：如果是 content URI，先转换为真实文件路径
            if (audioPath.startsWith("content://")) {
                Log.d(TAG, "Detected content URI, converting to real path...");
                
                // 从 content URI 提取 ID
                android.net.Uri uri = android.net.Uri.parse(audioPath);
                String id = uri.getLastPathSegment();
                Log.d(TAG, "Extracted ID from URI: " + id);
                
                if (id != null) {
                    Context context = getContext();
                    ContentResolver resolver = context.getContentResolver();
                    
                    String[] projection = { MediaStore.Audio.Media.DATA };
                    String selection = MediaStore.Audio.Media._ID + " = ?";
                    String[] selectionArgs = new String[]{ id };
                    
                    Log.d(TAG, "Querying MediaStore for ID: " + id);
                    android.database.Cursor cursor = resolver.query(
                        MediaStore.Audio.Media.EXTERNAL_CONTENT_URI,
                        projection, selection, selectionArgs, null
                    );
                    
                    if (cursor != null && cursor.moveToFirst()) {
                        int columnIndex = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.DATA);
                        realAudioPath = cursor.getString(columnIndex);
                        cursor.close();
                        Log.d(TAG, "✅ Converted to real path: " + realAudioPath);
                    } else {
                        if (cursor != null) {
                            cursor.close();
                        }
                        Log.e(TAG, "❌ Failed to convert content URI to real path - cursor empty");
                        JSObject result = new JSObject();
                        result.put("lrcPath", null);
                        call.resolve(result);
                        return;
                    }
                } else {
                    Log.e(TAG, "❌ Invalid content URI - cannot extract ID: " + audioPath);
                    JSObject result = new JSObject();
                    result.put("lrcPath", null);
                    call.resolve(result);
                    return;
                }
            } else {
                Log.d(TAG, "Not a content URI, using as-is: " + realAudioPath);
            }
            
            // 移除音频扩展名，添加 .lrc
            String lrcPath = realAudioPath.replaceAll("\\.(mp3|flac|wav|m4a|aac|ogg|wma|ape|opus)$", ".lrc");
            Log.d(TAG, "Generated LRC path: " + lrcPath);
            
            File lrcFile = new File(lrcPath);
            Log.d(TAG, "Checking if LRC file exists: " + lrcFile.getAbsolutePath());
            Log.d(TAG, "File exists: " + lrcFile.exists());
            Log.d(TAG, "File canRead: " + lrcFile.canRead());
            
            JSObject result = new JSObject();
            if (lrcFile.exists()) {
                Log.d(TAG, "✅ Found LRC file: " + lrcPath);
                result.put("lrcPath", lrcPath);
            } else {
                Log.d(TAG, "❌ LRC file not found: " + lrcPath);
                
                // 尝试其他可能的扩展名
                String[] extensions = {".txt", ".lyric", ".lrc.txt"};
                for (String ext : extensions) {
                    String altPath = realAudioPath.replaceAll("\\.(mp3|flac|wav|m4a|aac|ogg|wma|ape|opus)$", ext);
                    File altFile = new File(altPath);
                    Log.d(TAG, "Trying alternative: " + altPath + " -> exists: " + altFile.exists());
                    if (altFile.exists()) {
                        Log.d(TAG, "✅ Found alternative LRC: " + altPath);
                        result.put("lrcPath", altPath);
                        call.resolve(result);
                        return;
                    }
                }
                
                result.put("lrcPath", null);
            }
            
            call.resolve(result);
            Log.d(TAG, "========== findLrcFile END ==========");
            
        } catch (Exception e) {
            Log.e(TAG, "❌ Error finding LRC file", e);
            e.printStackTrace();
            call.reject("Error: " + e.getMessage());
        }
    }
    
    /**
     * 刷新媒体库（触发媒体扫描）
     */
    @PluginMethod
    public void refreshLibrary(PluginCall call) {
        try {
            String folder = call.getString("folder");
            Log.d(TAG, "refreshLibrary called with folder: " + (folder != null ? folder : "all"));
            
            Context context = getContext();
            
            if (folder != null && !folder.isEmpty()) {
                // 扫描特定文件夹
                File folderFile = new File(folder);
                if (folderFile.exists() && folderFile.isDirectory()) {
                    // 触发媒体扫描
                    android.media.MediaScannerConnection.scanFile(
                        context,
                        new String[]{ folder },
                        null,
                        (path, uri) -> {
                            Log.d(TAG, "Scanned: " + path + " -> " + uri);
                        }
                    );
                    
                    JSObject result = new JSObject();
                    result.put("success", true);
                    result.put("message", "Media scan triggered for: " + folder);
                    call.resolve(result);
                } else {
                    call.reject("Folder does not exist: " + folder);
                }
            } else {
                // 扫描所有外部存储
                android.media.MediaScannerConnection.scanFile(
                    context,
                    new String[]{ android.os.Environment.getExternalStorageDirectory().toString() },
                    null,
                    (path, uri) -> {
                        Log.d(TAG, "Scanned: " + path + " -> " + uri);
                    }
                );
                
                JSObject result = new JSObject();
                result.put("success", true);
                result.put("message", "Media scan triggered for all external storage");
                call.resolve(result);
            }
        } catch (Exception e) {
            Log.e(TAG, "Error refreshing library", e);
            call.reject("Error: " + e.getMessage());
        }
    }
    
    /**
     * 读取文件为 Base64 字符串（用于 Web Audio API）
     */
    @PluginMethod
    public void readFileAsBase64(PluginCall call) {
        try {
            String uri = call.getString("uri");
            if (uri == null) {
                call.reject("uri is required");
                return;
            }
            
            Log.d(TAG, "Reading file as Base64: " + uri);
            
            // 处理 content:// URI 和 file:// URI
            InputStream inputStream = null;
            
            if (uri.startsWith("content://")) {
                // SAF URI - 使用 ContentResolver 读取
                android.net.Uri contentUri = android.net.Uri.parse(uri);
                inputStream = getActivity().getContentResolver().openInputStream(contentUri);
            } else if (uri.startsWith("file://")) {
                // file:// URI - 转换为 File 对象
                String filePath = uri.replace("file://", "");
                inputStream = new FileInputStream(new File(filePath));
            } else {
                // 假设是普通文件路径
                inputStream = new FileInputStream(new File(uri));
            }
            
            if (inputStream == null) {
                call.reject("Failed to open file: " + uri);
                return;
            }
            
            // 读取文件内容到字节数组
            byte[] fileBytes;
            try {
                fileBytes = inputStream.readAllBytes();
            } finally {
                inputStream.close();
            }
            
            // 转换为 Base64 字符串
            String base64 = android.util.Base64.encodeToString(fileBytes, android.util.Base64.NO_WRAP);
            
            Log.d(TAG, "Successfully read " + fileBytes.length + " bytes as Base64");
            
            JSObject result = new JSObject();
            result.put("base64", base64);
            result.put("size", fileBytes.length);
            
            call.resolve(result);
        } catch (Exception e) {
            Log.e(TAG, "Error reading file as Base64", e);
            call.reject("Error: " + e.getMessage());
        }
    }
}
