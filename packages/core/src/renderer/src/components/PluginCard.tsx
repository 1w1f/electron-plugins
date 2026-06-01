interface PluginCardProps {
  name: string
  displayName: string
  version: string
  status: 'closed' | 'opening' | 'opened'
  onOpen: (name: string) => void
  onClose: (name: string) => void
  onUninstall: (name: string) => void
}

const statusStyles: Record<string, React.CSSProperties> = {
  opened: { background: '#52c41a', color: '#fff' },
  opening: { background: '#faad14', color: '#fff' },
  closed: { background: '#d9d9d9', color: '#666' }
}

const statusLabels: Record<string, string> = {
  opened: '运行中',
  opening: '启动中',
  closed: '已停止'
}

export function PluginCard({
  name,
  displayName,
  version,
  status,
  onOpen,
  onClose,
  onUninstall
}: PluginCardProps): React.JSX.Element {
  return (
    <div style={cardStyle}>
      <div style={headerStyle}>
        <div style={nameStyle}>{displayName}</div>
        <div style={{ ...statusStyle, ...statusStyles[status] }}>{statusLabels[status]}</div>
      </div>
      <div style={metaStyle}>
        <span style={codeStyle}>{name}</span>
        <span style={versionStyle}>v{version}</span>
      </div>
      <div style={actionsStyle}>
        {status === 'opened' ? (
          <button style={btnStyle} onClick={() => onClose(name)}>
            关闭
          </button>
        ) : (
          <button style={{ ...btnStyle, ...btnPrimaryStyle }} onClick={() => onOpen(name)}>
            打开
          </button>
        )}
        <button style={{ ...btnStyle, ...btnDangerStyle }} onClick={() => onUninstall(name)}>
          卸载
        </button>
      </div>
    </div>
  )
}

const cardStyle: React.CSSProperties = {
  border: '1px solid #e8e8e8',
  borderRadius: 8,
  padding: 20,
  background: '#fff',
  display: 'flex',
  flexDirection: 'column',
  gap: 12
}

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
}

const nameStyle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 600,
  color: '#1a1a1a'
}

const statusStyle: React.CSSProperties = {
  fontSize: 12,
  padding: '2px 10px',
  borderRadius: 10,
  fontWeight: 500
}

const metaStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  fontSize: 13,
  color: '#888'
}

const codeStyle: React.CSSProperties = {
  fontFamily: 'monospace',
  background: '#f5f5f5',
  padding: '2px 8px',
  borderRadius: 4
}

const versionStyle: React.CSSProperties = {
  color: '#aaa'
}

const actionsStyle: React.CSSProperties = {
  display: 'flex',
  gap: 8,
  marginTop: 4
}

const btnStyle: React.CSSProperties = {
  flex: 1,
  padding: '8px 0',
  border: '1px solid #d9d9d9',
  borderRadius: 6,
  background: '#fff',
  cursor: 'pointer',
  fontSize: 14,
  fontWeight: 500
}

const btnPrimaryStyle: React.CSSProperties = {
  background: '#1677ff',
  color: '#fff',
  borderColor: '#1677ff'
}

const btnDangerStyle: React.CSSProperties = {
  color: '#ff4d4f',
  borderColor: '#ff4d4f'
}
