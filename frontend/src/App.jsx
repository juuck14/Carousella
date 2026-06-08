import { useRef, useState, useEffect, useCallback } from 'react'
import JSZip from 'jszip'
import InputPanel    from './components/InputPanel'
import PreviewPane   from './components/PreviewPane'
import SettingsPanel from './components/SettingsPanel'
import { useSettings }   from './hooks/useSettings'
import { usePagination } from './hooks/usePagination'
import { useDrafts }     from './hooks/useDrafts'
import { generateCarousel } from './lib/generate'
import styles from './App.module.css'

function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`
}

export default function App() {
  const { settings, update: updateSettings } = useSettings()
  const { drafts, saveDraft, deleteDraft }   = useDrafts()

  // 문서 상태 (InputPanel이 직접 업데이트)
  const [doc, setDocRaw] = useState({
    title: '', subtitle: '', label: '음악', date: todayStr(),
    imageFile: null, imageUrl: null, imageFilter: 'none', body: '',
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
      const urls = await generateCarousel(doc.title, doc.subtitle, doc.label, doc.imageFile, doc.body, { ...settings, imageFilter: doc.imageFilter })
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
      const urls = await generateCarousel(doc.title, doc.subtitle, doc.label, doc.imageFile, doc.body, { ...settings, imageFilter: doc.imageFilter })
      const zip  = new JSZip()

      // PNG 이미지
      urls.forEach((dataUrl, i) => {
        zip.file(`page_${String(i + 1).padStart(2, '0')}.png`, dataUrl.split(',')[1], { base64: true })
      })

      // 마크다운 파일
      const mdLines = []
      if (doc.title)    mdLines.push(`# ${doc.title}`)
      if (doc.subtitle) mdLines.push(`**${doc.subtitle}**`)
      if (mdLines.length && doc.body) mdLines.push('')
      if (doc.body)     mdLines.push(doc.body)
      zip.file('content.md', mdLines.join('\n'))

      // 첨부 표지 이미지
      if (doc.imageFile) {
        const ext     = doc.imageFile.name.split('.').pop() || 'jpg'
        const imgData = await doc.imageFile.arrayBuffer()
        zip.file(`cover.${ext}`, imgData)
      }

      const blob    = await zip.generateAsync({ type: 'blob' })
      const zipUrl  = URL.createObjectURL(blob)
      const a       = document.createElement('a')
      a.href        = zipUrl
      a.download    = 'carousel.zip'
      a.click()
      URL.revokeObjectURL(zipUrl)
      flash(`${urls.length}장 + 원고를 ZIP으로 내보냈습니다`)
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
          {/* Pagination dots mark */}
          <div className={styles.logoMark}>
            <span className={`${styles.dot} ${styles.dotGhost}`} />
            <span className={styles.dot} />
            <span className={`${styles.dot} ${styles.dotLead}`} />
            <span className={styles.dot} />
            <span className={`${styles.dot} ${styles.dotGhost}`} />
          </div>
          <div className={styles.brandText}>
            <span className={styles.brandName}>
              Carousell<span className={styles.brandAccent}>a</span>
            </span>
            <span className={styles.brandVersion}>v{__APP_VERSION__}</span>
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
          <a
            className={styles.githubLink}
            href="https://github.com/juuck14/instagram-carousel-generator"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub 저장소"
            title="GitHub 저장소"
          >
            <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38
                0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13
                -.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66
                .07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15
                -.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27
                .68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12
                .51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48
                0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z"/>
            </svg>
          </a>
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
            : <InputPanel
              doc={doc}
              setDoc={setDoc}
              settings={settings}
              onSettingsChange={updateSettings}
              drafts={drafts}
              onSaveDraft={() => {
                const result = saveDraft(doc, settings)
                if (!result.ok) flash('저장 공간이 부족합니다')
                else if (result.imageDropped) flash('임시저장 완료 (용량 초과로 이미지 제외)')
                else flash('임시저장 완료')
              }}
              onLoadDraft={(draft) => {
                setDoc({
                  title:     draft.doc.title,
                  subtitle:  draft.doc.subtitle,
                  label:     draft.doc.label,
                  imageUrl:    draft.doc.imageUrl,
                  imageFilter: draft.doc.imageFilter || 'none',
                  imageFile: null,
                  body:      draft.doc.body,
                })
                if (draft.settings) updateSettings(draft.settings)
                flash('불러왔습니다')
              }}
              onDeleteDraft={deleteDraft}
            />
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
              <span className={styles.spec}>1080 × {settings.canvasHeight || 1080}</span>
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
