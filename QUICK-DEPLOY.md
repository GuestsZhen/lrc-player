# SSH 自动部署 - 快速开始

## 🚀 5 分钟快速配置

### 步骤 1：服务器准备（在服务器上执行）

```bash
# 创建部署目录
sudo mkdir -p /var/www/lrc-player
sudo chown -R $USER:$USER /var/www/lrc-player

# 测试 Nginx 配置（如果已安装）
nginx -v
```

### 步骤 2：生成 SSH 密钥（在本地执行）

```bash
ssh-keygen -t ed25519 -C "lrc-player-deploy" -f ~/.ssh/lrc-player-deploy
```

### 步骤 3：配置服务器访问（在本地执行）

```bash
# 替换 user 和 your-server 为你的实际值
cat ~/.ssh/lrc-player-deploy.pub | ssh user@your-server "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"

# 测试连接
ssh -i ~/.ssh/lrc-player-deploy user@your-server "echo '连接成功！'"
```

### 步骤 4：配置 GitHub Secrets

进入 GitHub 仓库 → Settings → Secrets and variables → Actions，添加：

```
SERVER_HOST=你的服务器IP或域名
SERVER_USERNAME=SSH用户名（如：root, deploy）
SSH_PRIVATE_KEY=粘贴 ~/.ssh/lrc-player-deploy 的完整内容
DEPLOY_PATH=/var/www/lrc-player
SERVER_PORT=22（如果不是默认端口则修改）
```

获取私钥内容：
```bash
cat ~/.ssh/lrc-player-deploy
```

### 步骤 5：触发部署

```bash
git add .
git commit -m "配置 SSH 自动部署"
git push origin master
```

或者在 GitHub Actions 页面手动触发。

---

## ✅ 验证部署

部署完成后，访问你的服务器地址检查是否成功：

```bash
curl http://your-server-ip
```

或在浏览器中打开 `http://your-server-ip`

---

## 🔧 常见问题

**Q: 如何查看部署日志？**  
A: GitHub → Actions → Deploy to Server via SSH → 点击最近的工作流运行

**Q: 部署失败怎么办？**  
A: 检查 GitHub Actions 日志中的错误信息，通常是 SSH 连接或权限问题

**Q: 如何手动触发部署？**  
A: GitHub → Actions → Deploy to Server via SSH → Run workflow

**Q: 支持多个服务器吗？**  
A: 支持，参考 DEPLOY-SSH.md 中的多服务器部署配置

---

## 📚 详细文档

完整的配置指南、故障排查和高级用法请查看：[DEPLOY-SSH.md](./DEPLOY-SSH.md)
