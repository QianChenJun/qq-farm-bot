/**
 * WebSocket 网络层 - 连接/消息编解码/登录/心跳
 */

const WebSocket = require('ws');
const EventEmitter = require('events');
const { CONFIG } = require('./config');
const { types } = require('./proto');
const { toLong, toNum, syncServerTime, log, logWarn } = require('./utils');
const { updateStatusFromLogin, updateStatusGold, updateStatusLevel } = require('./status');

// ============ 事件发射器 (用于推送通知) ============
const networkEvents = new EventEmitter();

// ============ 内部状态 ============
let ws = null;
let clientSeq = 1;
let serverSeq = 0;
let heartbeatTimer = null;
let pendingCallbacks = new Map();

// ============ 用户状态 (登录后设置) ============
const userState = {
    gid: 0,
    name: '',
    level: 0,
    gold: 0,
    exp: 0,
};

function getUserState() { return userState; }

// ============ 消息编解码 ============
function encodeMsg(serviceName, methodName, bodyBytes) {
    const msg = types.GateMessage.create({
        meta: {
            service_name: serviceName,
            method_name: methodName,
            message_type: 1,
            client_seq: toLong(clientSeq),
            server_seq: toLong(serverSeq),
        },
        body: bodyBytes || Buffer.alloc(0),
    });
    const encoded = types.GateMessage.encode(msg).finish();
    clientSeq++;
    return encoded;
}

function sendMsg(serviceName, methodName, bodyBytes, callback) {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
        log('WS', '连接未打开');
        return false;
    }
    const seq = clientSeq;
    const encoded = encodeMsg(serviceName, methodName, bodyBytes);
    if (callback) pendingCallbacks.set(seq, callback);
    ws.send(encoded);
    return true;
}

/** Promise 版发送 */
function sendMsgAsync(serviceName, methodName, bodyBytes, timeout = 10000) {
    return new Promise((resolve, reject) => {
        // 检查连接状态
        if (!ws || ws.readyState !== WebSocket.OPEN) {
            reject(new Error(`连接未打开: ${methodName}`));
            return;
        }
        
        const seq = clientSeq;
        const timer = setTimeout(() => {
            pendingCallbacks.delete(seq);
            // 检查当前待处理的请求数
            const pending = pendingCallbacks.size;
            reject(new Error(`请求超时: ${methodName} (seq=${seq}, pending=${pending})`));
        }, timeout);

        const sent = sendMsg(serviceName, methodName, bodyBytes, (err, body, meta) => {
            clearTimeout(timer);
            if (err) reject(err);
            else resolve({ body, meta });
        });
        
        if (!sent) {
            clearTimeout(timer);
            reject(new Error(`发送失败: ${methodName}`));
        }
    });
}

// ============ 消息处理 ============
function handleMessage(data) {
    try {
        const buf = Buffer.isBuffer(data) ? data : Buffer.from(data);
        const msg = types.GateMessage.decode(buf);
        const meta = msg.meta;
        if (!meta) return;

        if (meta.server_seq) {
            const seq = toNum(meta.server_seq);
            if (seq > serverSeq) serverSeq = seq;
        }

        const msgType = meta.message_type;

        // Notify
        if (msgType === 3) {
            handleNotify(msg);
            return;
        }

        // Response
        if (msgType === 2) {
            const errorCode = toNum(meta.error_code);
            const clientSeqVal = toNum(meta.client_seq);

            const cb = pendingCallbacks.get(clientSeqVal);
            if (cb) {
                pendingCallbacks.delete(clientSeqVal);
                if (errorCode !== 0) {
                    cb(new Error(`${meta.service_name}.${meta.method_name} 错误: code=${errorCode} ${meta.error_message || ''}`));
                } else {
                    cb(null, msg.body, meta);
                }
                return;
            }

            if (errorCode !== 0) {
                logWarn('错误', `${meta.service_name}.${meta.method_name} code=${errorCode} ${meta.error_message || ''}`);
            }
        }
    } catch (err) {
        logWarn('解码', err.message);
    }
}

// 调试：记录所有推送类型 (设为 true 可查看所有推送)
// 注意：QQ环境下只有 ItemNotify 推送，没有 LandsNotify 推送
const DEBUG_NOTIFY = false;

