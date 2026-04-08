# 版本管理指南

## 📋 概述

本项目使用自动化版本管理工具来跟踪每次更新。每次修改后，都应该更新版本号和时间戳，以便在 Preferences 页面中查看当前版本信息。

## 🚀 快速开始

### 1. 完成代码修改

在进行功能开发或 Bug 修复后，确保：
- ✅ 代码已测试通过
- ✅ 构建成功 (`npm run build`)
- ✅ 更新了 CHANGELOG.md

### 2. 更新版本号

根据修改的类型，选择合适的版本递增方式：

```bash
# 小修复（默认）- 6.0.3 → 6.0.4
npm run version:patch

# 新功能 - 6.0.3 → 6.1.0
npm run version:minor

# 重大变更 - 6.0.3 → 7.0.0
npm run version:major
```

### 3. 查看更新信息

运行版本脚本后，会显示：
- 当前版本号
- 新版本号
- 更新时间（自动记录当前时间）
- 提交提示

### 4. 验证更新

启动开发服务器或重新构建：

```bash
# 开发模式
npm start

# 或生产构建
npm run build
```

然后在应用中：
1. 导航到 **Preferences** 页面
2. 查看以下信息是否已更新：
   - **版本 (Version)**: 应显示新的版本号
   - **更新时间 (Update time)**: 应显示当前时间
   - **Commit Hash**: Git 提交哈希（如果有 Git）

## 📖 语义化版本说明

本项目遵循 [语义化版本 2.0.0](https://semver.org/lang/zh-CN/) 规范：

格式：`主版本号.次版本号.修订号` (MAJOR.MINOR.PATCH)

### 版本号递增规则

| 类型 | 说明 | 示例 | 何时使用 |
|------|------|------|---------|
| **PATCH** | 修订号 | 6.0.3 → 6.0.4 | Bug 修复、小优化、文档更新 |
| **MINOR** | 次版本号 | 6.0.3 → 6.1.0 | 新功能（向后兼容） |
| **MAJOR** | 主版本号 | 6.0.3 → 7.0.0 | 不兼容的 API 变更 |

### 实际例子

#### PATCH - 小修复
```bash
# 修复 iOS 全屏问题
npm run version:patch
# 结果: 6.0.3 → 6.0.4
```

#### MINOR - 新功能
```bash
# 添加简谱转调功能
npm run version:minor
# 结果: 6.0.3 → 6.1.0
```

#### MAJOR - 重大变更
```bash
# 重构整个架构
npm run version:major
# 结果: 6.0.3 → 7.0.0
```

## 🔧 技术实现

### 版本信息来源

1. **package.json**: 存储版本号
2. **vite.config.ts**: 构建时注入版本信息
   ```typescript
   define: {
       "import.meta.env.app": JSON.stringify({ 
           hash,           // Git commit hash
           updateTime,     // 当前构建时间
           version         // package.json 中的版本
       })
   }
   ```

3. **Preferences 页面**: 显示版本信息
   - `import.meta.env.app.version` - 版本号
   - `import.meta.env.app.updateTime` - 更新时间
   - `import.meta.env.app.hash` - Commit Hash

### 自动时间戳

每次运行 `npm start` 或 `npm run build` 时：
- `updateTime` 会自动设置为当前时间
- 这确保了 Preferences 页面始终显示最新的构建/更新时间

## 📝 完整工作流程

### 标准更新流程

```bash
# 1. 完成代码修改和测试

# 2. 更新 CHANGELOG.md
# 在 [Unreleased] 部分添加本次更新内容

# 3. 递增版本号（根据修改类型选择）
npm run version:patch    # 或 version:minor / version:major

# 4. 本地测试
npm run build
npm start

# 5. 验证 Preferences 页面的版本信息已更新

# 6. 提交到 Git
git add .
git commit -m "chore: bump version to 6.0.4

- 修复 iOS 全屏兼容性问题
- 更新 README 文档
- 添加版本管理脚本"

# 7. 推送到 GitHub
git push origin main
```

### 紧急修复流程

```bash
# 1. 修复 Bug

# 2. 快速递增版本号
npm run version:patch

# 3. 构建并测试
npm run build

# 4. 提交
git add .
git commit -m "fix: 紧急修复 XXX 问题"
git push origin main
```

## 💡 最佳实践

### 1. 每次更新都要记录

在 CHANGELOG.md 中详细记录：
- 修改的文件
- 修改的原因
- 影响的功能
- 测试结果

### 2. 选择合适的版本号

- **频繁小更新**: 使用 `version:patch`
- **每周/每月总结**: 可以合并为一次 `version:minor`
- **重大重构**: 谨慎使用 `version:major`

### 3. 保持一致性

- 版本号更新 ↔️ CHANGELOG 更新 ↔️ Git 提交
- 三者应该对应同一次更新

### 4. 利用 Preferences 页面

在测试时，始终检查 Preferences 页面：
- 确认版本号正确
- 确认更新时间是最近的
- 如果显示旧版本，可能需要重新构建

## 🔍 故障排查

### 问题 1: Preferences 显示旧版本

**原因**: 使用了缓存的构建文件

**解决**:
```bash
# 清理构建目录
rm -rf build/

# 重新构建
npm run build

# 或在开发模式中刷新浏览器（清除缓存）
```

### 问题 2: 更新时间没有变化

**原因**: vite.config.ts 可能被缓存

**解决**:
```bash
# 重启开发服务器
# Ctrl+C 停止，然后重新启动
npm start
```

### 问题 3: 版本号没有递增

**原因**: 可能忘记运行版本脚本

**解决**:
```bash
# 手动运行
npm run version:patch

# 检查 package.json 中的 version 字段
```

## 📊 版本历史示例

```
6.0.4 (2026-04-05)
  - 修复 iOS 全屏兼容性
  - 添加版本管理脚本
  - 更新 README 文档

6.0.3 (2026-04-01)
  - 初始发布
  - 简谱转调功能
  - 歌词同步器
```

## 🎯 总结

- ✅ 每次更新后运行 `npm run version:patch`（或其他）
- ✅ 在 CHANGELOG.md 中记录变更
- ✅ 检查 Preferences 页面确认版本信息
- ✅ 测试完成后提交到 GitHub

这样可以确保：
1. 每个版本都有明确的标识
2. 可以轻松追溯更新时间
3. 用户可以看到当前使用的版本
4. 便于调试和问题追踪
