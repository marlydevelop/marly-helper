const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('api', {
  init: () => ipcRenderer.invoke('init'),
  pickDir: (cur) => ipcRenderer.invoke('pick-dir', cur),
  fixDir: (p) => ipcRenderer.invoke('fix-dir', p),
  install: (o) => ipcRenderer.invoke('install', o),
  launch: (dir) => ipcRenderer.invoke('launch', dir),
  setTheme: (dark) => ipcRenderer.invoke('theme', dark),
  min: () => ipcRenderer.invoke('win-min'),
  close: () => ipcRenderer.invoke('win-close'),
  onProgress: (cb) => ipcRenderer.on('progress', (_e, p, f) => cb(p, f))
});