function handleNotify(msg) {
    if (!msg.body || msg.body.length === 0) return;
    try {
        const event = types.EventMessage.decode(msg.body);
        const type = event.message_type || '';
        const eventBody = event.body;

        // 调试：显示所有推送类型
        if (DEBUG_NOTIFY) {
            console.log(`[DEBUG] 收到推送: ${type}`);
        }

        // 被踢下线
        if (type.includes('Kickout')) {
            log('推送', `被踢下线! ${type}`);
            try {
                const notify = types.KickoutNotify.decode(eventBody);
                const reasonCode = toNum(notify.reason);
                const reasonMsg = notify.reason_message || '';

                // 显示详细的踢下线信息
                if (reasonMsg) {
                    log('推送', `原因: ${reasonMsg} (code: ${reasonCode})`);
                } else {
                    // 根据 reason code 提供更友好的提示
                    const reasonMap = {
                        1: '账号在其他地方登录',
                        2: '登录凭证过期',
                        3: '服务器维护',
                        4: '长时间未活动',
                        0: '服务器主动断开连接'
                    };
                    const friendlyMsg = reasonMap[reasonCode] || `未知原因 (code: ${reasonCode})`;
                    log('推送', `原因: ${friendlyMsg}`);

                    // 如果是长时间未活动，给出提示
                    if (reasonCode === 4 || reasonCode === 0) {
                        log('提示', 'Code 可能已过期，需要重新获取并连接');
                    }
                }
            } catch (e) {
                log('错误', `解析踢下线通知失败: ${e.message}`);
            }
            networkEvents.emit('kicked');
            return;
        }

        // 土地状态变化 (被放虫/放草/偷菜等)
        if (type.includes('LandsNotify')) {
            try {
                const notify = types.LandsNotify.decode(eventBody);
                const hostGid = toNum(notify.host_gid);
                const lands = notify.lands || [];
                if (DEBUG_NOTIFY) {
                    console.log(`[DEBUG] LandsNotify: hostGid=${hostGid}, myGid=${userState.gid}, lands=${lands.length}`);
                }
                if (lands.length > 0) {
                    // 如果是自己的农场，触发事件
                    if (hostGid === userState.gid || hostGid === 0) {
                        networkEvents.emit('landsChanged', lands);
                    }
                }
            } catch (e) { }
            return;
        }

        // 物品变化通知 (经验/金币等) - 仅更新状态栏
        // 经验ID=1101, 金币ID=1
        if (type.includes('ItemNotify')) {
            try {
                const notify = types.ItemNotify.decode(eventBody);
                const items = notify.items || [];
                for (const itemChg of items) {
                    const item = itemChg.item;
                    if (!item) continue;
                    const id = toNum(item.id);
                    const count = toNum(item.count);
                    
                    if (id === 1101) {
                        userState.exp = count;
                        updateStatusLevel(userState.level, count);
                        networkEvents.emit('stateChanged');
                    } else if (id === 1) {
                        userState.gold = count;
                        updateStatusGold(count);
                        networkEvents.emit('stateChanged');
                    }
                }
            } catch (e) { }
            return;
        }

        // 基本信息变化 (升级等)
        if (type.includes('BasicNotify')) {
            try {
                const notify = types.BasicNotify.decode(eventBody);
                if (notify.basic) {
                    const oldLevel = userState.level;
                    const oldExp = userState.exp || 0;
                    userState.level = toNum(notify.basic.level) || userState.level;
                    userState.gold = toNum(notify.basic.gold) || userState.gold;
                    const exp = toNum(notify.basic.exp);
                    if (exp > 0) {
                        userState.exp = exp;
                        updateStatusLevel(userState.level, exp);
                    }
                    updateStatusGold(userState.gold);
                    // 升级提示（避免初始化时误报）
                    if (userState.level !== oldLevel && oldLevel > 0) {
                        log('系统', `🎉 升级! Lv${oldLevel} → Lv${userState.level}`);
                    }
                    networkEvents.emit('stateChanged');
                }
            } catch (e) { }
            return;
        }

        // 好友申请通知 (微信同玩)
        if (type.includes('FriendApplicationReceivedNotify')) {
            try {
                const notify = types.FriendApplicationReceivedNotify.decode(eventBody);
                const applications = notify.applications || [];
                if (applications.length > 0) {
                    networkEvents.emit('friendApplicationReceived', applications);
                }
            } catch (e) { }
            return;
        }

        // 好友添加成功通知
        if (type.includes('FriendAddedNotify')) {
            try {
                const notify = types.FriendAddedNotify.decode(eventBody);
                const friends = notify.friends || [];
                if (friends.length > 0) {
                    const names = friends.map(f => f.name || f.remark || `GID:${toNum(f.gid)}`).join(', ');
                    log('好友', `新好友: ${names}`);
                }
            } catch (e) { }
            return;
        }

        // 物品变化通知 (收获/购买/消耗等)
        if (type.includes('ItemNotify')) {
            try {
                const notify = types.ItemNotify.decode(eventBody);
                const items = notify.items || [];
                for (const chg of items) {
                    if (!chg.item) continue;
                    const id = toNum(chg.item.id);
                    const count = toNum(chg.item.count);
                    const delta = toNum(chg.delta);
                    // 金币 ID=1
                    if (id === 1) {
                        userState.gold = count;
                        updateStatusGold(count);
                        if (delta !== 0) {
                            log('物品', `金币 ${delta > 0 ? '+' : ''}${delta} (当前: ${count})`);
                        }
                    }
                    // 经验 ID=2 (升级由 BasicNotify 处理)
                    // 经验 ID=1101 (另一种经验通知ID)
                    else if (id === 1101) {
                        userState.exp = count;
                        updateStatusExp(count);
                    }
                }
            } catch (e) { }
            return;
        }

        // 商品解锁通知 (升级后解锁新种子等)
        if (type.includes('GoodsUnlockNotify')) {
            try {
                const notify = types.GoodsUnlockNotify.decode(eventBody);
                const goods = notify.goods_list || [];
                if (goods.length > 0) {
                    log('商店', `解锁 ${goods.length} 个新商品!`);
                }
            } catch (e) { }
            return;
        }

        // 任务状态变化通知
        if (type.includes('TaskInfoNotify')) {
            try {
                const notify = types.TaskInfoNotify.decode(eventBody);
                if (notify.task_info) {
                    networkEvents.emit('taskInfoNotify', notify.task_info);
                }
            } catch (e) { }
            return;
        }

        // 其他未处理的推送类型 (调试用)
        // log('推送', `未处理类型: ${type}`);
    } catch (e) {
        logWarn('推送', `解码失败: ${e.message}`);
    }
}

