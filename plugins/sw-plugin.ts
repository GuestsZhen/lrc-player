import fs from "node:fs";
import type { Plugin } from "vite";

const register = fs.readFileSync(new URL("./sw.register.js", import.meta.url), "utf-8");
const un_register = fs.readFileSync(new URL("../src/utils/sw.unregister.ts", import.meta.url), "utf-8");

export default function(): Plugin {
    let is_prod = false;
    return {
        name: "sw-plugin",
        configResolved(env) {
            is_prod = env.command === "build";
        },
        // ✅ 开发环境也提供 sw.js 文件
        configureServer(server) {
            if (!is_prod) {
                server.middlewares.use("/sw.js", async (req, res) => {
                    res.setHeader("Content-Type", "application/javascript; charset=utf-8");
                    res.setHeader("Service-Worker-Allowed", "/");
                    // ✅ 开发环境的完整功能 Service Worker（支持离线缓存）
                    const devSW = `
                        const APP_NAME = "lrc-player";
                        const CACHENAME = APP_NAME + "-dev-" + Date.now();
                        
                        // 安装阶段：预缓存关键资源
                        self.addEventListener('install', (event) => {
                            self.skipWaiting();
                            
                            event.waitUntil(
                                caches.open(CACHENAME).then((cache) => {
                                    return cache.addAll([
                                        './',
                                        './index.html',
                                        // ✅ 预缓存所有主要路由组件
                                        '/src/components/editor.tsx',
                                        '/src/components/synchronizer.tsx',
                                        '/src/components/player.tsx',
                                        '/src/components/tune.tsx',
                                        '/src/components/lrc-utils.tsx'
                                    ]).catch(err => {
                                        // Precache failed silently
                                    });
                                })
                            );
                        });
                        
                        // 激活阶段：清理旧缓存
                        self.addEventListener('activate', (event) => {
                            event.waitUntil(
                                Promise.all([
                                    self.clients.claim(),
                                    caches.keys().then(keys => 
                                        Promise.all(
                                            keys.filter(key => key.startsWith(APP_NAME + '-dev-') && key !== CACHENAME)
                                                .map(key => caches.delete(key))
                                        )
                                    )
                                ])
                            );
                        });
                        
                        // 拦截请求：缓存优先策略
                        self.addEventListener('fetch', (event) => {
                            if (event.request.method !== 'GET') return;
                            
                            const url = new URL(event.request.url);
                            
                            // 跳过非 http/https 协议
                            if (url.protocol !== 'http:' && url.protocol !== 'https:') return;
                            
                            // 只缓存同源请求
                            if (url.origin !== self.location.origin) return;
                            
                            // 判断是否可缓存
                            const isCacheable = /(?:\\.css|\\.js|\\.svg|\\.woff2?|\\.ttf|\\.png|\\.jpg|\\.jpeg|\\.gif|\\.ico|\\.webmanifest|\\.json|\\.ts)$/i.test(url.pathname)
                                || url.pathname.startsWith('/node_modules/')
                                || url.pathname.startsWith('/src/')
                                || url.pathname.startsWith('/@')
                                || url.pathname.endsWith('/')
                                || url.pathname.endsWith('/index.html');
                            
                            if (!isCacheable) return;
                            
                            // 缓存优先策略
                            event.respondWith(
                                caches.match(event.request).then((cached) => {
                                    if (cached) {
                                        return cached;
                                    }
                                    
                                    // 缓存未命中，从网络获取
                                    return fetch(event.request).then((response) => {
                                        if (response.status === 200) {
                                            const clone = response.clone();
                                            caches.open(CACHENAME).then((cache) => {
                                                cache.put(event.request, clone);
                                            });
                                        }
                                        return response;
                                    }).catch(() => {
                                        // 离线且缓存未命中
                                        if (url.pathname.endsWith('/') || url.pathname.endsWith('.html')) {
                                            return caches.match('./index.html');
                                        }
                                        return new Response('Offline', { status: 503 });
                                    });
                                })
                            );
                        });
                    `;
                    res.end(devSW);
                });
            }
        },
        transformIndexHtml(html) {
            return {
                html,
                tags: [{
                    tag: "script",
                    // ✅ 开发和生产环境都注册 Service Worker，便于离线功能测试
                    children: register,
                    injectTo: "body",
                }],
            };
        },
    };
}
