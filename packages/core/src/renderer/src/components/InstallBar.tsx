import { useState } from 'react'

interface InstallBarProps {
  onInstall: (name: string) => Promise<boolean>
}

export function InstallBar({ onInstall }: InstallBarProps): React.JSX.Element {
  const [value, setValue] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleInstall = async (): Promise<void> => {
    const name = value.trim()
    if (!name) return
    const ok = await onInstall(name)
    if (ok) {
      setMessage({ type: 'success', text: `插件 "${name}" 安装成功` })
      setValue('')
    } else {
      setMessage({ type: 'error', text: `未找到插件 "${name}"，请确认目录名正确` })
    }
    setTimeout(() => setMessage(null), 3000)
  }

  return (
    <div style={containerStyle}>
      <div style={barStyle}>
        <input
          style={inputStyle}
          placeholder="输入插件目录名..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleInstall()}
        />
        <button style={btnStyle} onClick={handleInstall}>
          安装
        </button>
      </div>
      {message && (
        <div style={{ ...msgStyle, color: message.type === 'success' ? '#52c41a' : '#ff4d4f' }}>
          {message.text}
        </div>
      )}
      <div style={hintStyle}>
        提示：将插件构建产物放至 plugin-dev-output/ 目录下，输入目录名即可安装
      </div>
    </div>
  )
}

const containerStyle: React.CSSProperties = {
  marginTop: 8
}

const barStyle: React.CSSProperties = {
  display: 'flex',
  gap: 8
}

const inputStyle: React.CSSProperties = {
  flex: 1,
  padding: '10px 14px',
  border: '1px solid #d9d9d9',
  borderRadius: 6,
  fontSize: 14,
  outline: 'none'
}

const btnStyle: React.CSSProperties = {
  padding: '10px 24px',
  background: '#1677ff',
  color: '#fff',
  border: 'none',
  borderRadius: 6,
  cursor: 'pointer',
  fontSize: 14,
  fontWeight: 500
}

const msgStyle: React.CSSProperties = {
  marginTop: 8,
  fontSize: 13
}

const hintStyle: React.CSSProperties = {
  marginTop: 6,
  fontSize: 12,
  color: '#bbb'
}
