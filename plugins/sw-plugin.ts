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
                    // ✅ 开发环境：不缓存策略，直接通过网络获取资源
                    const devSW = `
                        const APP_NAME = "lrc-player";
                        
                        // 安装阶段：跳过等待
                        self.addEventListener('install', (event) => {
                            self.skipWaiting();
                        });
                        
                        // 激活阶段：接管所有客户端
                        self.addEventListener('activate', (event) => {
                            event.waitUntil(
                                self.clients.claim()
                            );
                        });
                        
                        // 拦截请求：网络优先策略（不缓存）
                        self.addEventListener('fetch', (event) => {
                            if (event.request.method !== 'GET') return;
                            
                            const url = new URL(event.request.url);
                            
                            // 跳过非 http/https 协议
                            if (url.protocol !== 'http:' && url.protocol !== 'https:') return;
                            
                            // 只处理同源请求
                            if (url.origin !== self.location.origin) return;
                            
                            // 直接通过网络获取，不缓存
                            event.respondWith(
                                fetch(event.request).catch(() => {
                                    // 网络失败时返回离线提示
                                    if (url.pathname.endsWith('/') || url.pathname.endsWith('.html')) {
                                        return new Response('Development Mode - Offline', { 
                                            status: 503,
                                            headers: { 'Content-Type': 'text/plain' }
                                        });
                                    }
                                    return new Response('Offline', { status: 503 });
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
