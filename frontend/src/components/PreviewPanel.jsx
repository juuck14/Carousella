import { useState } from 'react'
import Lightbox from 'yet-another-react-lightbox'
import 'yet-another-react-lightbox/styles.css'
import styles from './PreviewPanel.module.css'

export default function PreviewPanel({ pages, loading, error, sessionId }) {
  const [lightboxOpen,  setLightboxOpen]  = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [downloading,   setDownloading]   = useState(false)

  function openLightbox(index) {
    setLightboxIndex(index)
    setLightboxOpen(true)
  }

  async function handleDownloadAll() {
    if (!sessionId || downloading) return
    setDownloading(true)
    try {
      const res = await fetch(`/api/download/${sessionId}`)
      if (!res.ok) throw new Error('다운로드 실패')
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = 'carousel.zip'
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      alert(e.message)
    } finally {
      setDownloading(false)
    }
  }

  // 로딩
  if (loading) {
    return (
      <div className={styles.center}>
        <div className={styles.spinner} />
        <p className={styles.statusText}>이미지 생성 중...</p>
      </div>
    )
  }

  // 에러
  if (error) {
    return (
      <div className={styles.center}>
        <p className={styles.errorText}>{error}</p>
      </div>
    )
  }

  // 빈 상태
  if (!pages.length) {
    return (
      <div className={styles.center}>
        <p className={styles.emptyText}>— 미리보기 —</p>
        <p className={styles.emptyHint}>왼쪽에서 내용을 입력하고 미리보기를 생성하세요</p>
      </div>
    )
  }

  const slides = pages.map(src => ({ src }))

  return (
    <div className={styles.wrapper}>
      {/* 툴바 */}
      <div className={styles.toolbar}>
        <span className={styles.count}>{pages.length}장</span>
        <button
          className={styles.downloadAllBtn}
          onClick={handleDownloadAll}
          disabled={downloading}
        >
          {downloading ? '준비 중...' : '전체 다운로드 ZIP'}
        </button>
      </div>

      {/* 이미지 그리드 */}
      <div className={styles.grid}>
        {pages.map((src, i) => (
          <div key={src} className={styles.card} onClick={() => openLightbox(i)}>
            <img src={src} alt={`page ${i + 1}`} className={styles.thumb} loading="lazy" />
            <div className={styles.cardFooter}>
              <span className={styles.pageLabel}>— {i + 1} —</span>
              <a
                href={src}
                download={`page_${String(i + 1).padStart(2, '0')}.png`}
                className={styles.dlBtn}
                onClick={e => e.stopPropagation()}
              >
                저장
              </a>
            </div>
          </div>
        ))}
      </div>

      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        index={lightboxIndex}
        slides={slides}
      />
    </div>
  )
}
