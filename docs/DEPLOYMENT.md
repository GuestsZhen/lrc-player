# LRC Player 部署指南

## 概述

LRC Player 使用 GitHub Actions 自动部署到 GitHub Pages。

## 前置条件

- GitHub 仓库
- Node.js 20+
- pnpm 10.11.0+

## 自动部署配置

### 1. GitHub Pages 设置

访问仓库设置页面：`https://github.com/{owner}/{repo}/settings/pages`

**重要**: 确保 Source 设置为 **"GitHub Actions"**，而不是 "Deploy from a branch"。

### 2. 工作流文件

项目包含以下 GitHub Actions 工作流：

#### `.github/workflows/deploy.yml` - 生产部署
- **触发条件**: 
  - 推送到 `master` 分支
  - 手动触发 (workflow_dispatch)
- **功能**: 构建并部署到 GitHub Pages
- **输出**: `https://{owner}.github.io/{repo}/`

#### `.github/workflows/build.yml` - CI 检查
- **触发条件**: 
  - 所有分支的推送
  - Pull Request
- **功能**: 
  - 代码格式化检查 (`pnpm check:fmt`)
  - Lint 检查 (`pnpm check:lint`)
  - 构建测试 (`pnpm build`)

## 本地开发

### 安装依赖

```bash
pnpm install
```

### 启动开发服务器

```bash
pnpm start
# 或
pnpm run start
```

访问 `http://localhost:5173` (默认端口)

### 构建生产版本

```bash
pnpm build
```

构建输出位于 `build/` 目录。

### 代码质量检查

```bash
# 格式化检查
pnpm check:fmt

# Lint 检查
pnpm check:lint

# 运行所有检查
pnpm run "/check\:/"
```

## 部署流程

### 自动部署

1. 提交代码到 `master` 分支
2. 推送至 GitHub
3. GitHub Actions 自动触发部署
4. 约 2-3 分钟后完成部署

查看部署状态：`https://github.com/{owner}/{repo}/actions`

### 手动触发部署

如果自动部署失败或需要重新部署：

1. 访问：`https://github.com/{owner}/{repo}/actions/workflows/deploy.yml`
2. 点击 "Run workflow"
3. 选择分支：`master`
4. 点击 "Run workflow"

或使用 Git 命令触发：

```bash
git commit --allow-empty -m "ci: 触发部署"
git push origin master
```

## 常见问题

### 1. 部署失败 - 包管理器不匹配

**问题**: 工作流使用 npm，但项目使用 pnpm

**解决**: 确保 `deploy.yml` 中：
- 使用 `cache: 'pnpm'`
- 安装 pnpm: `uses: pnpm/action-setup@v2`
- 使用 `pnpm install` 和 `pnpm run build`

### 2. Lint 检查失败

**问题**: 未使用的变量或导入导致 CI 失败

**解决**: 
- 删除未使用的代码
- 或将未使用但需保留的变量前缀改为 `_`（如 `_unusedVar`）

常见 lint 错误：
```typescript
// ❌ 错误 - 未使用的变量
const unusedVar = ...

// ✅ 正确 - 添加下划线前缀
const _unusedVar = ...
```

### 3. 构建路径问题

**问题**: GitHub Pages 资源加载失败

**解决**: 确保 `vite.config.ts` 中：
```typescript
export default defineConfig({
    base: "./",  // 使用相对路径
    build: {
        outDir: "build",
        // ...
    }
});
```

### 4. gh-pages 分支冲突

**问题**: 同时存在旧的 gh-pages 分支和新的 Actions 部署

**解决**: 
- 如果使用 GitHub Actions 部署，可以删除 gh-pages 分支
- 或在 Settings > Pages 中切换为 "GitHub Actions" 模式

```bash
# 删除远程 gh-pages 分支（谨慎操作）
git push origin --delete gh-pages
```

## 版本管理

### 更新版本号

```bash
# 补丁版本 (0.0.x)
pnpm version:patch

# 次版本 (0.x.0)
pnpm version:minor

# 主版本 (x.0.0)
pnpm version:major
```

这会自动：
1. 更新 `package.json` 中的版本号
2. 创建 git tag
3. 提交更改

## Docker 部署

项目提供 Dockerfile 用于容器化部署：

```bash
# 构建镜像
docker build -t lrc-player .

# 运行容器
docker run -p 80:80 lrc-player
```

## 环境变量

无需特殊环境变量配置。构建时会自动注入：
- Git commit hash
- 构建时间
- 应用版本号

这些信息可在运行时通过 `import.meta.env.app` 访问。

## 监控和维护

### 查看部署日志

1. 访问：`https://github.com/{owner}/{repo}/actions`
2. 选择最近的工作流运行
3. 查看详细日志

### 回滚部署

如果需要回滚到之前的版本：

1. 找到之前成功的 commit
2. 回退到该 commit：
   ```bash
   git revert <commit-hash>
   git push origin master
   ```
3. 或使用 GitHub UI 恢复之前的部署

### 清理缓存

如果更新后页面未刷新：

1. 强制刷新浏览器：`Ctrl + Shift + R` (Windows/Linux) 或 `Cmd + Shift + R` (Mac)
2. 清除 Service Worker 缓存
3. 或使用无痕模式访问

## 技术栈

- **前端框架**: React 18
- **构建工具**: Vite 6
- **语言**: TypeScript
- **包管理器**: pnpm
- **音频处理**: Web Audio API, WaveSurfer.js, SoundTouchJS
- **代码检查**: oxlint, dprint

## 支持

如有问题，请查看：
- GitHub Issues: `https://github.com/GuestsZhen/lrc-player/issues`
- 项目文档: `/docs` 目录
