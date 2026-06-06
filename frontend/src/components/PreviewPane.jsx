/**
 * PreviewPane.jsx — 캐러셀 미리보기 영역
 *
 * 구성:
 *   - 중앙 스테이지: 큰 캐러셀 미리보기 + 양쪽 화살표 버튼
 *   - 하단 내비: 도트 페이지 인디케이터 + 페이지 라벨
 *   - 썸네일 레일: 80px 페이지 썸네일
 *
 * 키보드 ← → 로도 이동 가능.
 */

import { useEffect, useRef, useState } from 'react'
import CarouselPage from './CarouselPage'
import styles from './PreviewPane.module.css'

const THUMB = 80

function Arrow({ dir, onClick, disabled }) {
  return (
    <button className={styles.arrow} onClick={onClick} disabled={disabled} aria-label={dir === 'left' ? '이전' : '다음'}>
      <svg width="16" height="16" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d={dir === 'left' ? 'M11 3L5 9l6 6' : 'M7 3l6 6-6 6'} />
      </svg>
    </button>
  )
}

export default function PreviewPane({ pages, idx, setIdx, doc, cfg }) {
  const [boxSize, setBoxSize] = useState(480)
  const stageRef  = useRef(null)
  const thumbsRef = useRef(null)

  // ResizeObserver로 스테이지 크기 계산
  useEffect(() => {
    const el = stageRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      const sz = Math.max(240, Math.min(width - 120, height - 40))
      setBoxSize(sz)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // 키보드 내비게이션
  useEffect(() => {
    const onKey = (e) => {
      if (document.activeElement && /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)) return
      if (e.key === 'ArrowLeft')  setIdx(i => Math.max(0, i - 1))
      if (e.key === 'ArrowRight') setIdx(i => Math.min(pages.length - 1, i + 1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [pages.length, setIdx])

  // 현재 썸네일을 레일 내에서 보이도록 스크롤
  useEffect(() => {
    const rail = thumbsRef.current
    if (!rail) return
    const thumbEl = rail.children[idx]
    if (thumbEl) thumbEl.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' })
  }, [idx])

  const page    = pages[idx]
  const pageNum = pages[idx]?.type === 'cover' ? '표지' : `— ${pages[idx]?.n} —`

  if (!pages.length) {
    return (
      <div className={styles.empty}>
        <p className={styles.emptyLabel}>— 미리보기 —</p>
        <p className={styles.emptyHint}>왼쪽에서 내용을 입력하세요</p>
      </div>
    )
  }

  return (
    <div className={styles.pane}>
      {/* 스테이지 + 화살표 */}
      <div className={styles.stage} ref={stageRef}>
        <Arrow dir="left"  onClick={() => setIdx(i => Math.max(0, i - 1))}              disabled={idx === 0} />
        <div className={styles.pageBox} style={{ width: boxSize, height: boxSize }}>
          {page && <CarouselPage page={page} size={boxSize} doc={doc} cfg={cfg} />}
        </div>
        <Arrow dir="right" onClick={() => setIdx(i => Math.min(pages.length - 1, i + 1))} disabled={idx >= pages.length - 1} />
      </div>

      {/* 도트 내비 */}
      <div className={styles.nav}>
        <span className={styles.navLabel}>{pageNum}</span>
        <div className={styles.dots}>
          {pages.map((_, i) => (
            <button
              key={i}
              className={styles.dot}
              data-active={i === idx}
              onClick={() => setIdx(i)}
              aria-label={`${i + 1}페이지`}
            />
          ))}
        </div>
        <span className={styles.navCount}>{idx + 1} / {pages.length}</span>
      </div>

      {/* 썸네일 레일 */}
      <div className={styles.rail} ref={thumbsRef}>
        {pages.map((p, i) => (
          <button
            key={i}
            className={styles.thumb}
            data-active={i === idx}
            onClick={() => setIdx(i)}
            title={p.type === 'cover' ? '표지' : `${p.n}쪽`}
          >
            <div className={styles.thumbImg}>
              <CarouselPage page={p} size={THUMB} doc={doc} cfg={cfg} />
            </div>
            <span className={styles.thumbNum}>
              {p.type === 'cover' ? '00' : String(p.n - 1).padStart(2, '0')}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
