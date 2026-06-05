import { BrowserWindow, BrowserWindowConstructorOptions, ipcMain, protocol, net } from 'electron'
import { join, resolve } from 'path'
import { existsSync, readFileSync, readdirSync } from 'fs'
import { pathToFileURL } from 'url'
import { is } from '@electron-toolkit/utils'
import type { PluginConfig, PluginMeta, PluginInstance, BackendModule, DevPluginInfo } from './plugin-types'

const IPC_CHANNELS = {
  LIST: 'pm:list',
  OPEN: 'pm:open',
  CLOSE: 'pm:close',
  INSTALL: 'pm:install',
  UNINSTALL: 'pm:uninstall',
  STATUS_CHANGED: 'pm:status-changed'
} as const

export { IPC_CHANNELS }

export class PluginManager {
  private pluginsDir: string
  private plugins: Map<string, PluginInstance> = new Map()
  private windows: Map<string, BrowserWindow> = new Map()
  private backends: Map<string, BackendModule> = new Map()

  constructor() {
    if (is.dev) {
      this.pluginsDir = resolve(__dirname, '../../../../plugin-dev-output')
    } else {
      this.pluginsDir = join(process.resourcesPath, 'plugins')
    }
  }

  /** Scan the plugins directory and discover all available plugins */
  async discover(): Promise<PluginMeta[]> {
    if (is.dev) {
      return this.discoverDev()
    }

    this.plugins.clear()
    // const { readdirSync } = require('fs') as typeof import('fs')

    if (!existsSync(this.pluginsDir)) {
      console.warn(`[PluginManager] Plugin directory not found: ${this.pluginsDir}`)
      return []
    }

    const entries = readdirSync(this.pluginsDir, { withFileTypes: true })
    for (const entry of entries) {
      if (!entry.isDirectory()) continue
      const config = this.loadConfig(entry.name)
      if (config) {
        const meta: PluginMeta = {
          name: config.name,
          displayName: config.displayName,
          version: config.version,
          devPort: config.devPort,
          windowConfig: config.window
        }
        this.plugins.set(meta.name, { meta, status: 'closed' })
      }
    }

    console.log(`[PluginManager] Discovered ${this.plugins.size} plugin(s)`)
    // Load backend scripts for plugins that declare one
    for (const [name] of this.plugins) {
      this.loadBackend(name)
    }
    return this.getPlugins()
  }

