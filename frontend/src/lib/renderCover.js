/**
 * renderCover.js — 표지 페이지 렌더링
 */

import { setFont, measureWidth } from './canvasUtils'
import { wrapParagraph } from './parseText'

/** File → HTMLImageElement (cover-fit용) */
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

/** cover-fit: 이미지를 target 영역에 꽉 채워 그리기 (잘림 허용) */
function drawCoverFit(ctx, img, destX, destY, targetW, targetH) {
  const scale = Math.max(targetW / img.width, targetH / img.height)
  const sw    = img.width  * scale
  const sh    = img.height * scale
  const sx    = (sw - targetW) / 2
  const sy    = (sh - targetH) / 2
  ctx.drawImage(img, destX - sx, destY - sy, sw, sh)
}

/**
 * 표지 이미지 캔버스 렌더링.
 * 레이아웃: 상단 텍스트 영역(coverSplitRatio) + 하단 커버 이미지 영역
 */
export function renderCover(ctx, title, subtitle, coverImg, cfg) {
  const {
    margin, coverSplitRatio, coverTitleSize, coverLabelSize,
    coverBgColor, coverTextColor, coverLabelColor, canvasSize,
  } = cfg

  const splitY   = Math.round(canvasSize * coverSplitRatio)
  const imgAreaH = canvasSize - splitY

  // 전체 배경
  ctx.fillStyle = coverBgColor
  ctx.fillRect(0, 0, canvasSize, canvasSize)

  // 하단 이미지 (cover-fit + 약한 블러)
  if (coverImg) {
    ctx.save()
    ctx.beginPath()
    ctx.rect(0, splitY, canvasSize, imgAreaH)
    ctx.clip()
    ctx.filter = 'blur(1px)'
    drawCoverFit(ctx, coverImg, 0, splitY, canvasSize, imgAreaH)
    ctx.restore()
  } else {
    ctx.fillStyle = '#1A1A1A'
    ctx.fillRect(0, splitY, canvasSize, imgAreaH)
  }

  // 텍스트/이미지 분리선
  ctx.strokeStyle = '#333330'
  ctx.lineWidth   = 1
  ctx.beginPath()
  ctx.moveTo(0,         splitY)
  ctx.lineTo(canvasSize, splitY)
  ctx.stroke()

  // 레이블 "— 평론 —"
  const label = '— 평론 —'
  setFont(ctx, coverLabelSize, 400)
  ctx.fillStyle    = coverLabelColor
  ctx.textBaseline = 'top'
  ctx.fillText(label, margin, margin)

  const labelH = coverLabelSize * 1.2
  const ruleY  = margin + labelH + 16

  // 레이블 아래 구분선
  ctx.strokeStyle = '#3A3A38'
  ctx.lineWidth   = 1
  ctx.beginPath()
  ctx.moveTo(margin,             ruleY)
  ctx.lineTo(canvasSize - margin, ruleY)
  ctx.stroke()

  // 제목 (bold) + 부제목 줄바꿈 계산
  const tw = canvasSize - margin * 2

  setFont(ctx, coverTitleSize, 700)
  const titleLines  = wrapParagraph(ctx, title, tw, 0)
  const titleLineH  = Math.round(coverTitleSize * 1.28)
  const titleBlockH = titleLines.length * titleLineH

  setFont(ctx, coverLabelSize, 400)
  const subLines  = subtitle ? wrapParagraph(ctx, subtitle, tw, 0) : []
  const subLineH  = Math.round(coverLabelSize * 1.5)
  const subBlockH = subLines.length ? subLines.length * subLineH + coverLabelSize : 0

  // 텍스트 블록을 텍스트 영역(ruleY ~ splitY) 중앙에 배치
  let ty = Math.round((ruleY + splitY) / 2 - (titleBlockH + subBlockH) / 2)

  setFont(ctx, coverTitleSize, 700)
  ctx.fillStyle    = coverTextColor
  ctx.textBaseline = 'top'
  for (const line of titleLines) {
    ctx.fillText(line, margin, ty)
    ty += titleLineH
  }

  if (subLines.length) {
    ty += coverLabelSize
    setFont(ctx, coverLabelSize, 400)
    ctx.fillStyle = coverLabelColor
    for (const line of subLines) {
      ctx.fillText(line, margin, ty)
      ty += subLineH
    }
  }

  // 날짜 — 텍스트 영역 우하단
  const d       = new Date()
  const dateStr = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
  setFont(ctx, coverLabelSize, 400)
  ctx.fillStyle    = coverLabelColor
  ctx.textBaseline = 'middle'
  const dateW = ctx.measureText(dateStr).width
  ctx.fillText(dateStr, canvasSize - margin - dateW, splitY - margin / 2)
}