// ============ 登录 ============
function sendLogin(onLoginSuccess) {
    const body = types.LoginRequest.encode(types.LoginRequest.create({
        sharer_id: toLong(0),
        sharer_open_id: '',
        device_info: {
            client_version: CONFIG.clientVersion,
            sys_software: 'iOS 26.2.1',
            network: 'wifi',
            memory: '7672',
            device_id: 'iPhone X<iPhone18,3>',
        },
        share_cfg_id: toLong(0),
        scene_id: '1256',
        report_data: {
            callback: '', cd_extend_info: '', click_id: '', clue_token: '',
            minigame_channel: 'other', minigame_platid: 2, req_id: '', trackid: '',
        },
    })).finish();

    sendMsg('gamepb.userpb.UserService', 'Login', body, (err, bodyBytes, meta) => {
        if (err) {
            log('登录', `失败: ${err.message}`);
            return;
        }
        try {
            const reply = types.LoginReply.decode(bodyBytes);
            if (reply.basic) {
                userState.gid = toNum(reply.basic.gid);
                userState.name = reply.basic.name || '未知';
                userState.level = toNum(reply.basic.level);
                userState.gold = toNum(reply.basic.gold);
                userState.exp = toNum(reply.basic.exp);

                // 更新状态栏
                updateStatusFromLogin({
                    name: userState.name,
                    level: userState.level,
                    gold: userState.gold,
                    exp: userState.exp,
                });

                console.log('');
                console.log('========== 登录成功 ==========');
                console.log(`  GID:    ${userState.gid}`);
                console.log(`  昵称:   ${userState.name}`);
                console.log(`  等级:   ${userState.level}`);
                console.log(`  金币:   ${userState.gold}`);
                if (reply.time_now_millis) {
                    syncServerTime(toNum(reply.time_now_millis));
                    console.log(`  时间:   ${new Date(toNum(reply.time_now_millis)).toLocaleString()}`);
                }
                console.log('===============================');
                console.log('');
            }

            startHeartbeat();
            if (onLoginSuccess) onLoginSuccess();
        } catch (e) {
            log('登录', `解码失败: ${e.message}`);
        }
    });
}

