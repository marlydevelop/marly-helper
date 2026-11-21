const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('bw', {
  min: () => ipcRenderer.send('site:min'),
  close: () => ipcRenderer.send('site:close')
});
