import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./components/app.js";
import { initializePlayerSettings } from "./stores/playerSettings.js";
import { initializeNotificationControls } from "./utils/notification-controls.js";

if (!("scrollBehavior" in document.documentElement.style)) {
    import("./polyfill/smooth-scroll.js");
}

// ✅ 异步初始化 Player 设置（从 Capacitor Preferences 加载）
// 必须等待初始化完成后再渲染 App，确保组件读取到正确的值
initializePlayerSettings()
  .then(() => {
    // ✅ 初始化通知栏控制（Android）
    initializeNotificationControls();
    
    const root = createRoot(document.querySelector(".app-container")!);
    root.render(createElement(App));
  })
  .catch((error) => {
    // 即使初始化失败，也要渲染 App
    initializeNotificationControls();
    const root = createRoot(document.querySelector(".app-container")!);
    root.render(createElement(App));
  });

if (!navigator.standalone && !window.matchMedia("(display-mode: standalone)").matches) {
    document.addEventListener("click", (ev) => {
        const href = (ev.target as HTMLAnchorElement).getAttribute("href");

        if (href?.startsWith("#") === true) {
            ev.preventDefault();
            location.replace(href);
        }
    });
}

window.addEventListener("dragover", (ev) => {
    ev.preventDefault();
    ev.dataTransfer!.dropEffect = "copy";
});
window.addEventListener("drop", (ev) => {
    ev.preventDefault();
});
