# 更新日志 (Changelog)

所有重要的项目更改都将记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
项目遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [Unreleased] - 待发布

### Added - 新增
- **文件列表功能增强**
  - 文件列表头部添加清除按钮（位于关闭按钮左边）
  - 使用 DeleteSVG 图标，圆形按钮设计
  - 支持一键清除所有已选文件
  - 清除按钮悬停效果（背景变亮 + 放大动画）
- **文件列表点击播放功能**
  - 点击文件列表中的歌曲自动加载并播放
  - 自动查找同名 LRC 歌词文件并加载
  - 当前播放的文件名高亮显示（变大、变白、加粗）
  - 样式与播放列表保持一致（font-size: 1.2rem）
  - 支持亮色/暗色主题适配
- **文件打开功能优化**
  - 打开文件时只记录路径，不自动载入播放
  - 统一文件列表和播放列表的打开文件图标（FolderSVG）
  - 文件列表打开文件按钮背景透明，悬停时显示半透明背景
- **Footer 播放控制区优化**
  - 隐藏播放列表按钮（通过文件列表和播放列表面板访问）
  - 播放顺序按钮移动到最左下角
  - 竖屏模式下中间控制按钮放大设计：
    - 上一首/下一首按钮：51×51，SVG 50×50
    - 播放/暂停按钮：81×81，SVG 80×80
  - 形成明显的按钮层级关系，提升可点击性
- **文件路径显示面板**
  - 在 main 区域左侧显示选中的文件列表
  - 支持多文件显示，带序号
  - 可清除文件列表
  - 平滑的滑入动画
  - 支持亮色/暗色主题
  - 最大高度 300px，超出可滚动
- **Header 左上角打开文件按钮**
  - 使用播放列表 SVG 图标
  - 点击打开音频文件选择对话框
  - 文件路径显示在按钮下方
  - 支持亮色/暗色主题
  - 平滑的淡入动画效果
- **播放列表 iOS 风格全屏手势支持**
  - 竖屏模式下全屏显示播放列表
  - 支持向下滑动手势关闭
  - 添加拖拽手柄（iOS 风格）
  - 平滑的过渡动画（cubic-bezier 缓动）
  - 半透明遮罩层，点击可关闭
  - 跟手拖拽效果，流畅自然
- **Preferences 页面标题**
  - 在 Header 中显示应用标题
  - **支持多语言（中文/英文/繁体中文）**
  - 居中显示，适配亮色/暗色主题
  - 自动响应主题和语言变化
- 创建 iOS 全屏功能技术文档 (docs/ios-fullscreen.md)
- 添加 Windows PowerShell 启动脚本 (start.ps1)
- 创建自动化版本管理脚本 (scripts/bump-version.js)
- 添加版本管理文档 (docs/version-management.md)
- 创建 iOS 友好提示组件 (ios-hint.tsx)

### Changed - 修改
- **修正英文翻译**
  - 英文名称改为 "LRC Player"
  - 英文全称改为 "LRC Player"
- **header.tsx**: 优化全屏按钮显示逻辑
  - **全屏按钮现在只在 Player 页面显示**
  - 与“文字设置”按钮保持一致的显示条件
  - 提升用户体验，避免在其他页面误触
- **README.md**: 大幅扩展功能说明文档
  - 详细列出 7 个核心模块的功能介绍
  - 新增技术特性章节
  - 添加应用场景说明
  - 增加 Windows 用户注意事项
- **vite.config.ts**: 优化 Git 依赖处理和时间戳管理
  - 添加 try-catch 包裹 Git 命令
  - 无 Git 环境时使用默认值
  - **每次构建自动更新 updateTime 为当前时间**
  - 提高构建兼容性
  - 添加构建信息日志输出
- **start.bat**: 修复 PowerShell 执行策略问题
  - 改用 `node` 直接调用 Vite
  - 添加 `--host` 参数支持局域网访问
- **player.tsx**: 实现 iOS 兼容的全屏功能
  - 多 API 降级策略 (标准/WebKit/MS)
  - 多种全屏状态检测
  - 多事件监听支持
  - **iOS 设备检测和友好提示**
  - **显示“添加到主屏幕”教程弹窗**
- **header.tsx**: 同步更新全屏切换逻辑
  - 兼容 iOS WebKit API
  - 统一全屏状态管理
- **player.css**: 增强全屏样式兼容性
  - 添加 `:-webkit-full-screen` 选择器
  - 添加 `:-ms-fullscreen` 选择器
  - iOS Safari 特定样式优化

