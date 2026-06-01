import { ElectronAPI } from '@electron-toolkit/preload'

interface PluginAPI {
  list: () => Promise<unknown[]>
  open: (name: string) => Promise<void>
  close: (name: string) => Promise<void>
  install: (name: string) => Promise<unknown | null>
  uninstall: (name: string) => Promise<void>
  onStatusChanged: (callback: (data: { name: string; status: string }) => void) => void
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: PluginAPI
  }
}
