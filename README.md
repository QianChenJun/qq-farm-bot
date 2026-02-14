<div align="center">

# QQ经典农场助手

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Release](https://img.shields.io/github/v/release/QianChenJun/qq-farm-bot)](https://github.com/QianChenJun/qq-farm-bot/releases)
[![Downloads](https://img.shields.io/github/downloads/QianChenJun/qq-farm-bot/total)](https://github.com/QianChenJun/qq-farm-bot/releases)

QQ/微信经典农场自动化桌面助手

支持智能种植、好友巡查、任务礼包、背包处理、实时状态与日志。

[下载使用](#下载) · [功能特性](#功能特性) · [常见问题](#常见问题) · [致谢](#致谢)

</div>

---

## 发布说明

本仓库是发布仓库（Public），主要用于：

- 发布安装包（Releases）
- 对外说明与使用文档
- 问题反馈与版本更新记录

源码不在本仓库公开维护；每次版本迭代后，本说明会同步更新用户可见功能。

## 功能特性

### 自己农场

- 自动收获、自动铲除、自动补种
- 自动解锁土地与土地升级（红土地/金土地）
- 智能种植策略
  - 快速升级
  - 高级作物
  - 手动选择（记忆上次手动种子）
- 自动施肥体系
  - 普通肥开关
  - 高级肥开关
  - 高级肥连续施肥
  - 高级肥防偷（临近成熟窗口补施）
- 自动除草、除虫、浇水

### 好友农场

- 自动巡查好友
- 自动偷菜
- 自动帮忙（浇水/除草/除虫）
- 放虫放草（可开关，支持次数统计与上限自动停用）
- 跨天自动恢复每日次数类功能

### 任务与礼包

- 自动领取任务奖励
- 自动出售背包作物
- 每日分享礼包
- 每日会员礼包
- 开服礼包、月卡礼包

### 桌面体验

- Electron 桌面应用，支持后台运行
- 实时状态卡片（等级、金币、点券、经验、防偷倒计时）
- 实时日志
- 本地二维码生成扫码登录（不依赖在线二维码服务）

## 应用截图

以下截图以实际版本功能为准。

<table>
<tr>
<td width="50%" align="center">
<img src="docs/images/首页.png" alt="首页" style="border-radius: 8px;" />
<br/>
<b>首页 - 功能与状态</b>
</td>
<td width="50%" align="center">
<img src="docs/images/参数配置.png" alt="参数配置" style="border-radius: 8px;" />
<br/>
<b>参数配置 - 策略与间隔</b>
</td>
</tr>
<tr>
<td width="50%" align="center">
<img src="docs/images/日志.png" alt="日志" style="border-radius: 8px;" />
<br/>
<b>日志 - 实时记录</b>
</td>
<td width="50%" align="center">
<img src="docs/images/好友.png" alt="好友" style="border-radius: 8px;" />
<br/>
<b>好友 - 巡查与过滤</b>
</td>
</tr>
<tr>
<td width="50%" align="center">
<img src="docs/images/土地.png" alt="土地" style="border-radius: 8px;" />
<br/>
<b>土地 - 统计与状态</b>
</td>
<td width="50%" align="center">
<img src="docs/images/背包.png" alt="背包" style="border-radius: 8px;" />
<br/>
<b>背包 - 出售与道具</b>
</td>
</tr>
<tr>
<td colspan="2" align="center">
<img src="docs/images/设置.png" alt="设置" style="border-radius: 8px;" />
<br/>
<b>设置 - 全局配置</b>
</td>
</tr>
</table>

## 下载

请前往 Releases 下载最新版：

- https://github.com/QianChenJun/qq-farm-bot/releases

## 登录与使用

### 登录方式

- 应用内扫码登录（推荐）
- 手动填入 code（如你已有可用 code）

### 使用步骤

1. 下载并启动应用。
2. 登录账号（QQ / 微信）。
3. 在首页按需开启功能。
4. 在参数配置页调整巡查间隔与策略。

## 常见问题

- 登录失败：`code` 可能过期，请重新获取。
- 被踢下线：同账号在其他设备登录会触发单点下线。
- 长时间运行断连：重新连接即可。
- 功能不执行：先检查开关、账号等级、背包种子、肥料与点券。

## 反馈与交流

- Issue：<https://github.com/QianChenJun/qq-farm-bot/issues>
- QQ 群：796420560

## 致谢

- 原项目与协议研究基础：
  [linguo2625469/qq-farm-bot](https://github.com/linguo2625469/qq-farm-bot)
- 扫码登录参考：
  [lkeme/QRLib](https://github.com/lkeme/QRLib)

## 支持项目

如果这个项目对你有帮助，欢迎支持作者持续维护。

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

## 声明

本项目开源免费，仅供学习交流，请勿用于商业倒卖。

## License

[MIT](LICENSE)