### Fixed - 修复
- **修复 Preferences 页面底部按钮被遮挡的问题**
  - 添加底部边距 (padding-bottom: 100px)
  - 竖屏模式下增加到底部边距 (120px)
  - 确保清除缓存等底部按钮可点击
- **修复速度设置按钮在竖屏模式下被遮挡的问题**
  - 提高 settings-dropdown-wrapper 的 z-index 到 10002
  - 提高 settings-dropdown-menu 的 z-index 到 10002
  - 确保高于播放列表面板 (10000) 和 editor-tools (10001)
  - 参考 editor tools 的层级设计
- **修复 Preferences 页面被播放按钮遮挡的问题**
  - 添加顶部边距 (padding-top: 80px)
  - 确保版本号和所有设置项可见
  - 避免与固定定位的播放按钮重叠
- 修复 Windows PowerShell 无法运行 npm 的问题
- 修复无 Git 环境下构建失败的问题
- **修复 iOS Safari/Chrome 全屏功能问题**
  - iOS 不支持网页全屏 API（系统限制）
  - 添加 iOS 设备检测
  - 显示友好的用户引导弹窗
  - 提供详细的“添加到主屏幕”教程
- 修复全屏状态在不同浏览器中检测不一致的问题

### New Features - 新功能
- **自动化版本管理**:
  - 添加 `npm run version:patch/minor/major` 命令
  - 自动递增版本号并记录更新时间
  - Preferences 页面实时显示版本和构建时间
  - 详细的版本管理文档

### Technical Details - 技术细节

#### iOS 全屏兼容性改进
**问题**: iOS Safari/Chrome 对 Fullscreen API 有严格限制
**解决方案**:
```typescript
// 多 API 兼容
if (element.requestFullscreen) {
    await element.requestFullscreen();
} else if (element.webkitRequestFullscreen) {
    await element.webkitRequestFullscreen();  // iOS
} else if (element.msRequestFullscreen) {
    await element.msRequestFullscreen();      // IE/Edge
}
```

**监听多种事件**:
- `fullscreenchange` (标准)
- `webkitfullscreenchange` (WebKit)
- `msfullscreenchange` (IE/Edge)

#### Windows 启动脚本优化
**问题**: PowerShell 执行策略阻止 npm.ps1 运行
**解决方案**: 
- 使用 `node node_modules/vite/bin/vite.js` 直接调用
- 创建 start.bat 和 start.ps1 双版本脚本

---

## [6.0.3] - 当前版本

### Features
- 简谱首调唱名法转调功能
- 独立播放界面
- 歌词同步器
- 歌词工具箱
- GitHub Gist 云同步
- 多语言支持 (EN/ZH-CN/ZH-TW)
- WaveSurfer 波形可视化
- PWA 离线支持

---

## 提交检查清单

在提交到 GitHub 之前，请确认：

- [ ] 代码已通过本地测试
- [ ] 构建成功 (`npm run build`)
- [ ] 更新日志已记录
- [ ] README 文档已同步更新
- [ ] 无 console.error 或警告
- [ ] 兼容性测试通过（Chrome/Firefox/Safari/iOS）
- [ ] TypeScript 类型检查通过
- [ ] 代码格式正确 (`npm run fix:fmt`)
- [ ]  lint 检查通过 (`npm run check:lint`)

---

## 版本历史

### 开发规范

1. **每次更新都要记录**:
   - 修改的文件
   - 修改的原因
   - 影响的功能模块
   - 测试结果

2. **提交信息格式**:
   ```
   type(scope): description
   
   [optional body]
   
   [optional footer]
   ```
   
   Types:
   - `feat`: 新功能
   - `fix`: 修复 bug
   - `docs`: 文档更新
   - `style`: 代码格式
   - `refactor`: 重构
   - `perf`: 性能优化
   - `test`: 测试相关
   - `chore`: 构建/工具链

3. **示例提交信息**:
   ```
   feat(player): 添加 iOS 全屏兼容支持
   
   - 实现多 API 降级策略
   - 添加 WebKit 和 MS 前缀支持
   - 监听多种全屏变化事件
   - 创建 iOS 全屏技术文档
   
   Fixes #123
   ```

---

## 备注

- 本文件应在每次重要更新后及时更新
- 重大变更需要详细说明和影响范围
- Bug 修复需要注明相关问题编号
- 破坏性变更需要特别标注并说明迁移方案
