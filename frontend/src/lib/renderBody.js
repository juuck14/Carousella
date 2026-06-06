/**
 * renderBody.js — 본문 페이지 렌더링
 */

import { setFont, drawTextLine } from './canvasUtils'

/**
 * 본문 페이지 캔버스 렌더링.
 * pageEntries: [[text, isFirstLine], ...] — layout.js splitIntoPages() 출력값
 */
export function renderBody(ctx, pageEntries, pageNum, cfg) {
  const {
    margin, bodyFontSize, lineSpacing, paraSpacing, letterSpacing,
    bgColor, textColor, pageNumColor, ruleColor, pageNumSize, canvasSize,
  } = cfg

  const lineH    = bodyFontSize * lineSpacing
  const paraGapH = bodyFontSize * paraSpacing

  // 배경
  ctx.fillStyle = bgColor
  ctx.fillRect(0, 0, canvasSize, canvasSize)

  // 상단 구분선
  ctx.strokeStyle = ruleColor
  ctx.lineWidth   = 1
  ctx.beginPath()
  ctx.moveTo(margin,             margin - 28)
  ctx.lineTo(canvasSize - margin, margin - 28)
  ctx.stroke()

  // 본문 텍스트
  setFont(ctx, bodyFontSize, 400)
  ctx.fillStyle    = textColor
  ctx.textBaseline = 'top'
  let y = margin

  for (const [text] of pageEntries) {
    if (text.trim()) {
      drawTextLine(ctx, margin, y, text, letterSpacing)
      y += lineH
    } else {
      y += paraGapH   // 단락 간격 마커
    }
  }

  // 하단 구분선 + 페이지 번호
  const label = `— ${pageNum} —`
  setFont(ctx, pageNumSize, 400)
  ctx.fillStyle    = pageNumColor
  ctx.textBaseline = 'top'
  const pnW = ctx.measureText(label).width
  const pnY = canvasSize - margin + 8

  ctx.strokeStyle = ruleColor
  ctx.lineWidth   = 1
  ctx.beginPath()
  ctx.moveTo(margin,             pnY - 14)
  ctx.lineTo(canvasSize - margin, pnY - 14)
  ctx.stroke()

  ctx.fillText(label, (canvasSize - pnW) / 2, pnY)
}
