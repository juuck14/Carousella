import { useState, useCallback } from 'react'
import InputPanel from './components/InputPanel'
import PreviewPanel from './components/PreviewPanel'
import SettingsPanel from './components/SettingsPanel'
import { generateCarousel } from './lib/generate'
import { DEFAULT_CONFIG } from './lib/defaultConfig'
import styles from './App.module.css'

export { DEFAULT_CONFIG }   // SettingsPanel에서 재사용

function loadSettings() {
  try {
    const raw = localStorage.getItem('carousel_settings')
    if (!raw) return DEFAULT_CONFIG
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_CONFIG
  }
}

export default function App() {
  const [pages,        setPages]        = useState([])   // data URL 배열
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState('')
  const [settings,     setSettings]     = useState(loadSettings)
  const [showSettings, setShowSettings] = useState(false)

  const handleSettingsChange = useCallback((next) => {
    setSettings(next)
    localStorage.setItem('carousel_settings', JSON.stringify(next))
  }, [])

  async function handleGenerate({ title, subtitle, body, imageFile }) {
    setLoading(true)
    setError('')
    setPages([])
    try {
      const urls = await generateCarousel(title, subtitle, imageFile, body, settings)
      setPages(urls)
    } catch (e) {
      setError(e.message || '이미지 생성 중 오류가 발생했습니다.')
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
        <PreviewPanel pages={pages} loading={loading} error={error} />
      </main>
    </div>
  )
}
