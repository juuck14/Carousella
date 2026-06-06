/**
 * CarouselPage.jsx — React 기반 캐러셀 페이지 렌더러 (무드 A: 활자)
 *
 * 1080×1080 기준으로 작성하고 size/1080 비율로 scale하여
 * 썸네일(80px)부터 대형 미리보기까지 동일 컴포넌트를 재사용한다.
 *
 * Props:
 *   page  — { type:'cover' } | { type:'body', n:number, paras:string[] }
 *   size  — 렌더 크기 (px). 기본 540
 *   doc   — { title, subtitle, imageUrl, label, date }
 *   cfg   — DEFAULT_CONFIG 기반 설정
 */

const SERIF   = "'Noto Serif KR', serif"
const DISPLAY = "'Nanum Myeongjo', 'Noto Serif KR', serif"
const MONO    = "'Courier New', ui-monospace, monospace"

const C = {
  ivory:    '#F4F3EF',
  ink:      '#1C1C1C',
  muted:    '#8A857C',
  line:     '#DBD7CF',
  lineDk:   '#34322D',
  dark:     '#141210',
  darkMute: '#8C857A',
  ruleDk:   '#3a3a38',
}

// ─── 이미지 플레이스홀더 ─────────────────────────────────────────
function Stripe() {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: 'repeating-linear-gradient(135deg, #1d1b18 0 26px, #191713 26px 52px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <span style={{ fontFamily: MONO, fontSize: 26, letterSpacing: '.16em', color: 'rgba(236,232,224,.4)', textTransform: 'uppercase' }}>
        cover
      </span>
    </div>
  )
}

// ─── 단락 블록 ────────────────────────────────────────────────────
function Paras({ paras, gap, fontSize, lineHeight }) {
  return (
    <>
      {paras.map((p, i) => (
        <p key={i} style={{
          margin: 0,
          marginTop: i ? gap : 0,
          fontFamily: SERIF,
          fontSize,
          lineHeight,
          color: C.ink,
          textAlign: 'justify',
          wordBreak: 'keep-all',
        }}>
          {p}
        </p>
      ))}
    </>
  )
}

// ─── 표지 (무드 A) ────────────────────────────────────────────────
function CoverA({ doc, cfg }) {
  const m     = cfg.margin
  const split = Math.round(1080 * cfg.coverSplitRatio)

  return (
    <div style={{ position: 'absolute', inset: 0, background: C.dark }}>
      {/* 하단 이미지 */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: split, bottom: 0, overflow: 'hidden' }}>
        {doc.imageUrl
          ? <img src={doc.imageUrl} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          : <Stripe />
        }
      </div>

      {/* 분리선 */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: split, height: 1, background: C.lineDk }} />

      {/* 레이블 좌상단 */}
      <div style={{ position: 'absolute', left: m, top: m - 2, fontFamily: SERIF, fontSize: 23, letterSpacing: '.34em', color: C.darkMute }}>
        — {doc.label || '평론'} —
      </div>

      {/* 날짜 우상단 */}
      <div style={{ position: 'absolute', right: m, top: m + 2, fontFamily: MONO, fontSize: 21, letterSpacing: '.12em', color: C.darkMute }}>
        {doc.date}
      </div>

      {/* 수평선 */}
      <div style={{ position: 'absolute', left: m, right: m, top: m + 56, height: 1, background: C.ruleDk }} />

      {/* 제목 + 부제목 — 이미지 영역 위쪽 */}
      <div style={{ position: 'absolute', left: m, right: m, bottom: (1080 - split) + 60 }}>
        <div style={{
          fontFamily: DISPLAY, fontSize: cfg.coverTitleSize, lineHeight: 1.22,
          color: C.ivory, whiteSpace: 'pre-line', letterSpacing: '-.01em', wordBreak: 'keep-all',
        }}>
          {doc.title || '제목을 입력하세요'}
        </div>
        {doc.subtitle && (
          <div style={{ fontFamily: SERIF, fontSize: 25, color: C.darkMute, marginTop: 24, letterSpacing: '.02em' }}>
            {doc.subtitle}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── 본문 페이지 (무드 A) ─────────────────────────────────────────
function BodyA({ page, cfg }) {
  const m   = cfg.margin
  const gap = cfg.bodyFontSize * cfg.paraSpacing

  return (
    <div style={{ position: 'absolute', inset: 0, background: C.ivory }}>
      {/* 상단 구분선 */}
      <div style={{ position: 'absolute', left: m, right: m, top: m - 24, height: 1, background: C.line }} />

      {/* 본문 텍스트 */}
      <div style={{ position: 'absolute', left: m, right: m, top: m + 24 }}>
        <Paras paras={page.paras} gap={gap} fontSize={cfg.bodyFontSize} lineHeight={cfg.lineSpacing} />
      </div>

      {/* 하단 구분선 */}
      <div style={{ position: 'absolute', left: m, right: m, bottom: m + 12, height: 1, background: C.line }} />

      {/* 페이지 번호 */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: m - 34,
        textAlign: 'center', fontFamily: SERIF, fontSize: 24,
        letterSpacing: '.2em', color: C.muted,
      }}>
        — {page.n} —
      </div>
    </div>
  )
}

// ─── 진입점 ──────────────────────────────────────────────────────
export default function CarouselPage({ page, size = 540, doc, cfg }) {
  const scale = size / 1080

  if (!page) {
    return <div style={{ width: size, height: size, background: '#E8E5DE', borderRadius: 2 }} />
  }

  return (
    <div style={{ width: size, height: size, position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
      <div style={{
        position: 'absolute', top: 0, left: 0,
        width: 1080, height: 1080,
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
      }}>
        {page.type === 'cover'
          ? <CoverA doc={doc} cfg={cfg} />
          : <BodyA  page={page} cfg={cfg} />
        }
      </div>
    </div>
  )
}
