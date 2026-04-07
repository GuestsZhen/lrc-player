# SSH 自动部署配置指南

## 概述

本项目已配置 GitHub Actions 工作流，支持通过 SSH 自动部署到服务器。当推送到 `master` 分支或手动触发时，会自动构建并部署到指定服务器。

## 配置步骤

### 1. 在服务器上准备部署目录

```bash
# 创建部署目录
sudo mkdir -p /var/www/lrc-player

# 设置权限
sudo chown -R $USER:$USER /var/www/lrc-player
chmod -R 755 /var/www/lrc-player
```

### 2. 配置 Nginx（如果使用）

创建 Nginx 配置文件 `/etc/nginx/sites-available/lrc-player`：

```nginx
server {
    listen 80;
    server_name your-domain.com;  # 替换为你的域名
    
    root /var/www/lrc-player;
    index index.html;
    
    # 启用 gzip 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    
    # SPA 路由支持
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

启用配置：
```bash
sudo ln -s /etc/nginx/sites-available/lrc-player /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 3. 生成 SSH 密钥对

在本地机器上生成专用的部署密钥：

```bash
ssh-keygen -t ed25519 -C "lrc-player-deploy" -f ~/.ssh/lrc-player-deploy
```

### 4. 配置服务器 SSH 访问

将公钥添加到服务器的 `authorized_keys`：

```bash
# 在服务器上执行
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# 将本地的公钥内容追加到服务器
cat ~/.ssh/lrc-player-deploy.pub | ssh user@your-server "cat >> ~/.ssh/authorized_keys"

# 设置正确的权限
chmod 600 ~/.ssh/authorized_keys
```

测试连接：
```bash
ssh -i ~/.ssh/lrc-player-deploy user@your-server
```

### 5. 配置 GitHub Secrets

在 GitHub 仓库中，进入 **Settings → Secrets and variables → Actions**，添加以下 secrets：

| Secret 名称 | 说明 | 示例值 |
|------------|------|--------|
| `SERVER_HOST` | 服务器 IP 地址或域名 | `192.168.1.100` 或 `example.com` |
| `SERVER_USERNAME` | SSH 用户名 | `deploy` 或 `root` |
| `SSH_PRIVATE_KEY` | SSH 私钥内容 | 粘贴 `~/.ssh/lrc-player-deploy` 的完整内容 |
| `DEPLOY_PATH` | 部署目录路径 | `/var/www/lrc-player` |
| `SERVER_PORT` | SSH 端口（可选，默认 22） | `22` |

**添加 SSH 私钥的方法：**

```bash
# 复制私钥内容
cat ~/.ssh/lrc-player-deploy
```

然后将整个内容（包括 `-----BEGIN OPENSSH PRIVATE KEY-----` 和 `-----END OPENSSH PRIVATE KEY-----`）粘贴到 GitHub Secret 中。

### 6. 上传部署脚本到服务器

将 `deploy.sh` 上传到服务器：

```bash
scp -i ~/.ssh/lrc-player-deploy deploy.sh user@your-server:/usr/local/bin/deploy-lrc-player
ssh -i ~/.ssh/lrc-player-deploy user@your-server "chmod +x /usr/local/bin/deploy-lrc-player"
```

更新工作流中的部署命令（可选），使用此脚本：

```yaml
script: |
  /usr/local/bin/deploy-lrc-player ${{ secrets.DEPLOY_PATH }}
```

## 使用方法

### 自动部署

推送到 master 分支时自动触发：

```bash
git add .
git commit -m "更新内容"
git push origin master
```

### 手动部署

1. 进入 GitHub 仓库页面
2. 点击 **Actions** 标签
3. 选择 **Deploy to Server via SSH** 工作流
4. 点击 **Run workflow** 按钮
5. 选择分支后点击 **Run workflow**

## 监控部署

### 查看部署日志

在 GitHub Actions 页面可以实时查看部署进度和日志。

