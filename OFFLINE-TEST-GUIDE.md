# 离线功能测试指南

## 🔧 已修复的问题

### 1. APP_NAME 不一致
- **问题**：之前使用 `"akari-lrc-maker"` 和 `"akari-lrc-player"`，命名不统一
- **影响**：导致卸载 Service Worker 时无法正确清理缓存
- **修复**：统一使用 `"lrc-player"`

### 2. 预缓存路径问题
- **问题**：使用绝对路径 `/` 和 `/index.html`，在某些部署环境下可能失败
- **修复**：改用相对路径 `./` 和 `./index.html`

### 3. 离线策略缺陷
- **问题**：原策略在离线时如果资源不在缓存中，`fetch()` 会抛出异常且未处理
- **修复**：实现完整的错误处理机制
  - HTML 请求：返回缓存的 `index.html` 作为 fallback
  - 其他资源：返回 503 错误响应

### 4. 缓存策略优化
- **原策略**：缓存 → 网络 → 缓存（无错误处理）
- **新策略**：缓存优先 → 网络回退 → 错误处理（离线友好）

---

## 🧪 测试步骤

### 准备工作

1. **构建生产版本**
   ```bash
   npm run build
   ```

2. **启动本地服务器**（需要使用支持 HTTPS 的服务器，因为 Service Worker 需要安全上下文）
   
   **选项 A：使用 http-server（推荐）**
   ```bash
   npm install -g http-server
   cd build
   http-server -p 8080 --ssl --cert certs/cert.pem --key certs/key.pem
   ```

   **选项 B：使用 Python 简易服务器**（仅用于快速测试）
   ```bash
   cd build
   python3 -m http.server 8080
   ```
   > ⚠️ 注意：Python 服务器不支持 HTTPS，Service Worker 可能无法注册

3. **访问应用**
   - 打开浏览器访问 `http://localhost:8080`（或你的服务器地址）
   - 打开开发者工具（F12）→ Application/应用 → Service Workers

---

### 测试 1：Service Worker 注册检查

**步骤：**
1. 首次访问页面
2. 打开开发者工具 → Console
3. 检查是否有以下日志：
   ```
   ServiceWorker Registed (｡･ω･｡)ﾉ:  https://your-domain.com/
   ```

**预期结果：**
- ✅ Service Worker 成功注册
- ✅ 状态显示 "activated and is running"
- ✅ Cache Storage 中出现名为 `lrc-player-7.0.2-xxxxx` 的缓存

**失败排查：**
- ❌ 如果看到 "registration failed"，检查：
  - 是否在 HTTPS 环境下（localhost 除外）
  - 浏览器是否支持 Service Worker
  - 是否有控制台错误信息

---

### 测试 2：预缓存验证

**步骤：**
1. 打开开发者工具 → Application → Cache Storage
2. 点击 `lrc-player-7.0.2-xxxxx` 缓存
3. 查看缓存的资源列表

**预期结果：**
- ✅ 至少包含以下资源：
  - `./` 或根路径
  - `./index.html`
- ✅ 随着浏览，应该逐渐缓存更多资源（CSS、JS、SVG 等）

---

### 测试 3：在线模式功能测试

**步骤：**
1. 确保网络连接正常
2. 访问应用的各个页面：
   - 首页 (/)
   - 编辑器 (/editor)
   - 同步器 (/synchronizer)
   - 播放器 (/player)
   - 转调页面 (/tune)
3. 加载一些音频文件和 LRC 文件
4. 刷新页面多次

**预期结果：**
- ✅ 所有页面正常加载
- ✅ 资源被逐步缓存到 Cache Storage
- ✅ 控制台没有错误

---

### 测试 4：离线模式测试（核心测试）

**方法 A：使用开发者工具模拟离线**

1. **准备工作**
   - 先在线访问所有主要页面，确保资源已缓存
   - 打开开发者工具 → Application → Service Workers
   - 确认 Service Worker 处于激活状态

2. **启用离线模式**
   - 打开开发者工具 → Network/网络 标签
   - 找到 "Throttling/节流" 下拉菜单
   - 选择 "Offline/离线"

3. **测试页面导航**
   - 刷新当前页面
   - 尝试访问之前访问过的页面
   - 尝试访问新的页面（未缓存的）

4. **预期结果**
   - ✅ 已缓存的页面：正常显示
   - ✅ 未缓存的 HTML 页面：显示应用首页（fallback 到 index.html）
   - ✅ 未缓存的资源（图片、字体等）：可能显示破损，但不影响核心功能
   - ✅ 控制台可能出现 503 错误，但应用仍可正常使用

**方法 B：断开网络连接**

1. **准备工作**
   - 在线访问所有主要页面
   - 关闭浏览器标签页
   - 断开网络连接（关闭 WiFi 或拔掉网线）

2. **重新访问**
   - 重新打开浏览器
   - 访问 `http://localhost:8080`（或之前访问过的 URL）

