import { usePlugins } from '../hooks/usePlugins'
import { PluginCard } from './PluginCard'
import { InstallBar } from './InstallBar'

export function PluginDashboard(): React.JSX.Element {
  const { plugins, loading, open, close, install, uninstall, refresh } = usePlugins()

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h1 style={titleStyle}>☰ 插件管理中心</h1>
        <button style={scanBtnStyle} onClick={refresh}>
          ↻ 扫描插件目录
        </button>
      </div>

      {loading ? (
        <div style={emptyStyle}>正在加载插件列表...</div>
      ) : plugins.length === 0 ? (
        <div style={emptyStyle}>
          <div style={emptyIconStyle}>📦</div>
          <div>暂无可用插件</div>
          <div style={emptyHintStyle}>请将插件构建产物放置到 plugin-dev-output/ 目录后点击扫描</div>
        </div>
      ) : (
        <div style={gridStyle}>
          {plugins.map((plugin) => (
            <PluginCard
              key={plugin.name}
              name={plugin.name}
              displayName={plugin.displayName}
              version={plugin.version}
              status={plugin.status}
              onOpen={open}
              onClose={close}
              onUninstall={uninstall}
            />
          ))}
        </div>
      )}

      <div style={dividerStyle} />

      <InstallBar onInstall={install} />
    </div>
  )
}

const containerStyle: React.CSSProperties = {
  maxWidth: 900,
  margin: '0 auto',
  padding: '32px 24px'
}

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 32
}

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 24,
  fontWeight: 600,
  color: '#1a1a1a'
}

const scanBtnStyle: React.CSSProperties = {
  padding: '8px 20px',
  background: '#fff',
  border: '1px solid #d9d9d9',
  borderRadius: 6,
  cursor: 'pointer',
  fontSize: 14,
  fontWeight: 500
}

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
  gap: 16
}

const emptyStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: '60px 20px',
  color: '#999',
  fontSize: 15
}

const emptyIconStyle: React.CSSProperties = {
  fontSize: 48,
  marginBottom: 12
}

const emptyHintStyle: React.CSSProperties = {
  marginTop: 8,
  fontSize: 13,
  color: '#bbb'
}

const dividerStyle: React.CSSProperties = {
  borderTop: '1px solid #f0f0f0',
  margin: '32px 0'
}
