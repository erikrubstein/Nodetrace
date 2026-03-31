const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('nodetraceDesktop', {
  isElectron: true,
  platform: process.platform,
  openWindow: (options) => ipcRenderer.invoke('desktop:open-window', options),
  closeWindow: () => ipcRenderer.invoke('desktop:close-window'),
  minimizeWindow: () => ipcRenderer.invoke('desktop:minimize-window'),
  toggleMaximizeWindow: () => ipcRenderer.invoke('desktop:toggle-maximize-window'),
  getWindowState: () => ipcRenderer.invoke('desktop:get-window-state'),
  getServerState: () => ipcRenderer.invoke('desktop:get-server-state'),
  createServerProfile: (profile) => ipcRenderer.invoke('desktop:create-server-profile', profile),
  updateServerProfile: (id, profile) => ipcRenderer.invoke('desktop:update-server-profile', { id, profile }),
  deleteServerProfile: (id) => ipcRenderer.invoke('desktop:delete-server-profile', id),
  selectServerProfile: (id) => ipcRenderer.invoke('desktop:select-server-profile', id),
  onWindowStateChange: (callback) => {
    const listener = (_event, value) => callback(value)
    ipcRenderer.on('desktop:window-state', listener)
    return () => {
      ipcRenderer.removeListener('desktop:window-state', listener)
    }
  },
  onServerStateChange: (callback) => {
    const listener = (_event, value) => callback(value)
    ipcRenderer.on('desktop:server-state', listener)
    return () => {
      ipcRenderer.removeListener('desktop:server-state', listener)
    }
  },
})