// ============ 心跳 ============
let lastHeartbeatResponse = Date.now();
let heartbeatMissCount = 0;

function startHeartbeat() {
    if (heartbeatTimer) clearInterval(heartbeatTimer);
    lastHeartbeatResponse = Date.now();
    heartbeatMissCount = 0;
    
    heartbeatTimer = setInterval(() => {
        if (!userState.gid) return;
        
        // 检查上次心跳响应时间，超过 60 秒没响应说明连接有问题
        const timeSinceLastResponse = Date.now() - lastHeartbeatResponse;
        if (timeSinceLastResponse > 60000) {
            heartbeatMissCount++;
            logWarn('心跳', `连接可能已断开 (${Math.round(timeSinceLastResponse/1000)}s 无响应, pending=${pendingCallbacks.size})`);
            if (heartbeatMissCount >= 2) {
                log('心跳', '尝试重连...');
                // 清理待处理的回调，避免堆积
                pendingCallbacks.forEach((cb, seq) => {
                    try { cb(new Error('连接超时，已清理')); } catch (e) {}
                });
                pendingCallbacks.clear();
            }
        }
        
        const body = types.HeartbeatRequest.encode(types.HeartbeatRequest.create({
            gid: toLong(userState.gid),
            client_version: CONFIG.clientVersion,
        })).finish();
        sendMsg('gamepb.userpb.UserService', 'Heartbeat', body, (err, replyBody) => {
            if (err || !replyBody) return;
            lastHeartbeatResponse = Date.now();
            heartbeatMissCount = 0;
            try {
                const reply = types.HeartbeatReply.decode(replyBody);
                if (reply.server_time) syncServerTime(toNum(reply.server_time));
            } catch (e) { }
        });
    }, CONFIG.heartbeatInterval);
}

// ============ WebSocket 连接 ============
function connect(code, onLoginSuccess) {
    const url = `${CONFIG.serverUrl}?platform=${CONFIG.platform}&os=${CONFIG.os}&ver=${CONFIG.clientVersion}&code=${code}&openID=`;

    ws = new WebSocket(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36 MicroMessenger/7.0.20.1781(0x6700143B) NetType/WIFI MiniProgramEnv/Windows WindowsWechat/WMPF WindowsWechat(0x63090a13)',
            'Origin': 'https://gate-obt.nqf.qq.com',
        },
    });

    ws.binaryType = 'arraybuffer';

    ws.on('open', () => {
        sendLogin(onLoginSuccess);
    });

    ws.on('message', (data) => {
        handleMessage(Buffer.isBuffer(data) ? data : Buffer.from(data));
    });

    ws.on('close', (code, reason) => {
        console.log(`[WS] 连接关闭 (code=${code})`);
        cleanup();
    });

    ws.on('error', (err) => {
        logWarn('WS', `错误: ${err.message}`);
    });
}

function cleanup() {
    if (heartbeatTimer) { clearInterval(heartbeatTimer); heartbeatTimer = null; }
    pendingCallbacks.clear();
}

function resetState() {
    cleanup();
    if (ws) {
        try { ws.removeAllListeners(); ws.close(); } catch (e) {}
        ws = null;
    }
    clientSeq = 1;
    serverSeq = 0;
    userState.gid = 0;
    userState.name = '';
    userState.level = 0;
    userState.gold = 0;
    userState.exp = 0;
    lastHeartbeatResponse = Date.now();
    heartbeatMissCount = 0;
}

function getWs() { return ws; }

module.exports = {
    connect, cleanup, resetState, getWs,
    sendMsg, sendMsgAsync,
    getUserState,
    networkEvents,
};
