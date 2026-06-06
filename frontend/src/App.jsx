import { useState } from 'react'
import InputPanel from './components/InputPanel'
import PreviewPanel from './components/PreviewPanel'
import styles from './App.module.css'

export default function App() {
  const [pages, setPages]     = useState([])   // URL 목록
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  async function handleGenerate(formData) {
    setLoading(true)
    setError('')
    setPages([])
    try {
      const res = await fetch('/api/generate', { method: 'POST', body: formData })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || `서버 오류 (${res.status})`)
      }
      const data = await res.json()
      setPages(data.pages)
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
        </header>
        <InputPanel onGenerate={handleGenerate} loading={loading} />
      </aside>

      <main className={styles.main}>
        <PreviewPanel pages={pages} loading={loading} error={error} />
      </main>
    </div>
  )
}
