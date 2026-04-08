# 快速更新指南 ⚡

## 🔄 每次更新的标准流程

### 1️⃣ 完成代码修改
确保代码已测试通过且构建成功。

### 2️⃣ 更新 CHANGELOG.md
在 `[Unreleased]` 部分添加本次更新内容：

```markdown
### Added - 新增
- 你的新功能

### Changed - 修改
- 你的修改

### Fixed - 修复
- 你修复的问题
```

### 3️⃣ 递增版本号

根据修改类型选择：

```bash
# 小修复（最常用）
npm run version:patch      # 6.0.4 → 6.0.5

# 新功能
npm run version:minor      # 6.0.4 → 6.1.0

# 重大变更
npm run version:major      # 6.0.4 → 7.0.0
```

### 4️⃣ 验证版本信息

启动开发服务器：
```bash
npm start
```

打开浏览器访问 Preferences 页面，确认：
- ✅ 版本号已更新
- ✅ 更新时间为当前时间
- ✅ Commit Hash 正确显示

### 5️⃣ 提交到 GitHub

```bash
git add .
git commit -m "type: 简短描述

- 详细修改内容
- 影响的功能模块"
git push origin main
```

---

## 📋 常用命令速查

| 命令 | 说明 | 示例 |
|------|------|------|
| `npm start` | 启动开发服务器 | - |
| `npm run build` | 生产构建 | - |
| `npm run version:patch` | 递增修订号 | 6.0.4 → 6.0.5 |
| `npm run version:minor` | 递增次版本号 | 6.0.4 → 6.1.0 |
| `npm run version:major` | 递增主版本号 | 6.0.4 → 7.0.0 |
| `npm run check:fmt` | 检查代码格式 | - |
| `npm run fix:fmt` | 自动修复格式 | - |
| `npm run check:lint` | Lint 检查 | - |

---

## 🎯 版本号选择指南

### 使用 PATCH (最常见)
- Bug 修复
- 文档更新
- 小的优化
- 样式调整

**例子**: 
```bash
npm run version:patch
```

### 使用 MINOR
- 新功能（向后兼容）
- 新组件
- API 扩展

**例子**:
```bash
npm run version:minor
```

### 使用 MAJOR (谨慎)
- 破坏性变更
- API 不兼容
- 架构重构

**例子**:
```bash
npm run version:major
```

---

## ✅ 提交前检查清单

- [ ] 代码已测试
- [ ] 构建成功 (`npm run build`)
- [ ] CHANGELOG.md 已更新
- [ ] 版本号已递增
- [ ] Preferences 页面显示正确版本
- [ ] 无 console.error
- [ ] 代码格式正确
- [ ] Lint 检查通过

---

## 💡 提示

1. **频繁小更新**: 建议每次都运行 `version:patch`
2. **查看当前版本**: 检查 package.json 或 Preferences 页面
3. **时间自动更新**: 每次启动/构建时自动记录当前时间
4. **Git 可选**: 即使没有 Git，版本管理也能正常工作

---

## 🔍 故障排查

**Q: Preferences 显示旧版本？**  
A: 清除浏览器缓存并刷新，或重新构建

**Q: 版本号没变化？**  
A: 确认已运行 `npm run version:*` 命令

**Q: 更新时间不对？**  
A: 重启开发服务器 (`Ctrl+C` 然后 `npm start`)

---

**记住**: 每次更新 → 更新 CHANGELOG → 递增版本 → 测试 → 提交 ✨
