<p align="center">
    <a href="https://guestszhen.github.io/lrc-player">
        <img src="./public/favicons/lrc-icon.svg" alt="logo" width="96" />
    </a>
</p>

<p align="center">
    <a href="README.md">中文</a> | 
    <a href="#">English</a>
</p>

# Numbered Musical Notation LRC Player

## What is this project?

This is a numbered musical notation (Jianpu) playback tool based on Akari's lrc-maker. The original program was a scrolling lyrics production tool, and we have added features such as movable-do solfeggio transposition, independent playback interface, and playlist functionality.

Thanks to Akari, the original project can be found at: https://github.com/magic-akari/lrc-maker

## Main Features

### 🎯 Core Modules

#### 1. Lyrics Editor (Editor)
- 📝 Visual lyrics editing interface
- 🏷️ Support for inserting and managing time tags
- 💾 Lyrics import/export functionality
- ☁️ GitHub Gist cloud synchronization
- 📋 Copy and download lyrics files
- 🔧 Lyrics metadata editing (title, artist, etc.)

#### 2. Lyrics Synchronizer (Synchronizer)
- ⏱️ Real-time lyrics timeline synchronization
- 🎮 Two synchronization modes:
  - **Selection Mode**: Manually select lines and mark timestamps
  - **Highlight Mode**: Automatically highlight following playback
- ⌨️ Keyboard shortcut support
- 🔄 Smooth scrolling to current line
- ⚡ Time tag fine-tuning functionality

#### 3. Player (Player)
- 🎵 Independent full-screen playback interface
- 🎨 Highly customizable:
  - Font size adjustment
  - Alignment options (left/center/right)
  - Background color customization
  - Lyrics color customization
  - Timeline display toggle
- 🌓 Theme adaptation (light/dark)
- 🖥️ Full-screen mode support

#### 4. Numbered Notation Transposition Tool (Tune) ⭐Featured Feature
- 🎼 **Movable-do solfeggio transposition** (core feature)
- 🔄 Numbered notation to note name mapping conversion
- 🎹 Support for octave markers:
  - `(5)` indicates lower octave
  - `[5]` indicates higher octave
- 📊 Accidental support (#1, b2, etc.)
- 🌍 Multi-key transposition (C key, D key, etc.)
- 📋 Conversion result preview and export

#### 5. Lyrics Toolbox (Lrc-utils)
- 🔧 Various practical tools:
  - **Lyrics Compression**: Remove extra spaces and tags
  - **Time Offset**: Batch adjust timestamps
  - **Time Transformation**: Linear time conversion (y = ax + c)
  - **Translation Split**: Separate bilingual lyrics
  - **Tag Removal**: Clean metadata tags
- 📥 Original text and processed text comparison
- 💾 Overwrite mode support

#### 6. Preferences (Preferences)
- 🎨 Theme settings (auto/light/dark)
- ⌨️ Custom keyboard shortcuts
- 🌐 Multi-language switching (EN/ZH-CN/ZH-TW)
- 📝 Editor configuration
- 🎵 Audio playback settings

#### 7. Gist Cloud Sync (Gist)
- ☁️ GitHub Gist integration
- 🔐 OAuth authentication
- 📤 Upload lyrics to cloud
- 📥 Load lyrics from cloud
- 🗂️ Gist management interface

#### 8. Beta ST Player (player-soundtouch)
- 🎵 Song transposition support
- 🎤 Vocal removal (instrumental mode) - Uses phase cancellation to remove centered vocals
- Technical limitations: Cannot adjust playback progress or seek to specific timestamps

#### 9. File Manager ⭐New
- 📂 Local audio file scanning and management
- 🎶 Playlist management (add, remove, reorder)
- 💾 IndexedDB persistent storage
- 🔄 Cross-component state synchronization (Zustand Stores)
- 📱 Web and Android dual-platform support

### 🛠️ Technical Features

- **Frontend Architecture**: React 18 + TypeScript + Vite 6
- **State Management**: Zustand - Lightweight global state management library ⭐New
- **Audio Processing**: WaveSurfer.js waveform visualization
- **Internationalization**: Three-language support (English, Simplified Chinese, Traditional Chinese)
- **Data Processing**: @lrc-maker/lrc-parser lyrics parsing library
- **PWA Support**: Service Worker offline caching, installable as desktop app
- **Responsive Design**: Supports desktop and mobile devices

## How to Use

### Basic Operations
Drag and drop files into the page to load them, use arrow keys and spacebar to insert timestamps. You can bookmark this link in your browser.

Live Demo: https://guestszhen.github.io/lrc-player

### 💡 Use Cases

1. **Music Producers**: Create precise timeline lyrics for numbered notation songs
2. **KTV Systems**: Create karaoke subtitle files
3. **Music Education**: Numbered notation teaching and transposition practice
4. **Lyrics Enthusiasts**: Organize and beautify lyrics files
5. **Developers**: Learn React + TypeScript best practices

## Hotkeys

|                            Keys                             |        Function        |
| :---------------------------------------------------------: | :----------------: |
|                      <kbd>space</kbd>                       |    Insert time tag    |
|   <kbd>backspace</kbd> / <kbd>delete</kbd> / <kbd>⌫</kbd>   |    Remove time tag    |
| <kbd>ctrl</kbd><kbd>enter↵</kbd> / <kbd>⌘</kbd><kbd>↩</kbd> |    Play / Pause     |
|                 <kbd>←</kbd> / <kbd>A</kbd>                 |     Rewind 5 seconds      |
|                 <kbd>→</kbd> / <kbd>D</kbd>                 |     Forward 5 seconds      |
|         <kbd>↑</kbd> / <kbd>W</kbd> / <kbd>J</kbd>          |     Select previous line     |
|         <kbd>↓</kbd> / <kbd>S</kbd> / <kbd>K</kbd>          |     Select next line     |
|                 <kbd>-</kbd> / <kbd>+</kbd>                 | Fine-tune current line time tag |
|   <kbd>ctrl</kbd><kbd>↑</kbd> / <kbd>⌘</kbd><kbd>↑</kbd>    |    Increase playback speed    |
|   <kbd>ctrl</kbd><kbd>↓</kbd> / <kbd>⌘</kbd><kbd>↓</kbd>    |    Decrease playback speed    |
|                        <kbd>R</kbd>                         |    Reset playback speed    |

## Compatibility

This project uses modern browser APIs to improve performance and user experience, and uses ES Module to load code.

Recommended browser versions:

| Browser  | Version  |
| :------ | :---- |
| Chrome  | >= 61 |
| Firefox | >= 60 |
| Safari  | >= 11 |
| Edge    | >= 79 |

## Local Development

If you want to run this project on your local machine, follow the steps below.

```bash
# Clone this repository
git clone https://github.com/GuestsZhen/lrc-player.git

cd lrc-player

# Install dependencies
pnpm install

# Build
pnpm build

# Development mode
pnpm start
```

```

## Production Deployment

After building (`npm run build`), the `build` folder contains static website files.
You can deploy it to any CDN or static file server.

You can also use the `Dockerfile` in the root directory of this repository to build a docker image.
It runs the build and creates a minimized nginx image.

```bash
# Build
docker build -t lrc-player .
# Create a container and serve on port 8080
docker run -d -p 8080:80 lrc-player
```

## Give this project a star :star:

If you like this project, please give it a star :star:, and share this project to help more people.
