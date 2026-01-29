# 笔记本部署指南

## 准备工作

### 在桌面电脑上

1. **准备 Moltbot 代码包**
   ```bash
   cd D:\workspace\moltbot
   tar -czf moltbot-notebook.tar.gz --exclude='node_modules' --exclude='dist' .
   ```

2. **传输到笔记本**
   - 通过 U盘、网络共享或云盘传输 `moltbot-notebook.tar.gz`
   - 同时传输 `notebook-setup.bat` 安装脚本

### 在笔记本上

1. **解压代码**
   ```cmd
   # 解压到 C:\moltbot
   tar -xzf moltbot-notebook.tar.gz -C C:\moltbot
   ```

2. **运行安装脚本**
   ```cmd
   # 右键以管理员身份运行
   notebook-setup.bat
   ```

3. **验证安装**
   - 双击桌面上的 `Moltbot.bat`
   - 选择 [2] 启动 Gateway
   - 选择 [1] 开始聊天

## 配置说明

### Redis 会话共享
所有设备都连接到服务器的 Redis，实现会话状态共享：
- **服务器**: 127.0.0.1:6379
- **客户端**: 38.14.254.51:6379
- **密码**: moltbot-redis-2024

### 共享功能
- ✅ 跨设备会话同步
- ✅ 统一的对话历史
- ✅ 共享的上下文记忆
- ✅ 一致的 AI 配置

## 网络要求

### 端口需求
- **6379** - Redis (需要能访问 38.14.254.51)
- **18789** - Gateway WebSocket (本地)
- **18792** - Browser control (本地)

### 防火墙
确保笔记本可以访问服务器：
```cmd
ping 38.14.254.51
telnet 38.14.254.51 6379
```

## 故障排查

### Gateway 无法启动
1. 检查 Node.js 版本: `node --version`
2. 检查端口占用: `netstat -an | findstr 18789`
3. 查看日志文件

### 无法连接到 Redis
1. 检查服务器 Redis: `telnet 38.14.254.51 6379`
2. 检查防火墙设置
3. 验证配置文件中的密码

### 会话不同步
1. 确认所有设备使用相同的 Redis 配置
2. 重启 Gateway 服务
3. 清除本地缓存

## 设备清单

| 设备 | IP | 角色 | 状态 |
|------|-------|------|------|
| 服务器 | 38.14.254.51 | 主脑 + 数据中心 | ✅ 运行中 |
| 台式机 | 本地 | 辅助脑 + 工具站 | ✅ 已配置 |
| 笔记本1 | 待配置 | 客户端 | ⏳ 待部署 |
| 笔记本2 | 待配置 | 客户端 | ⏳ 待部署 |

## 下一步

完成笔记本部署后，将继续：
- 负载均衡配置
- 数据同步设置
- 监控告警系统