  /** Dev mode: scan monorepo packages/plugin-* dirs and extract devServer.port from rspack configs */
  private scanPluginDirs(): Map<string, number> {
    const result = new Map<string, number>()
    const monorepoRoot = resolve(__dirname, is.dev ? '../../../../' : '.')
    const packagesDir = resolve(monorepoRoot, 'packages')

    if (!existsSync(packagesDir)) return result

    const entries = readdirSync(packagesDir, { withFileTypes: true })
    for (const entry of entries) {
      if (!entry.isDirectory() || !entry.name.startsWith('plugin-')) continue

      const configPath = join(packagesDir, entry.name, 'rspack.config.ts')
      if (!existsSync(configPath)) continue

      try {
        const content = readFileSync(configPath, 'utf-8')
        const match = content.match(/devServer:\s*\{\s*port:\s*(\d+)/)
        if (match) {
          result.set(entry.name, parseInt(match[1]))
          console.log(`[PluginManager] Dev plugin found: ${entry.name} on port ${match[1]}`)
        }
      } catch (err) {
        console.warn(`[PluginManager] Failed to read rspack config for ${entry.name}:`, err)
      }
    }

    return result
  }

  /** Dev mode: fetch plugin info from a plugin's dev server */
  private async fetchPluginInfo(port: number): Promise<DevPluginInfo | null> {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 3000)
      const response = await fetch(`http://localhost:${port}/__plugin-info`, {
        signal: controller.signal
      })
      clearTimeout(timeout)

      if (!response.ok) {
        console.warn(`[PluginManager] /__plugin-info on port ${port} returned ${response.status}`)
        return null
      }

      return (await response.json()) as DevPluginInfo
    } catch (err) {
      console.warn(`[PluginManager] Failed to fetch /__plugin-info on port ${port}:`, err)
      return null
    }
  }

  /** Dev mode: discover plugins via dev servers instead of filesystem */
  private async discoverDev(): Promise<PluginMeta[]> {
    this.plugins.clear()
    const pluginPorts = this.scanPluginDirs()

    for (const [name, port] of pluginPorts) {
      const info = await this.fetchPluginInfo(port)
      if (!info) continue

      if (!existsSync(info.configPath)) {
        console.warn(`[PluginManager] Config not found at ${info.configPath}`)
        continue
      }

      try {
        const config: PluginConfig = JSON.parse(readFileSync(info.configPath, 'utf-8'))

        const meta: PluginMeta = {
          name: config.name,
          displayName: config.displayName,
          version: config.version,
          devPort: port,
          windowConfig: config.window
        }
        this.plugins.set(meta.name, { meta, status: 'closed' })

        // Load backend with dev-specific path
        if (config.backend && info.backendPath) {
          await this.loadBackend(config.name, info.backendPath)
        }
      } catch (err) {
        console.warn(`[PluginManager] Failed to load config for ${name}:`, err)
      }
    }

    console.log(`[PluginManager] Discovered ${this.plugins.size} plugin(s) in dev mode`)
    return this.getPlugins()
  }

  /** Load and validate a plugin.config.json for a given plugin name */
  private loadConfig(name: string): PluginConfig | null {
    const configPath = join(this.pluginsDir, name, 'plugin.config.json')
    if (!existsSync(configPath)) return null

    try {
      const raw = readFileSync(configPath, 'utf-8')
      const config: PluginConfig = JSON.parse(raw)

      if (!config.name || !config.displayName) {
        console.warn(
          `[PluginManager] Invalid plugin.config.json in ${name}: missing required fields`
        )
        return null
      }

      if (!config.window) {
        config.window = { width: 900, height: 600 }
      }

      return config
    } catch (err) {
      console.warn(`[PluginManager] Failed to parse plugin.config.json in ${name}:`, err)
      return null
    }
  }

  /** Open a plugin window */
  async open(name: string): Promise<void> {
    const instance = this.plugins.get(name)
    if (!instance) throw new Error(`Plugin "${name}" not found`)
    if (this.windows.has(name)) {
      this.windows.get(name)?.focus()
      return
    }

    instance.status = 'opening'
    this.broadcastStatus(name)

    const { meta } = instance
    const winOptions: BrowserWindowConstructorOptions = {
      width: meta.windowConfig.width,
      height: meta.windowConfig.height,
      minWidth: meta.windowConfig.minWidth,
      minHeight: meta.windowConfig.minHeight,
      title: meta.windowConfig.title || meta.displayName,
      autoHideMenuBar: true,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      }
    }

    const win = new BrowserWindow(winOptions)

    win.on('closed', () => {
      this.windows.delete(name)
      instance.status = 'closed'
      this.broadcastStatus(name)
    })

    if (is.dev && meta.devPort) {
      const devUrl = `http://localhost:${meta.devPort}`
      try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 500)
        const response = await fetch(devUrl, { signal: controller.signal })
        clearTimeout(timeout)
        if (response.ok) {
          const text = await response.text()
          // 确保返回的是插件自己的页面，不是核心渲染器
          if (text.includes('<title>' + (meta.windowConfig.title || meta.displayName) + '</title>')) {
            await win.loadURL(devUrl)
            this.windows.set(name, win)
            instance.status = 'opened'
            this.broadcastStatus(name)
            return
          }
        }
      } catch {
        console.warn(`[PluginManager] Dev server for ${name} not reachable, falling back to file`)
      }
    }

    await win.loadURL('plugin-app://' + name + '/index.html')
    this.windows.set(name, win)
    instance.status = 'opened'
    this.broadcastStatus(name)
  }

  /** Close a plugin window */
  close(name: string): void {
    const win = this.windows.get(name)
    if (win) {
      win.close()
      this.windows.delete(name)
    }
    const instance = this.plugins.get(name)
    if (instance) {
      instance.status = 'closed'
      this.broadcastStatus(name)
    }
  }

  /** Install a plugin (add to managed list) */
  install(name: string): PluginMeta | null {
    const config = this.loadConfig(name)
    if (!config) return null

    const meta: PluginMeta = {
      name: config.name,
      displayName: config.displayName,
      version: config.version,
      devPort: config.devPort,
      windowConfig: config.window
    }
    this.plugins.set(meta.name, { meta, status: 'closed' })
    console.log(`[PluginManager] Installed plugin: ${meta.name}`)
    return meta
  }

  /** Uninstall a plugin (remove from managed list) */
  uninstall(name: string): void {
    this.close(name)
    // Deactivate backend if exists
    const backend = this.backends.get(name)
    if (backend) {
      try {
        backend.deactivate?.()
      } catch (err) {
        console.error(`[PluginManager] Error deactivating backend for ${name}:`, err)
      }
      this.backends.delete(name)
    }
    this.plugins.delete(name)
    console.log(`[PluginManager] Uninstalled plugin: ${name}`)
  }

  /** Get all plugin metadata */
  getPlugins(): PluginMeta[] {
    return Array.from(this.plugins.values()).map((p) => p.meta)
  }

  /** Get plugin status */
  getStatus(name: string): string | null {
    return this.plugins.get(name)?.status ?? null
  }

  /** Register custom protocol for serving plugin files (allows ES modules to work) */
  registerProtocol(): void {
    protocol.handle('plugin-app', async (request) => {
      try {
        const url = new URL(request.url)
        const pluginName = url.hostname
        const filePath = join(this.pluginsDir, pluginName, decodeURIComponent(url.pathname))
        return await net.fetch(pathToFileURL(filePath).toString())
      } catch {
        return new Response('Not Found', { status: 404 })
      }
    })
  }

  /** Load a plugin's backend script if declared */
  private async loadBackend(name: string, backendOverride?: string): Promise<void> {
    let backendPath: string

    if (backendOverride) {
      backendPath = backendOverride
    } else {
      const config = this.loadConfig(name)
      if (!config?.backend) return
      backendPath = join(this.pluginsDir, name, config.backend)
    }

    if (!existsSync(backendPath)) {
      console.warn(`[PluginManager] Backend script not found for ${name}: ${backendPath}`)
      return
    }

    try {
      const backendUrl = pathToFileURL(backendPath).toString()
      const mod: Record<string, unknown> = await import(backendUrl)
      // CJS module.exports 在 import() 时会被映射到 default 上
      const exported: BackendModule = (mod.default ?? mod) as BackendModule
      if (typeof exported.activate === 'function') {
        exported.activate(name)
        this.backends.set(name, exported)
        console.log(`[PluginManager] Backend activated for ${name}`)
      } else {
        console.warn(`[PluginManager] Backend script for ${name} has no activate export`)
      }
    } catch (err) {
      console.error(`[PluginManager] Failed to load backend for ${name}:`, err)
    }
  }

  /** Register all IPC handlers */
  registerIpcHandlers(): void {
    ipcMain.handle(IPC_CHANNELS.LIST, () => {
      return this.getPlugins()
    })

    ipcMain.handle(IPC_CHANNELS.OPEN, (_event, name: string) => {
      this.open(name)
    })

    ipcMain.handle(IPC_CHANNELS.CLOSE, (_event, name: string) => {
      this.close(name)
    })

    ipcMain.handle(IPC_CHANNELS.INSTALL, (_event, name: string) => {
      return this.install(name)
    })

    ipcMain.handle(IPC_CHANNELS.UNINSTALL, (_event, name: string) => {
      this.uninstall(name)
    })

    console.log('[PluginManager] IPC handlers registered')
  }

  /** Broadcast status change to all renderers */
  private broadcastStatus(name: string): void {
    const status = this.plugins.get(name)?.status ?? 'closed'
    BrowserWindow.getAllWindows().forEach((win) => {
      win.webContents.send(IPC_CHANNELS.STATUS_CHANGED, { name, status })
    })
  }
}