### 检查服务器状态

```bash
# 登录服务器
ssh user@your-server

# 检查文件是否更新
ls -la /var/www/lrc-player

# 检查 Nginx 状态
sudo systemctl status nginx

# 查看 Nginx 错误日志
sudo tail -f /var/log/nginx/error.log
```

## 故障排查

### 问题：SSH 连接失败

**可能原因：**
- SSH 密钥配置错误
- 防火墙阻止连接
- SSH 服务未运行

**解决方法：**
```bash
# 测试 SSH 连接
ssh -v -i ~/.ssh/lrc-player-deploy user@your-server

# 检查服务器 SSH 服务
sudo systemctl status sshd

# 检查防火墙规则
sudo ufw status
```

### 问题：权限被拒绝

**可能原因：**
- 部署目录权限不正确
- 用户没有写入权限

**解决方法：**
```bash
# 在服务器上修复权限
sudo chown -R $USER:$USER /var/www/lrc-player
chmod -R 755 /var/www/lrc-player
```

### 问题：Nginx 无法加载新文件

**解决方法：**
```bash
# 重启 Nginx
sudo systemctl restart nginx

# 检查 Nginx 配置
sudo nginx -t

# 清除浏览器缓存或使用硬刷新 (Ctrl+F5)
```

## 安全建议

1. **使用专用部署用户**：不要使用 root 用户进行部署
   ```bash
   sudo adduser deploy
   sudo usermod -aG www-data deploy
   ```

2. **限制 SSH 密钥权限**：只允许从 GitHub Actions IP 范围连接（如果可能）

3. **定期轮换密钥**：每 3-6 个月更换一次 SSH 密钥

4. **使用非标准 SSH 端口**：更改默认 SSH 端口以提高安全性

5. **启用 fail2ban**：防止暴力破解
   ```bash
   sudo apt install fail2ban
   sudo systemctl enable fail2ban
   ```

## 高级配置

### 多服务器部署

如果需要部署到多个服务器，可以在工作流中添加多个部署步骤：

```yaml
- name: Deploy to Server 1
  uses: appleboy/scp-action@master
  with:
    host: ${{ secrets.SERVER_HOST_1 }}
    # ... 其他配置

- name: Deploy to Server 2
  uses: appleboy/scp-action@master
  with:
    host: ${{ secrets.SERVER_HOST_2 }}
    # ... 其他配置
```

### 部署前备份

在工作流中添加备份步骤：

```yaml
- name: Backup current deployment
  uses: appleboy/ssh-action@master
  with:
    host: ${{ secrets.SERVER_HOST }}
    username: ${{ secrets.SERVER_USERNAME }}
    key: ${{ secrets.SSH_PRIVATE_KEY }}
    script: |
      if [ -d "${{ secrets.DEPLOY_PATH }}" ]; then
        cp -r ${{ secrets.DEPLOY_PATH }} ${{ secrets.DEPLOY_PATH }}.backup.$(date +%Y%m%d_%H%M%S)
      fi
```

### 部署后健康检查

```yaml
- name: Health check
  run: |
    sleep 5
    curl -f https://your-domain.com || exit 1
```

## 相关文件

- `.github/workflows/deploy-ssh.yml` - SSH 部署工作流配置
- `deploy.sh` - 服务器端部署脚本
- `Dockerfile` - Docker 部署配置（可选）

## 回滚到之前的版本

如果部署出现问题，可以快速回滚：

```bash
# 在服务器上列出备份
ls -la /var/www/lrc-player.backup.*

# 恢复最近的备份
rm -rf /var/www/lrc-player
cp -r /var/www/lrc-player.backup.20240101_120000 /var/www/lrc-player

# 重启 Nginx
sudo systemctl reload nginx
```

## 联系支持

如有问题，请提交 Issue 到：https://github.com/GuestsZhen/lrc-player/issues