3. **预期结果**
   - ✅ 应用能够正常加载
   - ✅ 之前访问过的功能可以正常使用
   - ✅ 可以播放已加载的音频文件
   - ✅ 可以查看已加载的歌词

---

### 测试 5：Service Worker 更新测试

**步骤：**
1. 修改 `worker/sw.ts` 文件（例如添加注释）
2. 重新构建：`npm run build`
3. 刷新页面
4. 观察开发者工具 → Application → Service Workers

**预期结果：**
- ✅ 检测到新的 Service Worker
- ✅ 旧版本缓存被清理
- ✅ 新版本缓存被创建
- ✅ 应用自动使用新版本

---

### 测试 6：缓存清理测试

**步骤：**
1. 打开开发者工具 → Application → Service Workers
2. 点击 "Unregister" 按钮
3. 或者在控制台执行：
   ```javascript
   navigator.serviceWorker.getRegistration().then(reg => reg.unregister())
   ```
4. 刷新页面

**预期结果：**
- ✅ Service Worker 被成功卸载
- ✅ 所有 `lrc-player-*` 缓存被清理
- ✅ 页面重新加载后 Service Worker 重新注册

---

## 🐛 常见问题排查

### 问题 1：Service Worker 无法注册

**可能原因：**
- 不在 HTTPS 环境下（localhost 除外）
- 浏览器不支持 Service Worker
- 路径配置错误

**解决方案：**
```javascript
// 在控制台检查
console.log('serviceWorker' in navigator);  // 应该返回 true
console.log(location.protocol);             // 应该是 https: 或 localhost
```

---

### 问题 2：离线时页面空白

**可能原因：**
- 资源未被正确缓存
- Fallback 策略未生效

**解决方案：**
1. 检查 Cache Storage 中是否有缓存
2. 检查控制台是否有错误
3. 确认 `index.html` 已被缓存

---

### 问题 3：缓存不更新

**可能原因：**
- Service Worker 版本未变化
- 浏览器强制使用旧缓存

**解决方案：**
1. 在开发者工具中勾选 "Update on reload"
2. 或手动清除缓存：Application → Clear storage → Clear site data
3. 硬刷新：Ctrl+Shift+R (Windows) / Cmd+Shift+R (Mac)

---

### 问题 4：某些资源离线时无法加载

**可能原因：**
- 资源类型不在缓存白名单中
- 外部 CDN 资源被跳过（这是预期行为）

**解决方案：**
1. 检查 `sw.ts` 中的 `isCacheable` 正则表达式
2. 如需缓存更多类型，添加对应的文件扩展名
3. 考虑将关键的外部资源下载到本地

当前支持的缓存类型：
```typescript
.css, .js, .svg, .woff2, .woff, .ttf, 
.png, .jpg, .jpeg, .gif, .ico, .webmanifest
```

---

## 📊 测试检查清单

完成以下检查项以确认离线功能正常工作：

- [ ] Service Worker 成功注册
- [ ] 预缓存包含 index.html
- [ ] 在线模式下所有页面正常访问
- [ ] 资源被正确缓存到 Cache Storage
- [ ] 离线模式下已缓存页面可正常访问
- [ ] 离线模式下未缓存 HTML 回退到 index.html
- [ ] 离线模式下应用核心功能可用
- [ ] Service Worker 更新机制正常
- [ ] 缓存清理功能正常
- [ ] 控制台无严重错误

---

## 🎯 验收标准

离线功能测试通过的标准：

1. ✅ **首次加载**：在线访问后，所有关键资源被缓存
2. ✅ **离线访问**：断网后，应用仍可正常加载和使用
3. ✅ **优雅降级**：未缓存资源不会导致应用崩溃
4. ✅ **缓存更新**：新版本发布后，缓存自动更新
5. ✅ **跨会话持久化**：关闭浏览器后重新打开，离线功能仍然有效

---

## 📝 注意事项

1. **开发环境 vs 生产环境**
   - 开发环境（vite dev）：Service Worker 会被 unregister，便于调试
   - 生产环境（vite build）：Service Worker 正常注册

2. **浏览器兼容性**
   - Chrome/Edge: ✅ 完全支持
   - Firefox: ✅ 完全支持
   - Safari: ⚠️ 部分支持（iOS 11.3+）
   - IE: ❌ 不支持

3. **localhost 特殊性**
   - localhost 允许 HTTP 协议注册 Service Worker
   - 其他域名必须使用 HTTPS

4. **缓存大小限制**
   - 不同浏览器有不同的缓存配额
   - 建议定期清理不再需要的缓存

5. **音频文件缓存**
   - 大型音频文件可能不会被自动缓存
   - 如需离线播放音频，需要实现专门的缓存策略

---

## 🔗 相关文档

- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Cache API](https://developer.mozilla.org/en-US/docs/Web/API/Cache)
- [PWA 最佳实践](https://web.dev/progressive-web-apps/)
- [Workbox](https://developers.google.com/web/tools/workbox) - Google 的 Service Worker 库

---

**最后更新**: 2026-05-12  
**版本**: 7.0.2  
**修复提交**: 9640a62
