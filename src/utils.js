/**
 * 通用工具函数
 */

const Long = require('long');
const EventEmitter = require('events');

// ============ 日志事件发射器（供 Electron UI 监听） ============
const logEmitter = new EventEmitter();

// ============ 服务器时间状态 ============
let serverTimeMs = 0;
let localTimeAtSync = 0;

// ============ 类型转换 ============
function toLong(val) {
    return Long.fromNumber(val);
}

function toNum(val) {
    if (Long.isLong(val)) return val.toNumber();
    return val || 0;
}

// ============ 时间相关 ============
function now() {
    return new Date().toLocaleTimeString();
}

/** 获取当前推算的服务器时间(秒) */
function getServerTimeSec() {
    if (!serverTimeMs) return Math.floor(Date.now() / 1000);
    const elapsed = Date.now() - localTimeAtSync;
    return Math.floor((serverTimeMs + elapsed) / 1000);
}

/** 同步服务器时间 */
function syncServerTime(ms) {
    serverTimeMs = ms;
    localTimeAtSync = Date.now();
}

/**
 * 将时间戳归一化为秒级
 * 大于 1e12 认为是毫秒级，转换为秒级
 */
function toTimeSec(val) {
    const n = toNum(val);
    if (n <= 0) return 0;
    if (n > 1e12) return Math.floor(n / 1000);
    return n;
}

// ============ 日志 ============
function log(tag, msg) {
    console.log(`[${now()}] [${tag}] ${msg}`);
    logEmitter.emit('log', { time: now(), category: tagToCategory(tag), level: 'info', message: `[${tag}] ${msg}` });
}

function logWarn(tag, msg) {
    console.log(`[${now()}] [${tag}] ⚠ ${msg}`);
    logEmitter.emit('log', { time: now(), category: tagToCategory(tag), level: 'warn', message: `[${tag}] ⚠ ${msg}` });
}

function tagToCategory(tag) {
    const t = tag.toLowerCase();
    if (['农场', '收获', '种植', '施肥', '铲除', '除草', '除虫', '浇水', '巡田'].includes(tag)) return 'farm';
    if (['好友', '申请', '偷菜'].includes(tag)) return 'friend';
    if (['任务'].includes(tag)) return 'task';
    if (['商店', '购买', '仓库', '物品'].includes(tag)) return 'shop';
    return 'system';
}

// ============ 异步工具 ============
function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}

module.exports = {
    toLong, toNum, now,
    getServerTimeSec, syncServerTime, toTimeSec,
    log, logWarn, sleep,
    logEmitter,
};
