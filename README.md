<p align="center">
    <a href="https://lrc-player.github.io">
        <img src="./public/favicons/lrc-icon.svg" alt="logo" />
    </a>
</p>

# 简谱 lrc 播放器

## 这个项目是什么

这是一个基于 Akari 的 lrc-maker 制作的简谱播放工具，原程序为滚动歌词制作工具，在此基础上增加了首调唱名法转调、独立播放界面、播放列表等功能。

感谢 Akari，项目原地址为：https://github.com/magic-akari/lrc-maker

## 主要功能

- **首调唱名法转调**：支持简谱的首调唱名法转调功能
- **独立播放界面**：提供专门的播放页面，支持全屏和自定义主题
- **播放列表管理**：支持本地音乐文件的播放列表管理
- **歌词工具**：提供歌词压缩、标签移除、时间偏移等实用工具
- **多语言支持**：支持英文、简体中文、繁体中文
- **波形显示**：支持音频波形可视化
- **自定义设置**：支持字体、颜色、对齐方式等个性化设置

## 如何使用

将文件拖放到页面中加载，使用箭头键和空格键插入时间戳。你可以把这个链接收藏到浏览器书签。

在线体验：https://guestszhen.github.io/lrc-player

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
