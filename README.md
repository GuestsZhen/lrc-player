<p align="center">
    <a href="https://guestszhen.github.io/lrc-player">
        <img src="./public/favicons/lrc-icon.svg" alt="logo" width="96" />
    </a>
</p>

<p align="center">
    <a href="#">中文</a> | 
    <a href="README.en-US.md">English</a>
</p>

# 简谱 lrc 播放器

## 这个项目是什么

这是一个基于 Akari 的 lrc-maker 制作的简谱播放工具，原程序为滚动歌词制作工具，在此基础上增加了首调唱名法转调、独立播放界面、播放列表等功能。

感谢 Akari，项目原地址为：https://github.com/magic-akari/lrc-maker

## 主要功能

### 🎯 核心模块

#### 1. 播放器 (Player)
- 🎵 简谱LRC高亮滚动播放 - 通过歌词中 "/"符号可实现双行显示
- 🎨 高度自定义：字体大小调节、对齐方式（左/中/右）、背景颜色自定义、歌词颜色自定义、大小调识别
- 🌓 主题自适应（亮色/暗色）
- 🖥️ 全屏模式支持

#### 2. 简谱转调工具 (Tune) ⭐特色功能
- 🎼 **首调唱名法转调**（核心特色）
- 🔄 简谱数字与音名映射转换
- 🎹 支持高低八度标记：
  - `(5)` 表示低音
  - `[5]` 表示高音
- 📊 升降号支持（#1, b2 等）
- 🌍 多调式转换（C调、D调等）
- 📋 转换结果预览和导出

#### 3. 歌词编辑器 (Editor)
- 📝 可视化歌词编辑界面
- 🏷️ 支持插入和管理时间标签
- 💾 歌词导入/导出功能
- ☁️ GitHub Gist 云同步
- 📋 复制和下载歌词文件
- 🔧 歌词元数据编辑（标题、艺术家等）

#### 4. 歌词工具箱 (Lrc-utils)
- 🔧 多种实用工具：歌词压缩、时间偏移、时间变换、翻译分割、标签移除
- 📥 原文本和处理后文本对比
- 💾 覆盖模式支持

#### 5. 歌词同步器 (Synchronizer)
- ⏱️ 实时歌词时间轴同步
- 🎮 两种同步模式：选择模式（手动选择行并打点）、高亮模式（跟随播放自动高亮）
- ⌨️ 键盘快捷键支持
- 🔄 平滑滚动到当前行
- ⚡ 时间标签微调功能

#### 6. 偏好设置 (Preferences)
- 🎨 主题设置（自动/亮色/暗色）
- ⌨️ 键盘快捷键自定义
- 🌐 多语言切换（EN/ZH-CN/ZH-TW）
- 📝 编辑器配置
- 🎵 音频播放设置

#### 7. Gist 云同步 (Gist)
- ☁️ GitHub Gist 集成
- 🔐 OAuth 认证
- 📤 上传歌词到云端
- 📥 从云端加载歌词
- 🗂️ Gist 管理界面

#### 8. 测试版 ST播放器 (player-soundtouch)
- 🎵 实现歌曲转调
- 受技术限制，无法调整播放进度，指定时间点（seek）等

### 🛠️ 技术特性

- **前端架构**：React 18 + TypeScript + Vite 6
- **音频处理**：WaveSurfer.js 波形可视化
- **国际化**：三语言支持（英文、简体中文、繁体中文）
- **数据处理**：@lrc-maker/lrc-parser 歌词解析库
- **PWA 支持**：Service Worker 离线缓存，可安装为桌面应用
- **响应式设计**：支持桌面端和移动端

## 如何使用

### 基本操作
将文件拖放到页面中加载，使用箭头键和空格键插入时间戳。你可以把这个链接收藏到浏览器书签。

在线体验：https://guestszhen.github.io/lrc-player

### 💡 应用场景

1. **音乐制作人**：为简谱歌曲制作精准的时间轴歌词
2. **KTV 系统**：创建卡拉OK字幕文件
3. **音乐教育**：简谱教学和转调练习
4. **歌词爱好者**：整理和美化歌词文件
5. **开发者**：学习 React + TypeScript 最佳实践

## 热键

|                            按键                             |        功能        |
| :---------------------------------------------------------: | :----------------: |
|                      <kbd>space</kbd>                       |    插入时间标签    |
|   <kbd>backspace</kbd> / <kbd>delete</kbd> / <kbd>⌫</kbd>   |    移除时间标签    |
| <kbd>ctrl</kbd><kbd>enter↵</kbd> / <kbd>⌘</kbd><kbd>↩</kbd> |    播放 / 暂停     |
|                 <kbd>←</kbd> / <kbd>A</kbd>                 |     回退 5 秒      |
|                 <kbd>→</kbd> / <kbd>D</kbd>                 |     前进 5 秒      |
|         <kbd>↑</kbd> / <kbd>W</kbd> / <kbd>J</kbd>          |     选择上一行     |
|         <kbd>↓</kbd> / <kbd>S</kbd> / <kbd>K</kbd>          |     选择下一行     |
|                 <kbd>-</kbd> / <kbd>+</kbd>                 | 当前行时间标签微调 |
|   <kbd>ctrl</kbd><kbd>↑</kbd> / <kbd>⌘</kbd><kbd>↑</kbd>    |    提高播放速度    |
|   <kbd>ctrl</kbd><kbd>↓</kbd> / <kbd>⌘</kbd><kbd>↓</kbd>    |    降低播放速度    |
|                        <kbd>R</kbd>                         |    重置播放速度    |

## 兼容性

本项目使用现代浏览器 API 来提升性能和改善用户体验，使用了 ES Module 来加载代码。

推荐的浏览器版本：

| 浏览器  | 版本  |
| :------ | :---- |
| Chrome  | >= 61 |
| Firefox | >= 60 |
| Safari  | >= 11 |
| Edge    | >= 79 |

## 本地开发

如果你想在本地计算机上运行这个项目，可以遵循下面操作。

```bash
# 克隆这个仓库
git clone https://github.com/GuestsZhen/lrc-player.git

cd lrc-player

# 安装依赖
npm i

# 构建
npm run build

# 开发模式
npm start
```



## 生产部署

构建（`npm run build`）后，`build` 文件夹是静态网站文件。
您可以将其部署到任何 CDN 或静态文件服务器。

您还可以使用此存储库根目录下的 `Dockerfile` 构建一个 docker 镜像。
它运行构建并创建最小化的 nginx 镜像。

```bash
# 构建
docker build -t lrc-player .
# 创建一个容器并在 8080 端口提供服务
docker run -d -p 8080:80 lrc-player
```

## 给这个项目点一个星星 :star:

如果你喜欢这个项目，请点一个星星吧 :star:，同时分享这个项目来帮助更多的人。
