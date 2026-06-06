import { useRef, useState, useEffect, useCallback } from 'react'
import JSZip from 'jszip'
import InputPanel    from './components/InputPanel'
import PreviewPane   from './components/PreviewPane'
import SettingsPanel from './components/SettingsPanel'
import { useSettings }   from './hooks/useSettings'
import { usePagination } from './hooks/usePagination'
import { generateCarousel } from './lib/generate'
import styles from './App.module.css'

function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`
}

export default function App() {
  const { settings, update: updateSettings } = useSettings()

  // 문서 상태 (InputPanel이 직접 업데이트)
  const [doc, setDocRaw] = useState({
    title: '', subtitle: '', label: '평론', date: todayStr(),
    imageFile: null, imageUrl: null, body: '',
  })
  const setDoc = (patch) => setDocRaw(d => ({ ...d, ...patch }))

  // 탭 / 미리보기 인덱스
  const [tab,        setTab]        = useState('write')
  const [previewIdx, setPreviewIdx] = useState(0)

  // 내보내기 상태 + 토스트
  const [busy,  setBusy]  = useState(false)
  const [toast, setToast] = useState('')
  const flash = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2400) }

  // 사이드바 리사이즈
  const [sidebarWidth, setSidebarWidth] = useState(460)
  const dragRef = useRef({ active: false, startX: 0, startW: 0 })

  const onResizeMove = useCallback((e) => {
    if (!dragRef.current.active) return
    const dx = e.clientX - dragRef.current.startX
    setSidebarWidth(Math.max(300, Math.min(720, dragRef.current.startW + dx)))
  }, [])

  const onResizeEnd = useCallback(() => {
    dragRef.current.active = false
    document.removeEventListener('mousemove', onResizeMove)
    document.removeEventListener('mouseup', onResizeEnd)
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }, [onResizeMove])

  function onResizeStart(e) {
    dragRef.current = { active: true, startX: e.clientX, startW: sidebarWidth }
    document.addEventListener('mousemove', onResizeMove)
    document.addEventListener('mouseup', onResizeEnd)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    e.preventDefault()
  }

  // 숨겨진 측정용 div ref
  const measureRef = useRef(null)

  // 실시간 DOM 기반 페이지 분할
  const pages   = usePagination(doc.body, settings, measureRef)
  const safeIdx = Math.min(previewIdx, Math.max(0, pages.length - 1))

  // 문서 데이터 (date 항상 최신)
  const docForRender = { ...doc, date: todayStr() }

  // ── 내보내기 ──────────────────────────────────────────
  async function exportSingle() {
    if (busy || !pages.length) return
    setBusy(true)
    try {
      const urls = await generateCarousel(doc.title, doc.subtitle, doc.imageFile, doc.body, settings)
      const url  = urls[safeIdx] ?? urls[0]
      if (!url) throw new Error('생성 실패')
      const a = document.createElement('a')
      a.href = url
      a.download = `page_${String(safeIdx + 1).padStart(2, '0')}.png`
      a.click()
      flash('현재 페이지를 PNG로 저장했습니다')
    } catch {
      flash('내보내기에 실패했습니다')
    }
    setBusy(false)
  }

  async function exportAll() {
    if (busy || !pages.length) return
    setBusy(true)
    try {
      const urls = await generateCarousel(doc.title, doc.subtitle, doc.imageFile, doc.body, settings)
      const zip  = new JSZip()
      urls.forEach((dataUrl, i) => {
        zip.file(`page_${String(i + 1).padStart(2, '0')}.png`, dataUrl.split(',')[1], { base64: true })
      })
      const blob    = await zip.generateAsync({ type: 'blob' })
      const zipUrl  = URL.createObjectURL(blob)
      const a       = document.createElement('a')
      a.href        = zipUrl
      a.download    = 'carousel.zip'
      a.click()
      URL.revokeObjectURL(zipUrl)
      flash(`${urls.length}장을 ZIP으로 내보냈습니다`)
    } catch {
      flash('내보내기에 실패했습니다')
    }
    setBusy(false)
  }

  return (
    <div className={styles.layout}>
      {/* 숨겨진 DOM 텍스트 측정 div */}
      <div
        ref={measureRef}
        aria-hidden="true"
        style={{
          position: 'fixed', left: -99999, top: 0,
          visibility: 'hidden', pointerEvents: 'none',
          boxSizing: 'content-box', padding: 0, margin: 0,
        }}
      />

      {/* ── 헤더 ─────────────────────────────── */}
      <header className={styles.header}>
        <div className={styles.brand}>
          <div className={styles.logo}>평</div>
          <div className={styles.brandText}>
            <span className={styles.brandName}>평론 캐러셀</span>
            <span className={styles.brandSub}>CRITIQUE&nbsp;CAROUSEL</span>
          </div>
        </div>

        <nav className={styles.tabs}>
          {[['write', '작성'], ['preview', '미리보기'], ['settings', '설정']].map(([k, label]) => (
            <button
              key={k}
              className={`${styles.tabBtn} ${k === 'preview' ? styles.mobileOnly : ''}`}
              data-active={tab === k}
              onClick={() => setTab(k)}
            >
              {label}
            </button>
          ))}
        </nav>
      </header>

      {/* ── 바디 ─────────────────────────────── */}
      <div className={styles.body}>
        {/* 사이드바 */}
        <aside
          className={`${styles.sidebar} ${tab === 'preview' ? styles.mobileHidden : ''}`}
          style={{ width: `${sidebarWidth}px` }}
        >
          {tab === 'settings'
            ? <SettingsPanel settings={settings} onChange={updateSettings} />
            : <InputPanel    doc={doc} setDoc={setDoc} settings={settings} onSettingsChange={updateSettings} />
          }
        </aside>

        {/* 리사이즈 핸들 */}
        <div
          className={`${styles.resizeHandle} ${tab === 'preview' ? styles.mobileHidden : ''}`}
          onMouseDown={onResizeStart}
        />

        {/* 메인 */}
        <main className={`${styles.main} ${tab !== 'preview' ? styles.mobileMainHidden : ''}`}>
          {/* 내보내기 툴바 */}
          <div className={styles.toolbar}>
            <div className={styles.toolbarInfo}>
              <span className={styles.pageTotal}>{pages.length}장</span>
              <div className={styles.toolDivider} />
              <span className={styles.spec}>1080 × 1080</span>
            </div>
            <div className={styles.toolBtns}>
              <button
                className={styles.btnOutline}
                onClick={exportSingle}
                disabled={busy || !pages.length}
              >
                이 페이지 PNG
              </button>
              <button
                className={styles.btnFill}
                onClick={exportAll}
                disabled={busy || !pages.length}
              >
                {busy ? '내보내는 중…' : '전체 내보내기'}
              </button>
            </div>
          </div>

          {/* 미리보기 패널 */}
          <PreviewPane
            pages={pages}
            idx={safeIdx}
            setIdx={setPreviewIdx}
            doc={docForRender}
            cfg={settings}
          />
        </main>
      </div>

      {/* ── 토스트 ───────────────────────────── */}
      {toast && (
        <div className={styles.toast}>{toast}</div>
      )}
    </div>
  )
}
