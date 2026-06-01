import { useState, useEffect, useCallback } from 'react'

interface PluginMeta {
  name: string
  displayName: string
  version: string
  devPort: number
  windowConfig: {
    width: number
    height: number
    minWidth?: number
    minHeight?: number
    title?: string
  }
}

type PluginStatus = 'closed' | 'opening' | 'opened'

interface PluginWithStatus extends PluginMeta {
  status: PluginStatus
}

export function usePlugins() {
  const [plugins, setPlugins] = useState<PluginWithStatus[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const list = await window.api.list()
      setPlugins(
        (list as PluginMeta[]).map((p) => ({
          ...p,
          status: 'closed' as PluginStatus
        }))
      )
    } catch (err) {
      console.error('Failed to load plugins:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
    window.api.onStatusChanged(({ name, status }) => {
      setPlugins((prev) =>
        prev.map((p) => (p.name === name ? { ...p, status: status as PluginStatus } : p))
      )
    })
  }, [refresh])

  const open = useCallback((name: string) => {
    window.api.open(name)
  }, [])

  const close = useCallback((name: string) => {
    window.api.close(name)
  }, [])

  const install = useCallback(
    async (name: string) => {
      const result = await window.api.install(name)
      if (result) {
        await refresh()
        return true
      }
      return false
    },
    [refresh]
  )

  const uninstall = useCallback(
    async (name: string) => {
      await window.api.uninstall(name)
      await refresh()
    },
    [refresh]
  )

  return { plugins, loading, open, close, install, uninstall, refresh }
}
