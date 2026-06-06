import { useState } from 'react'
import InputPanel    from './components/InputPanel'
import PreviewPanel  from './components/PreviewPanel'
import SettingsPanel from './components/SettingsPanel'
import { useCarousel } from './hooks/useCarousel'
import { useSettings } from './hooks/useSettings'
import styles from './App.module.css'

export default function App() {
  const { settings, update: updateSettings } = useSettings()
  const { pages, loading, error, generate }  = useCarousel(settings)
  const [showSettings, setShowSettings]      = useState(false)

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
          ? <SettingsPanel settings={settings} onChange={updateSettings} />
          : <InputPanel onGenerate={generate} loading={loading} />
        }
      </aside>

      <main className={styles.main}>
        <PreviewPanel pages={pages} loading={loading} error={error} />
      </main>
    </div>
  )
}
