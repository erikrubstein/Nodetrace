import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('nodetraceDesktop', {
  isElectron: true,
  platform: process.platform,
  openWindow: (options) => ipcRenderer.invoke('desktop:open-window', options),
})
