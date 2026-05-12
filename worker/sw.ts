const swWorker = self as unknown as ServiceWorkerGlobalScope;

const APP_NAME = "akari-lrc-player";
const VERSION = import.meta.env.app.version;
const HASH = import.meta.env.app.hash;
const CACHENAME = `${APP_NAME}-${VERSION}-${HASH}`;

// ✅ 预缓存的关键资源列表（使用相对路径）
const PRECACHE_URLS = [
    "./",
    "./index.html",
];

swWorker.addEventListener("install", (event) => {
    swWorker.skipWaiting();
    
    // ✅ 预缓存关键资源
    event.waitUntil(
        caches.open(CACHENAME).then((cache) => {
            return cache.addAll(PRECACHE_URLS).catch((err) => {
                console.error("Failed to precache:", err);
            });
        })
    );
});

swWorker.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all<unknown>([
                swWorker.clients.claim(),
                ...cacheNames
                    .filter((cacheName) => {
                        return cacheName.startsWith(APP_NAME) && cacheName !== CACHENAME;
                    })
                    .map((cacheName) => {
                        return caches.delete(cacheName);
                    }),
            ]);
        }),
    );
});

swWorker.addEventListener("fetch", (event) => {
    if (event.request.method !== "GET") {
        return;
    }

    const url = new URL(event.request.url);

    // 跳过非 http/https 协议的请求（如 chrome-extension）
    if (url.protocol !== "http:" && url.protocol !== "https:") {
        return;
    }

    // ✅ 离线模式：跳过所有外部 CDN 请求，只缓存本地资源
    if (url.origin !== swWorker.location.origin) {
        // 不拦截外部请求（CDN、第三方 API 等）
        return;
    }

    // ✅ 缓存关键资源：HTML, CSS, JS, SVG, 字体, 图片
    const isCacheable = /(?:\.css|\.js|\.svg|\.woff2?|\.ttf|\.png|\.jpg|\.jpeg|\.gif|\.ico|\.webmanifest)$/i.test(url.pathname)
        || url.pathname.endsWith("/")
        || url.pathname.endsWith("/index.html")
        || url.pathname === swWorker.location.pathname;
    
    if (!isCacheable) {
        return;
    }

    // ✅ 离线优先策略：缓存优先，网络回退
    event.respondWith(
        caches.match(event.request).then((match) => {
            // 缓存命中，直接返回
            if (match) {
                return match;
            }

            // 缓存未命中，尝试网络请求
            return caches.open(CACHENAME).then((cache) => {
                return fetch(event.request)
                    .then((response) => {
                        // 网络请求成功，缓存响应
                        if (response.status === 200) {
                            cache.put(event.request, response.clone());
                        }
                        return response;
                    })
                    .catch(() => {
                        // ✅ 离线且缓存未命中：返回友好的离线页面
                        // 对于 HTML 请求，返回缓存的 index.html
                        if (url.pathname.endsWith("/") || url.pathname.endsWith(".html")) {
                            return caches.match("./index.html").then((fallback) => {
                                return fallback || new Response("Offline", { status: 503 });
                            });
                        }
                        // 其他资源返回错误
                        return new Response("Offline - Resource not available", {
                            status: 503,
                            statusText: "Service Unavailable",
                        });
                    });
            });
        }),
    );
});
