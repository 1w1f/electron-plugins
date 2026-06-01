import { useEffect, useState } from 'react'

const ipcRenderer = (window as any).require('electron').ipcRenderer
const pluginName = 'plugin-b'

function App(): React.JSX.Element {
  const [version, setVersion] = useState('')
  const [data, setData] = useState<{ status: string; timestamp: number; items: { id: number; label: string }[] } | null>(null)

  useEffect(() => {
    ipcRenderer.invoke(`${pluginName}:get-version`).then(setVersion)
    ipcRenderer.invoke(`${pluginName}:get-data`).then(setData)
  }, [])

  return (
    <div style={{ padding: 24, fontFamily: 'sans-serif' }}>
      <h1>代码编辑器</h1>
      <p>Plugin-B 已加载</p>
      {version && <p>版本: {version}</p>}
      {data && (
        <ul>
          {data.items.map(item => <li key={item.id}>{item.label}</li>)}
        </ul>
      )}
    </div>
  )
}

export default App
