import { ipcMain } from 'electron'

const channels = new Set<string>()

function register(channel: string, handler: (...args: any[]) => any): void {
  ipcMain.handle(channel, handler)
  channels.add(channel)
}

export function activate(pluginName: string): void {
  console.log(`[${pluginName}] Backend activated`)

  register(`${pluginName}:get-version`, () => '1.0.0')
  register(`${pluginName}:get-data`, () => ({
    status: 'ok',
    timestamp: Date.now(),
    items: [{ id: 1, label: '示例数据' }]
  }))
}

export function deactivate(): void {
  for (const ch of channels) {
    ipcMain.removeHandler(ch)
  }
  channels.clear()
}
