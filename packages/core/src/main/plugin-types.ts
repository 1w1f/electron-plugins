export interface PluginWindowConfig {
  width: number
  height: number
  minWidth?: number
  minHeight?: number
  title?: string
}

export interface PluginConfig {
  name: string
  displayName: string
  version: string
  devPort: number
  window: PluginWindowConfig
  backend?: string
}

export type PluginStatus = 'closed' | 'opening' | 'opened'

export interface PluginMeta {
  name: string
  displayName: string
  version: string
  devPort: number
  windowConfig: PluginWindowConfig
}

export interface PluginInstance {
  meta: PluginMeta
  status: PluginStatus
}

export interface BackendModule {
  activate: (pluginName: string) => void
  deactivate?: () => void
}

export const PLUGINS_DIR_NAME = 'plugin-dev-output'
