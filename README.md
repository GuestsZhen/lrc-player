<p align="center">
    <a href="https://lrc-player.github.io">
        <img src="./public/favicons/apple-touch-icon.png" alt="logo" />
    </a>
</p>

<div align="center">

[English](./README.md) · [中文](./README-zh.md)

</div>

# [LRC Player][lrc player] &middot; [![Build](https://github.com/magic-akari/lrc-player/actions/workflows/build.yml/badge.svg)](https://github.com/magic-akari/lrc-player/actions/workflows/build.yml)

## What is this

This is a tool for creating scrolling lrc files, which refers to text with time tags.

## Why lrc-player

I'm not satisfied with the existing tools, they can't be used across platforms. So I have created one by myself.

## How to use

Click [lrc-player][lrc player] to start. You can add the link to browser bookmark. Drag and drop the file in the page to load it and use the arrow key and space key to insert the timestamp.

Development branch links:

- https://magic-akari.github.io/lrc-player/
- https://lrc-player.vercel.app/

## Hotkeys

|                             key                             |         function         |
| :---------------------------------------------------------: | :----------------------: |
|                      <kbd>space</kbd>                       |  insert time stamp tag   |
|   <kbd>backspace</kbd> / <kbd>delete</kbd> / <kbd>⌫</kbd>   |  remove time stamp tag   |
| <kbd>ctrl</kbd><kbd>enter↵</kbd> / <kbd>⌘</kbd><kbd>↩</kbd> |       play / pause       |
|                 <kbd>←</kbd> / <kbd>A</kbd>                 | step backward 5 seconds  |
|                 <kbd>→</kbd> / <kbd>D</kbd>                 |  step forward 5 seconds  |
|         <kbd>↑</kbd> / <kbd>W</kbd> / <kbd>J</kbd>          |   select previous line   |
|         <kbd>↓</kbd> / <kbd>S</kbd> / <kbd>K</kbd>          |     select next line     |
|                 <kbd>-</kbd> / <kbd>+</kbd>                 | adjust selected time tag |
|   <kbd>ctrl</kbd><kbd>↑</kbd> / <kbd>⌘</kbd><kbd>↑</kbd>    |  speed up playback rate  |
|   <kbd>ctrl</kbd><kbd>↓</kbd> / <kbd>⌘</kbd><kbd>↓</kbd>    | speed down playback rate |
|                        <kbd>R</kbd>                         |   reset playback rate    |

## Compatibility

The most modern browsers are supported. The current version uses a lot of modern browser APIs to improve performance and improve the user experience. This project uses the ES Module to load the script code, which means that the browser version should meet the following requirements.

| browser | version |
| :------ | :------ |
| EDGE    | >= 16   |
| Firefox | >= 60   |
| Chrome  | >= 61   |
| Safari  | >= 11   |
| ios_saf | >= 11   |

<del>
The current version of Edge should be supported theoretically, but there are unexplained reasons for the code to not run after loading. This problem is left to be observed after the Edge with the V8 kernel is released.
</del>

Limited support for EDGE browsers.

The browsers which do not have ES Module support will load the fallback script. Note: The fallback is not tested. The old browsers may encounter CSS layout confusion.

Ancient browsers such as IE are no longer supported. If you are an ancient browser user, it is better to use [the old version][version 3.x] of this project.

## Development

If you want to run this project on your computer locally, follow the tips.

```bash
# clone this repo
git clone https://github.com/magic-akari/lrc-player.git

cd lrc-player

# install dependencies
npm i

# build
npm run build

# or build with watch mode
npm start
```

## Deployment in Production

After building (`npm run build`), the `build` folder is the static website files.
You can deploy it to any CDN or static file server.

You can also build a docker image using the `Dockerfile` at the root of this repo.
It runs the build and give you a minimal nginx image.

```bash
# build image
docker build -t lrc-player .
# create a container and serve at port 8080
docker run -d -p 8080:80 lrc-player
```

## Star this project :star:

If you like give us a star :star: Also share this project to help more people.

---

[lrc player]: https://lrc-player.github.io
[version 3.x]: https://lrc-player.github.io/3.x
