const { contextBridge, ipcRenderer } = require('electron');

// Expose IPC APIs to the renderer process
contextBridge.exposeInMainWorld('electron', {
  // Playlist handling
  selectPlaylistFiles: () => ipcRenderer.invoke('select-playlist-files'),
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  
  // HTTP Headers handling for IPTV streams
  setRequestHeaders: (headers) => ipcRenderer.invoke('set-request-headers', headers),
  setStreamHeaders: (url, headers) => ipcRenderer.invoke('set-stream-headers', { url, headers }),
  
  // Development helpers
  onDevMode: (callback) => ipcRenderer.on('dev-mode', callback),
});
