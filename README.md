<div align="center">

# QQ经典农场助手

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen.svg)](https://nodejs.org/)
[![Electron](https://img.shields.io/badge/electron-latest-47848F.svg)](https://www.electronjs.org/)
[![Vue](https://img.shields.io/badge/vue-3.x-4FC08D.svg)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-5.x-3178C6.svg)](https://www.typescriptlang.org/)

**基于 Electron + Vue 3 的 QQ/微信经典农场小程序自动化桌面应用**

通过分析小程序 WebSocket 通信协议（Protocol Buffers），实现全自动农场管理

支持智能种植策略 · 好友互动 · 任务系统 · 实时日志

[功能特性](#-功能特性) · [快速开始](#-安装) · [使用文档](#-使用方式) · [技术栈](#️-技术栈)

## ⚠️ 仓库状态：仅发布，不维护源码

**请勿基于此仓库代码进行二次开发。**  
后续版本只通过 Release 分发，请直接下载最新版：

[![下载最新版](https://img.shields.io/badge/Releases-%E4%B8%8B%E8%BD%BD%E6%9C%80%E6%96%B0%E7%89%88-red?style=for-the-badge)](https://github.com/QianChenJun/qq-farm-bot/releases)

</div>

---

> **💡 项目说明**
> 本项目基于 [linguo2625469/qq-farm-bot](https://github.com/linguo2625469/qq-farm-bot) 进行重构和功能增强，从 CLI 脚本升级为 Electron 桌面应用，新增 Vue 3 可视化界面、多种植策略、实时状态更新等功能。

## 📸 应用截图

<table>
<tr>
<td width="50%" align="center">
<img src="docs/images/首页.png" alt="首页" style="border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);" />
<br/>
<b>首页 - 功能开关与种植策略</b>
<br/>
<sub>实时显示农场状态、经验金币，支持独立功能开关和三种种植策略</sub>
</td>
<td width="50%" align="center">
<img src="docs/images/参数配置.png" alt="参数配置" style="border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);" />
<br/>
<b>设置页 - 参数配置</b>
<br/>
<sub>自定义巡查间隔、平台选择，查看所有可种植作物效率排行</sub>
</td>
</tr>
<tr>
<td colspan="2" align="center">
<img src="docs/images/日志.png" alt="日志" style="border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);" />
<br/>
<b>日志页 - 实时操作记录</b>
<br/>
<sub>查看所有自动化操作日志，支持按类型筛选和实时滚动</sub>
</td>
</tr>
</table>

## ✨ 功能特性

<table>
<tr>
<td width="50%">

### 🌱 自己农场
- ✅ **自动收获** — 检测成熟作物并自动收获
- ✅ **自动铲除** — 自动铲除枯死/收获后的作物残留
- ✅ **智能种植** — 三种策略可选
  - 🚀 快速升级（经验效率最优）
  - 🌟 高级作物（单次经验最高）
  - 🎯 手动选择（自定义种植）
- ✅ **自动施肥** — 种植后自动施放普通肥料加速生长
- ✅ **自动除草** — 检测并清除杂草
- ✅ **自动除虫** — 检测并消灭害虫
- ✅ **自动浇水** — 检测缺水作物并浇水

</td>
<td width="50%">

### 👥 好友农场
- ✅ **好友巡查** — 自动巡查好友农场（主开关）
- ✅ **帮忙操作** — 帮好友浇水/除草/除虫（有经验上限）
- ✅ **自动偷菜** — 偷取好友成熟作物（有经验）
- ✅ **放虫放草** — 给好友放虫子和杂草（捣乱操作）

### ⚙️ 系统功能
- ✅ **自动任务** — 自动领取完成的任务奖励
- ✅ **自动出售** — 定期出售背包中的作物
- ✅ **商城购买** — 自动购买免费礼包和高级肥料（可选）
- ✅ **自动同意好友** — 微信同玩好友申请自动同意
- ✅ **邀请码处理** — 启动时自动处理邀请链接
- ✅ **实时状态更新** — 经验/金币/等级实时显示
- ✅ **心跳保活** — 自动维持 WebSocket 连接

</td>
</tr>
</table>

### 🎨 桌面应用特性

- 🖥️ **现代化界面** — Vue 3 + Element Plus 暗色主题
- 🎛️ **功能开关** — 每个功能可独立开启/关闭，带详细说明
- 📊 **实时日志** — 查看所有操作记录，支持筛选
- ⚡ **配置持久化** — 自动保存配置，下次启动自动应用
- 🔔 **系统托盘** — 最小化到托盘，后台运行不打扰
- 🔄 **双平台支持** — QQ 和微信小程序均可使用

## 📦 安装

### 环境要求

- Node.js >= 16.0.0
- npm 或 pnpm

### 克隆仓库

```bash
git clone https://github.com/QianChenJun/qq-farm-bot.git
cd qq-farm-bot
npm install
```

## 🔑 获取登录 Code

本工具需要小程序的登录凭证（code）才能连接服务器。code 具有时效性，过期后需重新获取。

<details>
<summary><b>📱 抓包方式（Fiddler）</b></summary>

1. 手机安装 Fiddler 证书，配置代理指向电脑
2. 电脑打开 Fiddler，开启 HTTPS 解密
3. 手机打开 QQ/微信 → 进入「经典农场」小程序
4. 在 Fiddler 中筛选请求，找到 WebSocket 连接或登录请求中的 `code` 参数
5. 复制 code 值，粘贴到本工具中使用

> **💡 提示**：code 具有时效性，短时间内断开重连可复用同一 code，过期后需重新进入小程序获取。

</details>

## 🚀 使用方式

### 方式一：Electron 桌面应用（推荐）

```bash
# 开发模式
npm run electron:dev

# 打包为安装程序
npm run electron:build
```

打包后在 `release/` 目录生成 `QQ经典农场助手 Setup x.x.x.exe`，安装后即可使用。

**桌面应用提供：**
- 🎨 可视化操作界面（暗色主题）
- 🎛️ 功能开关实时切换（带详细说明）
- 🌱 种植策略配置（快速升级 / 高级作物 / 手动选择）
- ⏱️ 巡查间隔调整
- 📋 实时日志查看与筛选
- 🔔 最小化到系统托盘

### 方式二：CLI 命令行

```bash
# QQ 小程序登录
npm run cli -- --code <你的code>

# 微信小程序登录
npm run cli -- --code <你的code> --wx

# 自定义巡查间隔
npm run cli -- --code <你的code> --interval 30 --friend-interval 5
```

**参数说明：**

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `--code` | 小程序登录凭证（必需） | - |
| `--wx` | 使用微信登录 | QQ |
| `--interval` | 自己农场巡查间隔（秒） | 1 |
| `--friend-interval` | 好友农场巡查间隔（秒） | 1 |

## 📁 项目结构

<details>
<summary><b>点击展开查看详细结构</b></summary>

```
qq-farm-bot/
├── electron/          # Electron 主进程模块
├── renderer/          # Vue 3 前端界面
├── src/               # 核心业务模块（CLI & Electron 共用）
├── proto/             # Protobuf 协议定义
├── gameConfig/        # 游戏配置数据
└── docs/              # 项目文档
```

</details>

## ⚙️ 配置说明

### Electron 桌面应用

配置通过界面操作，自动保存到用户数据目录（`%APPDATA%/qq-farm-bot/config.json`）：

- **平台选择**：QQ / 微信
- **种植模式**：
  - 🚀 快速升级（经验效率最优，适合快速升级）
  - 🌟 高级作物（单次经验最高，适合高等级玩家）
  - 🎯 手动选择（自定义种植作物）
- **巡查间隔**：自己农场 / 好友农场分别设置
- **功能开关**：每个自动化功能可独立开启/关闭，带详细说明

### CLI 命令行

通过启动参数配置，详见上方参数说明表。

### 邀请码（仅微信）

在项目根目录的 `share.txt` 中每行放一个邀请链接，启动时自动处理：

```
?uid=xxx&openid=xxx&share_source=xxx&doc_id=xxx
```

## ⚠️ 注意事项

- ⏱️ **Code 时效性**：code 具有时效性，短时间内可复用，过期后需重新从小程序获取
- 🔐 **单点登录限制**：同一账号同时只能在一个地方登录，启动本工具后小程序端会被踢下线
- 🔌 **长时间运行**：长时间挂机可能导致连接超时被服务器踢下线，需重新连接
- 🌐 **网络环境**：建议在稳定的网络环境下运行，断线后需重新获取 code 连接
- 📚 **免责声明**：本项目仅供学习交流使用，请勿用于商业用途

## 🛠️ 技术栈

<table>
<tr>
<td align="center" width="20%">
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg" width="48" height="48" alt="Node.js" />
<br /><b>Node.js</b>
<br /><sub>运行时环境</sub>
</td>
<td align="center" width="20%">
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/electron/electron-original.svg" width="48" height="48" alt="Electron" />
<br /><b>Electron</b>
<br /><sub>桌面应用框架</sub>
</td>
<td align="center" width="20%">
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vuejs/vuejs-original.svg" width="48" height="48" alt="Vue 3" />
<br /><b>Vue 3</b>
<br /><sub>前端框架</sub>
</td>
<td align="center" width="20%">
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg" width="48" height="48" alt="TypeScript" />
<br /><b>TypeScript</b>
<br /><sub>类型安全</sub>
</td>
<td align="center" width="20%">
<img src="https://element-plus.org/images/element-plus-logo.svg" width="48" height="48" alt="Element Plus" />
<br /><b>Element Plus</b>
<br /><sub>UI 组件库</sub>
</td>
</tr>
</table>

**核心特性**：Composition API · Vite 构建 · WebSocket + Protocol Buffers · 暗色主题

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 💖 支持项目

如果这个项目对你有帮助，欢迎请作者喝杯咖啡 ☕

<div align="center">
<table>
<tr>
<td align="center">
<img src="docs/images/微信.png" alt="微信赞赏码" width="200"/>
<br/>
<b>微信赞赏</b>
</td>
<td align="center">
<img src="docs/images/支付宝.png" alt="支付宝赞赏码" width="200"/>
<br/>
<b>支付宝赞赏</b>
</td>
</tr>
</table>
</div>

> ⚠️ **声明**：本项目完全开源免费，如果你是付费购买的，说明你被骗了！请认准官方仓库。

## 📄 License

[MIT](LICENSE)

## 🙏 致谢

本项目基于 [linguo2625469/qq-farm-bot](https://github.com/linguo2625469/qq-farm-bot) 进行重构和功能增强，感谢原作者的开源贡献。

---

<div align="center">

### 📊 Star History

[![Star History Chart](https://api.star-history.com/svg?repos=QianChenJun/qq-farm-bot&type=Date)](https://star-history.com/#QianChenJun/qq-farm-bot&Date)

**如果觉得项目不错，请点个 ⭐️ Star 支持一下！**

</div>
