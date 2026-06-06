/**
 * renderBody.js — 본문 페이지 렌더링 (무드 A: 활자)
 *
 * 레이아웃 (1080×1080 기준):
 *   상단 구분선  : top = margin - 24
 *   본문 텍스트  : top = margin + 24
 *   하단 구분선  : top = canvasSize - (margin + 12)
 *   페이지 번호  : bottom edge = canvasSize - (margin - 34)
 */

import { setFont, drawTextLine } from './canvasUtils'

export function renderBody(ctx, pageEntries, pageNum, cfg) {
  const {
    margin, bodyFontSize, lineSpacing, paraSpacing, letterSpacing,
    bgColor, textColor, pageNumColor, ruleColor, pageNumSize, canvasSize,
  } = cfg

  const lineH    = bodyFontSize * lineSpacing
  const paraGapH = bodyFontSize * paraSpacing

  // ── 배경 ──────────────────────────────────────────────────
  ctx.fillStyle = bgColor     // '#F4F3EF'
  ctx.fillRect(0, 0, canvasSize, canvasSize)

  // ── 상단 구분선 ───────────────────────────────────────────
  ctx.strokeStyle = ruleColor
  ctx.lineWidth   = 1
  ctx.beginPath()
  ctx.moveTo(margin,              margin - 24)
  ctx.lineTo(canvasSize - margin, margin - 24)
  ctx.stroke()

  // ── 본문 텍스트 ───────────────────────────────────────────
  setFont(ctx, bodyFontSize, 400)
  ctx.fillStyle    = textColor
  ctx.textBaseline = 'top'
  let y = margin + 24      // 상단 구분선 아래 여백

  for (const [text] of pageEntries) {
    if (text.trim()) {
      drawTextLine(ctx, margin, y, text, letterSpacing)
      y += lineH
    } else {
      y += paraGapH        // 단락 간격
    }
  }

  // ── 하단 구분선 ───────────────────────────────────────────
  const bottomRuleY = canvasSize - (margin + 12)
  ctx.strokeStyle = ruleColor
  ctx.lineWidth   = 1
  ctx.beginPath()
  ctx.moveTo(margin,              bottomRuleY)
  ctx.lineTo(canvasSize - margin, bottomRuleY)
  ctx.stroke()

  // ── 페이지 번호 "— N —" ───────────────────────────────────
  const label = `— ${pageNum} —`
  ctx.font = `400 ${pageNumSize}px "Noto Serif KR"`
  ctx.fillStyle    = pageNumColor
  ctx.textBaseline = 'bottom'
  ctx.letterSpacing = '0.2em'
  const pnW = ctx.measureText(label).width
  const pnY = canvasSize - (margin - 34)
  ctx.fillText(label, (canvasSize - pnW) / 2, pnY)
  ctx.letterSpacing = '0px'
}
