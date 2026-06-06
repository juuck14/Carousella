/**
 * renderCover.js — 표지 페이지 렌더링 (무드 A: 활자)
 *
 * 레이아웃:
 *   - 상단 텍스트 영역(coverSplitRatio): 레이블·날짜·수평선·제목·부제목
 *   - 하단 이미지 영역: cover-fit 이미지 또는 어두운 플레이스홀더
 */

import { setFont, measureWidth } from './canvasUtils'
import { wrapParagraph } from './parseText'

/** File → HTMLImageElement */
export async function loadCoverImage(file) {
  if (!file) return null
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload  = () => { URL.revokeObjectURL(url); resolve(img) }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('이미지 로드 실패')) }
    img.src = url
  })
}

/** cover-fit: 이미지를 target 영역에 꽉 채워 그리기 */
function drawCoverFit(ctx, img, destX, destY, targetW, targetH) {
  const scale = Math.max(targetW / img.width, targetH / img.height)
  const sw    = img.width  * scale
  const sh    = img.height * scale
  const sx    = (sw - targetW) / 2
  const sy    = (sh - targetH) / 2
  ctx.drawImage(img, destX - sx, destY - sy, sw, sh)
}

/** 표지 캔버스 렌더링 */
export function renderCover(ctx, title, subtitle, label, coverImg, cfg) {
  const {
    margin, coverSplitRatio, coverTitleSize, coverLabelSize,
    coverBgColor, coverTextColor, coverLabelColor, canvasSize,
  } = cfg

  const splitY   = Math.round(canvasSize * coverSplitRatio)
  const imgAreaH = canvasSize - splitY

  // ── 배경 ──────────────────────────────────────────────────
  ctx.fillStyle = coverBgColor          // '#141210'
  ctx.fillRect(0, 0, canvasSize, canvasSize)

  // ── 하단 이미지 ───────────────────────────────────────────
  if (coverImg) {
    ctx.save()
    ctx.beginPath()
    ctx.rect(0, splitY, canvasSize, imgAreaH)
    ctx.clip()
    drawCoverFit(ctx, coverImg, 0, splitY, canvasSize, imgAreaH)
    ctx.restore()
  } else {
    ctx.fillStyle = '#1A1A1A'
    ctx.fillRect(0, splitY, canvasSize, imgAreaH)
  }

  // ── 분리선 ────────────────────────────────────────────────
  ctx.strokeStyle = '#34322D'
  ctx.lineWidth   = 1
  ctx.beginPath()
  ctx.moveTo(0,          splitY)
  ctx.lineTo(canvasSize, splitY)
  ctx.stroke()

  // ── 레이블 좌상단 "— 평론 —" ──────────────────────────────
  ctx.font         = `400 ${coverLabelSize}px "Noto Serif KR"`
  ctx.fillStyle    = coverLabelColor
  ctx.textBaseline = 'top'
  ctx.letterSpacing = '0.34em'
  ctx.fillText(`— ${label || '평론'} —`, margin, margin - 2)
  ctx.letterSpacing = '0px'

  // ── 날짜 우상단 ───────────────────────────────────────────
  const d       = new Date()
  const dateStr = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
  ctx.font         = `400 ${coverLabelSize}px "Courier New", monospace`
  ctx.letterSpacing = '0.12em'
  const dateW   = ctx.measureText(dateStr).width
  ctx.fillText(dateStr, canvasSize - margin - dateW, margin + 2)
  ctx.letterSpacing = '0px'

  // ── 수평선 (레이블 아래) ──────────────────────────────────
  const ruleY = margin + 56
  ctx.strokeStyle = '#3a3a38'
  ctx.lineWidth   = 1
  ctx.beginPath()
  ctx.moveTo(margin,              ruleY)
  ctx.lineTo(canvasSize - margin, ruleY)
  ctx.stroke()

  // ── 제목 + 부제목 — 이미지 위쪽 바닥에 정렬 ──────────────
  const tw = canvasSize - margin * 2

  ctx.font = `700 ${coverTitleSize}px "Nanum Myeongjo", "Noto Serif KR", serif`
  const titleLines  = wrapParagraph(ctx, title || '제목을 입력하세요', tw, 0)
  const titleLineH  = Math.round(coverTitleSize * 1.22)
  const titleBlockH = titleLines.length * titleLineH

  const subFontSize = 25
  ctx.font = `400 ${subFontSize}px "Noto Serif KR"`
  const subLines  = subtitle ? wrapParagraph(ctx, subtitle, tw, 0) : []
  const subLineH  = Math.round(subFontSize * 1.5)
  const subGap    = 24
  const subBlockH = subLines.length ? subLines.length * subLineH + subGap : 0

  // 블록 하단을 splitY - 60에 맞춤
  const blockBottom = splitY - 60
  let ty = blockBottom - titleBlockH - subBlockH

  // 제목 (Nanum Myeongjo)
  ctx.font         = `700 ${coverTitleSize}px "Nanum Myeongjo", "Noto Serif KR", serif`
  ctx.fillStyle    = coverTextColor   // '#F4F3EF'
  ctx.textBaseline = 'top'
  ctx.letterSpacing = '-0.01em'
  for (const line of titleLines) {
    ctx.fillText(line, margin, ty)
    ty += titleLineH
  }
  ctx.letterSpacing = '0px'

  // 부제목
  if (subLines.length) {
    ty += subGap
    ctx.font      = `400 ${subFontSize}px "Noto Serif KR"`
    ctx.fillStyle = coverLabelColor
    ctx.letterSpacing = '0.02em'
    for (const line of subLines) {
      ctx.fillText(line, margin, ty)
      ty += subLineH
    }
    ctx.letterSpacing = '0px'
  }
}
