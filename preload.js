const { contextBridge, ipcRenderer } = require('electron');

let _cachedData = null;
try {
  _cachedData = ipcRenderer.sendSync('store-get-all-sync');
} catch (error) {
  _cachedData = null;
}

contextBridge.exposeInMainWorld('store', {
  initialData: _cachedData,
  setAll: (data) => ipcRenderer.invoke('store-set-all', data),
  clear: () => ipcRenderer.invoke('store-clear')
});

contextBridge.exposeInMainWorld('electronNotify', {
  send: (title, body) => ipcRenderer.invoke('send-notification', title, body)
});