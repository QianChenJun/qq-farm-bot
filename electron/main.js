const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const bot = require('./bot');
const { registerIPC } = require('./ipc');
const { createTray, destroyTray } = require('./tray');

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    resizable: false,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    backgroundColor: '#1a1a2e',
  });

  // 开发模式加载 Vite dev server，生产模式加载打包文件
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'renderer', 'index.html'));
  }

  // 窗口控制 IPC
  ipcMain.handle('window:minimize', () => {
    mainWindow.minimize();
  });
  ipcMain.handle('window:close', () => {
    mainWindow.hide();
  });

  // 关闭按钮 → 最小化到托盘（除非正在退出）
  mainWindow.on('close', (e) => {
    if (!app.isQuitting) {
      e.preventDefault();
      mainWindow.hide();
    }
  });

  // 注册 IPC 通道
  registerIPC(mainWindow);

  // 创建系统托盘
  createTray(mainWindow);
}

app.whenReady().then(async () => {
  await bot.init();
  createWindow();
});

app.on('before-quit', () => {
  app.isQuitting = true;
  bot.botDisconnect();
  destroyTray();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

module.exports = { getMainWindow: () => mainWindow };
