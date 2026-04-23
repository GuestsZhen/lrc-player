# Android 自动签名构建配置指南

## 📋 概述

本项目已配置 GitHub Actions 自动构建并发布 Android APK 到 GitHub Releases。

## 🔧 配置步骤

### 1. 生成签名密钥（只需一次）

在您的本地机器上运行：

```bash
# 进入项目目录
cd lrc-player0419

# 生成签名密钥
keytool -genkey -v -keystore lrc-player.keystore \
  -alias lrc-player \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000

# 按提示填写信息（姓名、组织等）
# 设置密码并牢记！
```

### 2. 将密钥文件转换为 Base64

```bash
# macOS/Linux
base64 -i lrc-player.keystore -o lrc-player.keystore.b64

# 查看 Base64 内容
cat lrc-player.keystore.b64
```

复制输出的 Base64 字符串。

### 3. 在 GitHub 上配置 Secrets

访问：https://github.com/GuestsZhen/lrc-player/settings/secrets/actions

添加以下 4 个 Secrets：

| Secret 名称 | 值 | 说明 |
|------------|-----|------|
| `ANDROID_KEYSTORE` | 上一步生成的 Base64 字符串 | 签名密钥文件 |
| `KEYSTORE_PASSWORD` | 您的密钥库密码 | 创建密钥时设置的密码 |
| `KEY_ALIAS` | `lrc-player` | 密钥别名 |
| `KEY_PASSWORD` | 您的密钥密码 | 通常与 KEYSTORE_PASSWORD 相同 |

### 4. 触发构建

#### 方式 A：推送 Tag（推荐）

```bash
# 创建并推送 tag
git tag v6.0.6
git push origin v6.0.6
```

这将自动：
- ✅ 构建签名 APK
- ✅ 创建 GitHub Release
- ✅ 上传 APK 到 Release

#### 方式 B：手动触发

1. 访问：https://github.com/GuestsZhen/lrc-player/actions
2. 找到 "Build and Release Android APK" 工作流
3. 点击 "Run workflow"
4. 选择分支并运行

## 📦 下载 APK

构建完成后，访问：
https://github.com/GuestsZhen/lrc-player/releases

下载最新的 `app-release.apk` 文件。

## 🔒 安全注意事项

⚠️ **重要**：
- **永远不要**将 `lrc-player.keystore` 文件提交到 Git
- 该文件已在 `.gitignore` 中排除
- 只在 GitHub Secrets 中存储加密后的密钥

## 🐛 故障排查

### 构建失败

1. 检查 GitHub Actions 日志
2. 确认所有 4 个 Secrets 已正确配置
3. 验证 Base64 编码是否正确

### 签名失败

1. 确认密码正确
2. 检查密钥别名是否匹配
3. 验证密钥文件未损坏

## 📝 版本管理

每次发布新版本时：

```bash
# 1. 更新版本号（在 package.json 中）
npm version patch  # 或 minor / major

# 2. 推送代码
git push origin main

# 3. 创建并推送 tag
git tag v6.0.7
git push origin v6.0.7
```

GitHub Actions 将自动构建并发布新版本！
