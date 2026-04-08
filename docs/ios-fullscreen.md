# iOS 全屏功能说明

## ⚠️ 重要提示

**iOS Safari/Chrome 浏览器不支持网页全屏 API**。这是 Apple 的系统限制，无法通过代码绕过。

### 当前实现（v6.0.4）

- ✅ 检测 iOS 设备
- ✅ 尝试标准 Fullscreen API（iOS 16.4+ 可能支持）
- ✅ 显示友好的用户引导弹窗
- ✅ 提供详细的“添加到主屏幕”教程
- ❌ 无法在浏览器内实现真正的全屏

## 已实现的解决方案

### 1. 多 API 兼容

代码已实现多种 Fullscreen API 的降级方案：

```typescript
// 进入全屏
if (element.requestFullscreen) {
    await element.requestFullscreen();  // 标准 API
} else if (element.webkitRequestFullscreen) {
    await element.webkitRequestFullscreen();  // iOS Safari/Chrome
} else if (element.msRequestFullscreen) {
    await element.msRequestFullscreen();  // IE/Edge
}

// 退出全屏
if (document.exitFullscreen) {
    await document.exitFullscreen();
} else if (document.webkitExitFullscreen) {
    await document.webkitExitFullscreen();
} else if (document.msExitFullscreen) {
    await document.msExitFullscreen();
}
```

### 2. 多事件监听

监听多种全屏变化事件以兼容不同浏览器：

```typescript
document.addEventListener('fullscreenchange', handler);
document.addEventListener('webkitfullscreenchange', handler);  // WebKit
document.addEventListener('msfullscreenchange', handler);      // IE/Edge
```

### 3. CSS 兼容性

添加了 WebKit 特定的全屏样式：

```css
:-webkit-full-screen .app-header {
    display: none !important;
}

html:-webkit-full-screen {
    width: 100%;
    height: 100%;
}
```

## iOS 上的最佳解决方案

由于 iOS 对网页全屏的系统限制，**唯一可靠的方法**是：

### ⭐ 方案 1：添加到主屏幕（强烈推荐）

这是获得真正全屏体验的唯一方法！

#### 操作步骤：

1. **打开应用**
   - 在 Safari 或 Chrome 中打开 lrc-player

2. **点击分享按钮**
   - Safari: 底部中间的 📤 图标
   - Chrome: 右上角的 ⋮ 菜单 → 分享

3. **选择“添加到主屏幕”**
   - 向下滚动分享菜单
   - 找到并点击“添加到主屏幕”选项

4. **确认添加**
   - 可以自定义名称（默认：LRC Player）
   - 点击右上角的“添加”按钮

5. **从主屏幕启动**
   - 返回手机主屏幕
   - 找到新添加的 LRC Player 图标
   - 点击打开，即可享受全屏体验！

#### 优点：
- ✅ 隐藏浏览器地址栏和工具栏
- ✅ 真正的 fullscreen 体验
- ✅ 类似原生应用的界面
- ✅ 支持离线使用（PWA）
- ✅ 快速启动，无需打开浏览器
- ✅ 可以接收推送通知（如果实现）

### 方案 2：横屏模式

在 iOS 设备上：
1. 关闭竖屏锁定
2. 将设备旋转到横屏
3. 歌词会自动适应屏幕宽度

### 方案 3：使用播放器页面的自定义背景

Player 页面已经实现了：
- 自定义背景颜色
- 全屏歌词显示
- 隐藏不必要的 UI 元素

这提供了类似全屏的体验，即使没有真正的全屏模式。

## 技术细节

### iOS 版本支持

| iOS 版本 | Fullscreen API 支持 | 备注 |
|---------|-------------------|------|
| < 15.0  | ❌ 不支持 | 需要使用替代方案 |
| ≥ 15.0  | ⚠️ 部分支持 | 需要用户手势触发 |
| ≥ 16.4  | ✅ 较好支持 | PWA 模式支持更好 |

### 检测 iOS 设备

```typescript
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && 
              !(window as any).MSStream;
```

### 最佳实践

1. **始终在点击事件中调用**：不要在 setTimeout 或 Promise 中调用
2. **提供降级方案**：如果全屏失败，不要阻塞用户操作
3. **使用 PWA**：鼓励用户添加到主屏幕
4. **优化横屏布局**：确保横屏时界面正常显示

## 未来改进方向

1. **增强 PWA 支持**：
   - 添加 manifest.json 配置
   - 优化 standalone 模式体验

2. **iOS 特定优化**：
   - 检测设备类型并显示相应提示
   - 提供"添加到主屏幕"的引导

3. **视频元素全屏**：
   - 如果需要真正的 iOS 全屏，可以考虑使用隐藏的 video 元素
   - 但这会增加复杂性，不推荐

## 总结

当前实现已经最大程度地兼容了 iOS 设备：
- ✅ 支持 iOS 15+ 的部分全屏功能
- ✅ 优雅的降级处理
- ✅ 提供多种替代方案
- ✅ 优化的 Player 页面体验

对于最佳的 iOS 体验，**强烈建议用户将应用添加到主屏幕**。
