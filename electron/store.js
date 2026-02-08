/**
 * 配置持久化模块
 * 使用 JSON 文件存储配置到 Electron userData 目录
 */

const fs = require('fs');
const path = require('path');
const { app } = require('electron');

const CONFIG_FILE = 'config.json';

const DEFAULT_CONFIG = {
  platform: 'qq',
  farmInterval: 10,
  friendInterval: 1,
  plantMode: 'auto',
  plantSeedId: 0,
  features: {
    autoHarvest: true,
    autoPlant: true,
    autoFertilize: true,
    autoWeed: true,
    autoBug: true,
    autoWater: true,
    friendPatrol: true,
    autoSteal: true,
    friendHelp: true,
    autoTask: true,
  },
};

let config = null;

function getConfigPath() {
  return path.join(app.getPath('userData'), CONFIG_FILE);
}

function load() {
  try {
    const filePath = getConfigPath();
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf8');
      const saved = JSON.parse(raw);
      // Merge with defaults to ensure new fields exist
      config = {
        ...DEFAULT_CONFIG,
        ...saved,
        features: { ...DEFAULT_CONFIG.features, ...(saved.features || {}) },
      };
    } else {
      config = { ...DEFAULT_CONFIG, features: { ...DEFAULT_CONFIG.features } };
    }
  } catch (e) {
    console.warn('[store] Failed to load config:', e.message);
    config = { ...DEFAULT_CONFIG, features: { ...DEFAULT_CONFIG.features } };
  }
  return config;
}

function save() {
  try {
    const filePath = getConfigPath();
    fs.writeFileSync(filePath, JSON.stringify(config, null, 2), 'utf8');
  } catch (e) {
    console.warn('[store] Failed to save config:', e.message);
  }
}

function get() {
  if (!config) load();
  return config;
}

function update(partial) {
  if (!config) load();
  if (partial.features) {
    config.features = { ...config.features, ...partial.features };
    delete partial.features;
  }
  Object.assign(config, partial);
  save();
  return config;
}

function getFeature(name) {
  if (!config) load();
  return config.features[name] !== false;
}

function setFeature(name, enabled) {
  if (!config) load();
  config.features[name] = enabled;
  save();
  return config.features;
}

module.exports = { load, save, get, update, getFeature, setFeature, DEFAULT_CONFIG };
