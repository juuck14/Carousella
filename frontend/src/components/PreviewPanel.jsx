import { useState } from 'react'
import JSZip from 'jszip'
import Lightbox from 'yet-another-react-lightbox'
import 'yet-another-react-lightbox/styles.css'
import styles from './PreviewPanel.module.css'

export default function PreviewPanel({ pages, loading, error }) {
  const [lightboxOpen,  setLightboxOpen]  = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [zipping,       setZipping]       = useState(false)

  function openLightbox(index) {
    setLightboxIndex(index)
    setLightboxOpen(true)
  }

  async function handleDownloadAll() {
    if (!pages.length || zipping) return
    setZipping(true)
    try {
      const zip = new JSZip()
      pages.forEach((dataUrl, i) => {
        const name   = `page_${String(i + 1).padStart(2, '0')}.png`
        const base64 = dataUrl.split(',')[1]
        zip.file(name, base64, { base64: true })
      })
      const blob = await zip.generateAsync({ type: 'blob' })
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = 'carousel.zip'
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setZipping(false)
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
      <div className={styles.toolbar}>
        <span className={styles.count}>{pages.length}장</span>
        <button
          className={styles.downloadAllBtn}
          onClick={handleDownloadAll}
          disabled={zipping}
        >
          {zipping ? '준비 중...' : '전체 다운로드 ZIP'}
        </button>
      </div>

      <div className={styles.grid}>
        {pages.map((src, i) => (
          <div key={i} className={styles.card} onClick={() => openLightbox(i)}>
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
