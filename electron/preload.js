const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
  on: (channel, callback) => {
    const listener = (_event, ...args) => callback(...args);
    ipcRenderer.on(channel, listener);
  },
  off: (channel, callback) => {
    ipcRenderer.removeAllListeners(channel);
  },
});
