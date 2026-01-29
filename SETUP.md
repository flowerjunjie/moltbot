# Moltbot 分布式配置说明

## 系统架构

### 服务器 (38.14.254.51)
- **角色**: 主脑 + 数据中心
- **Gateway**: 端口 18789，作为系统服务运行
- **配置**: `/root/.clawdbot/moltbot.json`
- **启动命令**: `systemctl start moltbot`

### 桌面 (本地)
- **角色**: 辅助脑 + 工具站
- **Gateway**: 端口 18789，本地模式运行
- **配置**: `C:\Users\15622\.clawdbot\moltbot.json`
- **浏览器工具**: 启用，端口 18792

## 桌面快捷方式

### 1. Moltbot.bat (主菜单)
- 位置: `C:\Users\15622\Desktop\Moltbot.bat`
- 功能:
  - [1] 发送单条消息
  - [2] 交互式聊天
  - [3] 启动/重启 Gateway
  - [4] 退出

### 2. Ask Moltbot.bat (快速启动)
- 位置: `C:\Users\15622\Desktop\Ask Moltbot.bat`
- 功能: 快速发送单条消息

## 配置文件

### 本地配置 (桌面)
```json
{
  "gateway": {
    "mode": "local",
    "auth": {"token": "moltbot-cluster-2024"}
  },
  "browser": {"enabled": true},
  "models": {
    "providers": {
      "minimax": {
        "baseUrl": "https://api.minimaxi.com/anthropic",
        "apiKey": "sk-cp-...",
        "authHeader": true
      }
    }
  }
}
```

### 服务器配置
```json
{
  "gateway": {
    "mode": "local",
    "auth": {"token": "moltbot-cluster-2024"}
  },
  "browser": {"enabled": true},
  "models": {
    "providers": {
      "minimax": {
        "baseUrl": "https://api.minimaxi.com/anthropic",
        "apiKey": "sk-cp-...",
        "authHeader": true
      }
    }
  }
}
```

## 使用方法

### 1. 桌面使用
1. 双击 `Moltbot.bat` 打开主菜单
2. 选择 [3] 启动 Gateway（首次使用或 Gateway 未运行时）
3. 选择 [1] 或 [2] 与 AI 对话

### 2. 服务器管理
```bash
# 查看状态
systemctl status moltbot

# 重启服务
systemctl restart moltbot

# 查看日志
journalctl -u moltbot -f
```

## 故障排查

### Gateway 无法启动
1. 检查 Node.js 版本: `node --version` (需要 v22+)
2. 检查端口占用: `netstat -an | grep 18789`
3. 查看日志: `C:\Users\15622\AppData\Local\Temp\claude\...`

### Agent 连接失败
1. 确认 Gateway 正在运行
2. 检查配置文件 token 是否匹配
3. 重启 Gateway: 在 Moltbot.bat 中选择 [3]

## 下一步配置

### 笔记本配置（待完成）
1. 安装 Node.js v22
2. 克隆或复制 moltbot 代码
3. 配置本地模式（类似桌面配置）
4. 可选：配置为轻量级客户端（仅使用服务器 API）

### Redis 共享状态（可选）
如需在设备间共享会话状态，可配置 Redis：
```json
{
  "state": {
    "backend": "redis",
    "redis": {
      "host": "38.14.254.51",
      "port": 6379
    }
  }
}
```

## 技术规格

- **Node.js**: v22.12.0 / v22.22.0
- **包管理器**: pnpm
- **AI 模型**: Claude 3.5 Sonnet (via MiniMax API)
- **浏览器自动化**: Chromium / Chrome
- **通信协议**: WebSocket
- **系统服务**: systemd (Linux)

## 更新日期
2026-01-29
