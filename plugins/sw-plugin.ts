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
                    // 开发环境的简化版 Service Worker
                    const devSW = `
                        // Development Service Worker
                        self.addEventListener('install', () => {
                            console.log('[SW] Dev mode - Service Worker installed');
                            self.skipWaiting();
                        });
                        self.addEventListener('activate', (event) => {
                            console.log('[SW] Dev mode - Service Worker activated');
                            event.waitUntil(self.clients.claim());
                        });
                        self.addEventListener('fetch', (event) => {
                            // 开发环境不拦截请求，直接通过网络
                            // console.log('[SW] Dev mode - Fetch:', event.request.url);
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
