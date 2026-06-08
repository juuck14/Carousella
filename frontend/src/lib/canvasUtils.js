/**
 * canvasUtils.js — Canvas 2D 저수준 유틸리티
 * 폰트 설정, 텍스트 너비 측정, 텍스트 그리기.
 */

export function setFont(ctx, size, weight = 400, family = 'Noto Serif KR') {
  ctx.font = `${weight} ${size}px "${family}"`
}

/**
 * 자간(letterSpacing)을 반영한 텍스트 너비 측정.
 * letterSpacing === 0이면 ctx.measureText() 직접 사용.
 */
export function measureWidth(ctx, text, letterSpacing = 0) {
  if (!text) return 0
  if (letterSpacing === 0) return ctx.measureText(text).width
  let w = 0
  for (const ch of text) {
    w += ctx.measureText(ch).width + letterSpacing
  }
  return Math.max(0, w - letterSpacing)
}

/**
 * 자간을 반영한 텍스트 한 줄 그리기.
 * letterSpacing === 0이면 ctx.fillText() 직접 사용.
 */
export function drawTextLine(ctx, x, y, text, letterSpacing = 0) {
  if (letterSpacing === 0) {
    ctx.fillText(text, x, y)
    return
  }
  let cx = x
  for (const ch of text) {
    ctx.fillText(ch, cx, y)
    cx += ctx.measureText(ch).width + letterSpacing
  }
}
