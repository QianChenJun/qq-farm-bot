/**
 * 机器人核心控制器
 * 封装现有模块，提供统一的控制接口供 IPC 调用
 */

const path = require('path');
const EventEmitter = require('events');

// 现有模块
const { CONFIG } = require('../src/config');
const { loadProto } = require('../src/proto');
const { connect, cleanup, getWs, getUserState, networkEvents } = require('../src/network');
const { startFarmCheckLoop, stopFarmCheckLoop, setOverrideSeedId } = require('../src/farm');
const { startFriendCheckLoop, stopFriendCheckLoop } = require('../src/friend');
const { initTaskSystem, cleanupTaskSystem } = require('../src/task');
const { initStatusBar, cleanupStatusBar, setStatusPlatform, statusData, setElectronMode } = require('../src/status');
const { startSellLoop, stopSellLoop } = require('../src/warehouse');
const { processInviteCodes } = require('../src/invite');
const { logEmitter } = require('../src/utils');
const { getLevelExpProgress } = require('../src/gameConfig');

// 新增模块
const store = require('./store');
const { calculatePlantPlan } = require('./planner');

// ============ 状态 ============
const botEvents = new EventEmitter();
let isConnected = false;
let isConnecting = false;
let protoLoaded = false;
let logs = [];
const MAX_LOGS = 1000;

// ============ 初始化 ============
async function init() {
  setElectronMode(true);
  store.load();

  if (!protoLoaded) {
    await loadProto();
    protoLoaded = true;
  }

  // 监听日志事件，转发到 UI
  logEmitter.on('log', (entry) => {
    logs.push(entry);
    if (logs.length > MAX_LOGS) logs.shift();
    botEvents.emit('log', entry);
  });

  // 应用保存的配置
  const config = store.get();
  CONFIG.farmCheckInterval = Math.max(config.farmInterval, 1) * 1000;
  CONFIG.friendCheckInterval = Math.max(config.friendInterval, 1) * 1000;

  if (config.plantMode === 'manual' && config.plantSeedId > 0) {
    setOverrideSeedId(config.plantSeedId);
  }
}

// ============ 连接 ============
function botConnect(code, platform) {
  return new Promise((resolve) => {
    if (isConnecting) {
      resolve({ success: false, error: '正在连接中' });
      return;
    }

    isConnecting = true;
    let resolved = false;

    CONFIG.platform = platform || store.get().platform || 'qq';
    setStatusPlatform(CONFIG.platform);
    initStatusBar();

    connect(code, async () => {
      isConnected = true;
      isConnecting = false;

      // 处理邀请码
      await processInviteCodes();

      // 根据功能开关启动模块
      const features = store.get().features;
      if (features.autoHarvest !== false || features.autoPlant !== false ||
          features.autoWeed !== false || features.autoBug !== false ||
          features.autoWater !== false || features.autoFertilize !== false) {
        startFarmCheckLoop();
      }
      if (features.friendPatrol !== false || features.autoSteal !== false || features.friendHelp !== false) {
        startFriendCheckLoop();
      }
      if (features.autoTask !== false) {
        initTaskSystem();
      }

      botEvents.emit('status-update', getStatus());
      if (!resolved) {
        resolved = true;
        resolve({ success: true });
      }
    });

    // 监听连接关闭和错误（connect 同步创建 ws，此时可以拿到）
    const ws = getWs();
    if (ws) {
      ws.on('close', () => {
        isConnected = false;
        isConnecting = false;
        botEvents.emit('status-update', { connected: false });
      });
      ws.on('error', (err) => {
        isConnected = false;
        isConnecting = false;
        if (!resolved) {
          resolved = true;
          resolve({ success: false, error: err.message || '连接失败' });
        }
      });
    }

    // 超时处理
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        isConnecting = false;
        resolve({ success: false, error: '连接超时' });
      }
    }, 15000);
  });
}

// ============ 断开 ============
function botDisconnect() {
  stopFarmCheckLoop();
  stopFriendCheckLoop();
  cleanupTaskSystem();
  stopSellLoop();
  cleanupStatusBar();
  cleanup();
  const ws = getWs();
  if (ws) ws.close();
  isConnected = false;
  botEvents.emit('status-update', { connected: false });
  return { success: true };
}

// ============ 获取状态 ============
function getStatus() {
  const state = getUserState();
  const config = store.get();
  let expProgress = { current: 0, needed: 0 };
  if (state.level > 0) {
    expProgress = getLevelExpProgress(state.level, state.exp);
  }

  return {
    connected: isConnected,
    gid: state.gid,
    name: state.name,
    level: state.level,
    gold: state.gold,
    exp: state.exp,
    expProgress,
    features: config.features,
    currentPlant: null,
    landSummary: { total: 0, growing: 0, harvestable: 0, empty: 0 },
  };
}

// ============ 功能开关 ============
function setFeatureEnabled(feature, enabled) {
  const features = store.setFeature(feature, enabled);

  // 实时生效：根据开关状态启停模块
  if (isConnected) {
    const farmFeatures = ['autoHarvest', 'autoPlant', 'autoFertilize', 'autoWeed', 'autoBug', 'autoWater'];
    const friendFeatures = ['friendPatrol', 'autoSteal', 'friendHelp'];

    if (farmFeatures.includes(feature)) {
      const anyFarmOn = farmFeatures.some(f => features[f] !== false);
      if (anyFarmOn) startFarmCheckLoop();
      else stopFarmCheckLoop();
    }

    if (friendFeatures.includes(feature)) {
      const anyFriendOn = friendFeatures.some(f => features[f] !== false);
      if (anyFriendOn) startFriendCheckLoop();
      else stopFriendCheckLoop();
    }

    if (feature === 'autoTask') {
      if (enabled) initTaskSystem();
      else cleanupTaskSystem();
    }
  }

  return { success: true, features };
}

// ============ 配置 ============
function getConfig() {
  return store.get();
}

function saveConfig(partial) {
  const config = store.update(partial);

  // 实时应用间隔配置
  if (partial.farmInterval !== undefined) {
    CONFIG.farmCheckInterval = Math.max(partial.farmInterval, 1) * 1000;
  }
  if (partial.friendInterval !== undefined) {
    CONFIG.friendCheckInterval = Math.max(partial.friendInterval, 1) * 1000;
  }

  // 应用种植模式
  if (partial.plantMode !== undefined || partial.plantSeedId !== undefined) {
    if (config.plantMode === 'manual' && config.plantSeedId > 0) {
      setOverrideSeedId(config.plantSeedId);
    } else {
      setOverrideSeedId(0);
    }
  }

  return { success: true };
}

// ============ 种植策略 ============
function getPlantPlan() {
  const state = getUserState();
  const level = state.level || 1;
  return calculatePlantPlan(level);
}

// ============ 日志 ============
function getLogs() {
  return logs;
}

function clearLogs() {
  logs = [];
}

module.exports = {
  init,
  botConnect,
  botDisconnect,
  getStatus,
  setFeatureEnabled,
  getConfig,
  saveConfig,
  getPlantPlan,
  getLogs,
  clearLogs,
  botEvents,
};
