import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const IPC_CHANNELS = {
  LIST: 'pm:list',
  OPEN: 'pm:open',
  CLOSE: 'pm:close',
  INSTALL: 'pm:install',
  UNINSTALL: 'pm:uninstall',
  STATUS_CHANGED: 'pm:status-changed'
} as const

const pluginApi = {
  list: (): Promise<unknown[]> => ipcRenderer.invoke(IPC_CHANNELS.LIST),
  open: (name: string): Promise<void> => ipcRenderer.invoke(IPC_CHANNELS.OPEN, name),
  close: (name: string): Promise<void> => ipcRenderer.invoke(IPC_CHANNELS.CLOSE, name),
  install: (name: string): Promise<unknown | null> => ipcRenderer.invoke(IPC_CHANNELS.INSTALL, name),
  uninstall: (name: string): Promise<void> => ipcRenderer.invoke(IPC_CHANNELS.UNINSTALL, name),
  onStatusChanged: (callback: (data: { name: string; status: string }) => void): void => {
    ipcRenderer.on(IPC_CHANNELS.STATUS_CHANGED, (_event, data) => callback(data))
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', pluginApi)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = pluginApi
}
