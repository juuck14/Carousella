import { useState, useCallback } from 'react'
import InputPanel from './components/InputPanel'
import PreviewPanel from './components/PreviewPanel'
import SettingsPanel from './components/SettingsPanel'
import styles from './App.module.css'

// 설정 기본값 (backend/config.py DEFAULT_CFG와 동기화)
export const DEFAULT_SETTINGS = {
  body_font_size:    22,
  line_spacing:      2.05,
  para_spacing:      0.9,
  letter_spacing:    0,
  margin:            120,
  cover_split_ratio: 0.42,
  cover_title_size:  48,
}

function loadSettings() {
  try {
    const raw = localStorage.getItem('carousel_settings')
    if (!raw) return DEFAULT_SETTINGS
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_SETTINGS
  }
}

export default function App() {
  const [pages,    setPages]    = useState([])
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [settings, setSettings] = useState(loadSettings)
  const [sessionId, setSessionId] = useState('')
  const [showSettings, setShowSettings] = useState(false)

  const handleSettingsChange = useCallback((newSettings) => {
    setSettings(newSettings)
    localStorage.setItem('carousel_settings', JSON.stringify(newSettings))
  }, [])

  async function handleGenerate(formData) {
    // 설정값을 JSON으로 추가
    formData.append('settings', JSON.stringify(settings))

    setLoading(true)
    setError('')
    setPages([])
    setSessionId('')
    try {
      const res = await fetch('/api/generate', { method: 'POST', body: formData })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || `서버 오류 (${res.status})`)
      }
      const data = await res.json()
      setPages(data.pages)
      setSessionId(data.session_id)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <header className={styles.header}>
          <span className={styles.headerLabel}>— 캐러셀 생성기 —</span>
          <button
            className={styles.settingsToggle}
            onClick={() => setShowSettings(v => !v)}
            title="설정"
          >
            {showSettings ? '✕' : '⚙'}
          </button>
        </header>

        {showSettings
          ? <SettingsPanel settings={settings} onChange={handleSettingsChange} />
          : <InputPanel onGenerate={handleGenerate} loading={loading} />
        }
      </aside>

      <main className={styles.main}>
        <PreviewPanel
          pages={pages}
          loading={loading}
          error={error}
          sessionId={sessionId}
        />
      </main>
    </div>
  )
}
