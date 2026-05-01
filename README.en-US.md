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

## 📱 Dual Platform Support

- **Web Version**: Use in browser, supports PWA offline access
- **Android Version**: Native app, fully offline, supports MediaStore API to scan local music library

### 📥 Download Android APK

Latest Version: - [View Releases](https://github.com/GuestsZhen/lrc-player/releases/latest)

> ⚠️ **First Time Setup**: Please grant storage permissions after installation to access local music files

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
- ⚠️ Technical limitations: Cannot adjust playback progress or seek to specific timestamps
- 🌐 **Web environment only**, not supported on Android

#### 9. Android Exclusive Features ⭐Completed
- 🎵 **MediaStore API Integration** - Direct system media library scanning
- 📁 **Folder Picker** - Capacitor FilePicker native file selection
- 💾 **Preferences Storage** - Capacitor Preferences persistent configuration
- 🔌 **Fully Offline** - All dependencies packaged in APK, no network required
- 🎨 **Platform Adaptation** - Auto-detect platform, seamless Web/Android switching
- 🎤 **Vocal Removal** - Phase cancellation to remove centered vocals (instrumental mode)
- 🎼 **Pitch Adjustment** - ±12 semitone key adjustment
- ⚡ **Speed Control** - 0.5x - 2.0x playback speed control

### 🛠️ Technical Features

- **Frontend Architecture**: React 18 + TypeScript + Vite 6
- **State Management**: Zustand - Lightweight global state management library ⭐Completed
- **Audio Processing**: WaveSurfer.js waveform visualization
- **Internationalization**: Three-language support (English, Simplified Chinese, Traditional Chinese)
- **Data Processing**: @lrc-maker/lrc-parser lyrics parsing library
- **PWA Support**: Service Worker offline caching, installable as desktop app
- **Responsive Design**: Supports desktop and mobile devices
- **📱 Android Support**: Capacitor 8 + MediaStore API + Fully Offline

## How to Use 🌐 Web Version

**Live Demo**: https://guestszhen.github.io/lrc-player

Drag and drop files into the page to load them, use arrow keys and spacebar to insert timestamps. You can bookmark this link in your browser.

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

### Web Version Development

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

### Android Version Development

```bash
# Prerequisites
# - Java JDK 21
# - Android SDK
# - Node.js

# Install dependencies
npm install

# Add Android platform (first time only)
npx cap add android

# Standard deployment command (recommended)
npm run cap:android:deploy

# Or open in Android Studio
npx cap open android
```
```



## 📚 Documentation

### Core Documentation
- [PROJECT-ARCHITECTURE.md](docs/PROJECT-ARCHITECTURE.md) - Project Architecture Details
- [DEPLOYMENT.md](docs/DEPLOYMENT.md) - Web Version Deployment Guide

### Android Development
- [ANDROID-CAPACITOR-STATUS.md](docs/ANDROID-CAPACITOR-STATUS.md) - Capacitor Migration Status
- [ANDROID-MEDIASTORE-DEBUG-GUIDE.md](docs/ANDROID-MEDIASTORE-DEBUG-GUIDE.md) - MediaStore Debugging Guide

---

## Production Deployment

### Web Version

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

### Android Version

```bash
# Build Release APK
cd android
./gradlew assembleRelease

# Or build AAB (for Google Play release)
./gradlew bundleRelease
```

---

## Give this project a star :star:

If you like this project, please give it a star :star:, and share this project to help more people.
