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
import { parseInline } from './inlineMarkdown'

/**
 * 인라인 마크다운을 파싱해 캔버스에 그리기.
 * bold → font-weight:700, italic → font-style:italic.
 * letterSpacing은 무시(ctx.letterSpacing은 Chromium만 지원).
 */
function drawInlineLine(ctx, x, y, text, fontSize) {
  const segs = parseInline(text)
  let cx = x
  for (const seg of segs) {
    const weight = seg.t === 'bold' ? 700 : 400
    const style  = seg.t === 'em'   ? 'italic ' : ''
    ctx.font = `${style}${weight} ${fontSize}px "Noto Serif KR"`
    ctx.fillText(seg.s, cx, y)
    cx += ctx.measureText(seg.s).width
  }
}

export function renderBody(ctx, pageEntries, pageNum, cfg) {
  const {
    margin, bodyFontSize, lineSpacing, paraSpacing, letterSpacing,
    bgColor, textColor, pageNumColor, ruleColor, pageNumSize, canvasSize,
  } = cfg
  const canvasH = cfg.canvasHeight || canvasSize

  const lineH    = bodyFontSize * lineSpacing
  const paraGapH = bodyFontSize * paraSpacing

  // ── 배경 ──────────────────────────────────────────────────
  ctx.fillStyle = bgColor
  ctx.fillRect(0, 0, canvasSize, canvasH)

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
      drawInlineLine(ctx, margin, y, text, bodyFontSize)
      y += lineH
    } else {
      y += paraGapH        // 단락 간격
    }
  }

  // ── 하단 구분선 ───────────────────────────────────────────
  const bottomRuleY = canvasH - (margin + 12)
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
  const pnY = canvasH - (margin - 34)
  ctx.fillText(label, (canvasSize - pnW) / 2, pnY)
  ctx.letterSpacing = '0px'
}
