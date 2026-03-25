const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('nodetraceDesktop', {
  isElectron: true,
  platform: process.platform,
  openWindow: (options) => ipcRenderer.invoke('desktop:open-window', options),
  closeWindow: () => ipcRenderer.invoke('desktop:close-window'),
  minimizeWindow: () => ipcRenderer.invoke('desktop:minimize-window'),
  toggleMaximizeWindow: () => ipcRenderer.invoke('desktop:toggle-maximize-window'),
  getWindowState: () => ipcRenderer.invoke('desktop:get-window-state'),
  onWindowStateChange: (callback) => {
    const listener = (_event, value) => callback(value)
    ipcRenderer.on('desktop:window-state', listener)
    return () => {
      ipcRenderer.removeListener('desktop:window-state', listener)
    }
  },
})
