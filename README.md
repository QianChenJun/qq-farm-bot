# QQ经典农场助手

基于 Node.js 的 QQ/微信经典农场小程序自动化挂机工具。通过分析小程序 WebSocket 通信协议（Protocol Buffers），实现全自动农场管理。

支持两种运行模式：**Electron 桌面应用**（推荐）和 **CLI 命令行**。

## 功能特性

### 自己农场
- **自动收获** — 检测成熟作物并自动收获
- **自动铲除** — 自动铲除枯死/收获后的作物残留
- **自动种植** — 收获/铲除后自动购买种子并种植（支持自动最优策略或手动选择）
- **自动施肥** — 种植后自动施放普通肥料加速生长
- **自动除草** — 检测并清除杂草
- **自动除虫** — 检测并消灭害虫
- **自动浇水** — 检测缺水作物并浇水

### 好友农场
- **好友巡查** — 自动巡查好友农场
- **帮忙操作** — 帮好友浇水/除草/除虫
- **自动偷菜** — 偷取好友成熟作物

### 系统功能
- **自动领取任务** — 自动领取完成的任务奖励，支持分享翻倍/三倍奖励
- **自动同意好友** — 微信同玩好友申请自动同意（支持推送实时响应）
- **邀请码处理** — 启动时自动处理 share.txt 中的邀请链接（微信环境）
- **种植策略计算** — 根据等级自动计算经验效率最优的作物
- **心跳保活** — 自动维持 WebSocket 连接

## 安装

```bash
git clone https://github.com/QianChenJun/qq-farm-bot.git
cd qq-farm-bot
npm install
```

## 获取登录 Code

本工具需要小程序的登录凭证（code）才能连接服务器。code 为一次性使用，每次连接需重新获取。

### 抓包方式（Fiddler）

1. 手机安装 Fiddler 证书，配置代理指向电脑
2. 电脑打开 Fiddler，开启 HTTPS 解密
3. 手机打开 QQ/微信 → 进入「经典农场」小程序
4. 在 Fiddler 中筛选请求，找到 WebSocket 连接或登录请求中的 `code` 参数
5. 复制 code 值，粘贴到本工具中使用

> **注意**：code 为一次性凭证，使用后即失效，需重新进入小程序获取新的 code。
## 使用方式

### 方式一：Electron 桌面应用（推荐）

```bash
# 开发模式
npm run electron:dev

# 打包为安装程序
npm run electron:build
```

打包后在 `release/` 目录生成 `QQ经典农场助手 Setup x.x.x.exe`，安装后即可使用。

桌面应用提供：
- 可视化操作界面（暗色主题）
- 功能开关实时切换
- 种植策略配置（自动最优 / 手动选择）
- 巡查间隔调整
- 实时日志查看与筛选
- 最小化到系统托盘

### 方式二：CLI 命令行

```bash
# QQ 小程序登录
npm run cli -- --code <你的code>

# 微信小程序登录
npm run cli -- --code <你的code> --wx

# 自定义巡查间隔
npm run cli -- --code <你的code> --interval 30 --friend-interval 5
```

参数说明：
| 参数 | 说明 | 默认值 |
|------|------|--------|
| `--code` | 小程序登录凭证（必需） | - |
| `--wx` | 使用微信登录 | QQ |
| `--interval` | 自己农场巡查间隔（秒） | 1 |
| `--friend-interval` | 好友农场巡查间隔（秒） | 1 |

## 项目结构

```
qq-farm-bot/
├── electron/                # Electron 主进程
│   ├── main.js              # 主进程入口
│   ├── preload.js           # 预加载脚本（IPC 桥接）
│   ├── ipc.js               # IPC 通道处理
│   ├── bot.js               # 机器人核心控制器
│   ├── store.js             # 配置持久化
│   ├── planner.js           # 种植策略计算
│   └── tray.js              # 系统托盘
├── renderer/                # Vue 3 前端
│   ├── public/
│   ├── index.html
│   └── src/
│       ├── composables/     # 组合式函数（useBot, useLog）
│       ├── views/           # 页面（Home, Settings, Log）
│       ├── types/           # TypeScript 类型定义
│       ├── router/          # 路由配置
│       └── styles/          # 全局样式
├── src/                     # 核心业务模块（主进程 & CLI 共用）
│   ├── config.js            # 配置常量
│   ├── network.js           # WebSocket 连接/消息编解码/登录/心跳
│   ├── farm.js              # 自己农场操作
│   ├── friend.js            # 好友农场操作
│   ├── task.js              # 任务系统
│   ├── warehouse.js         # 仓库管理
│   ├── invite.js            # 邀请码处理
│   ├── status.js            # 状态栏显示
│   ├── proto.js             # Protobuf 加载
│   ├── gameConfig.js        # 游戏配置数据
│   ├── decode.js            # PB 解码工具
│   └── utils.js             # 通用工具函数
├── proto/                   # Protobuf 定义文件
├── gameConfig/              # 游戏配置数据（作物/等级等）
├── tools/                   # 辅助工具脚本
├── client.js                # CLI 模式入口
├── electron-builder.yml     # 打包配置
├── vite.config.ts           # Vite 构建配置
└── package.json
```

## 配置说明

### Electron 桌面应用

配置通过界面操作，自动保存到用户数据目录（`%APPDATA%/qq-farm-bot/config.json`）：

- **平台选择**：QQ / 微信
- **种植模式**：自动最优（按经验效率）/ 手动指定作物
- **巡查间隔**：自己农场 / 好友农场分别设置
- **功能开关**：每个自动化功能可独立开启/关闭

### CLI 命令行

通过启动参数配置，详见上方参数说明表。

### 邀请码（仅微信）

在项目根目录的 `share.txt` 中每行放一个邀请链接，启动时自动处理：

```
?uid=xxx&openid=xxx&share_source=xxx&doc_id=xxx
```

## 注意事项

- code 为一次性凭证，每次连接需重新从小程序获取
- 同一账号同时只能在一个地方登录，启动本工具后小程序端会被踢下线
- 建议在稳定的网络环境下运行，断线后需重新获取 code 连接
- 本项目仅供学习交流使用

## 技术栈

- **运行时**：Node.js
- **桌面框架**：Electron
- **前端**：Vue 3 + TypeScript + Element Plus
- **构建**：Vite + electron-builder
- **通信协议**：WebSocket + Protocol Buffers

## License

[MIT](LICENSE)
