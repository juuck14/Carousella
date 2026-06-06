/**
 * layout.js — 단락 배열을 페이지 단위로 분할
 * Python split_paragraphs_into_pages()와 동일한 알고리즘.
 */

import { setFont } from './canvasUtils'
import { PAGE_BREAK, wrapParagraph } from './parseText'

/**
 * 단락 배열 → 페이지별 [text, isFirstLine][] 배열 리스트.
 *
 * 규칙:
 * - 단락은 페이지 중간에 잘리지 않는다 (단락 단위 배치)
 * - PAGE_BREAK('---') 는 강제로 새 페이지를 시작한다
 * - 단락 자체가 한 페이지를 초과할 때만 줄 단위 강제 분할
 *
 * @param {string[]} paragraphs
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} cfg
 * @param {number} availableHeight — 텍스트가 들어갈 수 있는 최대 높이(px)
 * @returns {Array<Array<[string, boolean]>>}
 */
export function splitIntoPages(paragraphs, ctx, cfg, availableHeight) {
  const { bodyFontSize, lineSpacing, paraSpacing, letterSpacing, canvasSize, margin } = cfg
  const lineH    = bodyFontSize * lineSpacing
  const paraGapH = bodyFontSize * paraSpacing
  const maxWidth = canvasSize - margin * 2
  const ls       = letterSpacing

  setFont(ctx, bodyFontSize, 400)

  const pages       = []
  let currentPage   = []
  let currentHeight = 0

  for (const para of paragraphs) {
    // 강제 페이지 분리
    if (para.trim() === PAGE_BREAK) {
      if (currentPage.length) {
        pages.push(currentPage)
        currentPage   = []
        currentHeight = 0
      }
      continue
    }

    const lines = wrapParagraph(ctx, para, maxWidth, ls)
    if (!lines.length) continue

    const gap   = currentPage.length ? paraGapH : 0
    const paraH = lines.length * lineH + gap

    // 현재 페이지에 안 들어가면 → 새 페이지 시작
    if (currentPage.length && currentHeight + paraH > availableHeight) {
      pages.push(currentPage)
      currentPage   = []
      currentHeight = 0
    }

    // 단락 자체가 한 페이지 초과 → 줄 단위 강제 분할
    const curGap   = currentPage.length ? paraGapH : 0
    const curParaH = lines.length * lineH + curGap
    if (!currentPage.length && curParaH > availableHeight) {
      for (let i = 0; i < lines.length; i++) {
        if (currentHeight + lineH > availableHeight && currentPage.length) {
          pages.push(currentPage)
          currentPage   = []
          currentHeight = 0
        }
        currentPage.push([lines[i], i === 0])
        currentHeight += lineH
      }
      continue
    }

    // 단락을 현재 페이지에 추가
    for (let i = 0; i < lines.length; i++) {
      if (currentPage.length && i === 0) {
        currentPage.push(['', true])  // 단락 간격 마커
        currentHeight += paraGapH
      }
      currentPage.push([lines[i], i === 0])
      currentHeight += lineH
    }
  }

  if (currentPage.length) pages.push(currentPage)
  return pages
}
