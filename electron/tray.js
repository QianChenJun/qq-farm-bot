/**
 * 系统托盘管理
 * 提供托盘图标、右键菜单
 */

const { Tray, Menu, nativeImage, app, shell } = require('electron');
const path = require('path');

let tray = null;

/**
 * 创建系统托盘
 * @param {BrowserWindow} mainWindow - 主窗口实例
 */
function createTray(mainWindow) {
  // 创建 16x16 的简易图标（绿色方块）
  const icon = nativeImage.createFromBuffer(
    createIconBuffer(), { width: 16, height: 16 }
  );

  tray = new Tray(icon);
  tray.setToolTip('QQ农场助手');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示窗口',
      click: () => {
        mainWindow.show();
        mainWindow.focus();
      },
    },
    { type: 'separator' },
    {
      label: '⭐ GitHub项目（开源免费）',
      click: () => {
        shell.openExternal('https://github.com/QianChenJun/qq-farm-bot');
      },
    },
    {
      label: '⚠️ 付费购买请退款',
      enabled: false,
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => {
        app.isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  return tray;
}

/**
 * 生成一个 16x16 的 PNG buffer（绿色圆形图标）
 */
function createIconBuffer() {
  // 16x16 RGBA raw pixel data
  const size = 16;
  const pixels = Buffer.alloc(size * size * 4, 0);

  const cx = 7.5, cy = 7.5, r = 6;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      const idx = (y * size + x) * 4;
      if (dist <= r) {
        pixels[idx] = 76;      // R
        pixels[idx + 1] = 175;  // G
        pixels[idx + 2] = 80;   // B
        pixels[idx + 3] = 255;  // A
      }
    }
  }

  return nativeImage.createFromBuffer(pixels, {
    width: size, height: size, scaleFactor: 1.0,
  }).toPNG();
}

function destroyTray() {
  if (tray) {
    tray.destroy();
    tray = null;
  }
}

module.exports = { createTray, destroyTray };
