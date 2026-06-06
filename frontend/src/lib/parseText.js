/**
 * parseText.js — 본문 텍스트 파싱 및 줄바꿈 처리
 */

import { measureWidth } from './canvasUtils'

export const PAGE_BREAK = '---'

/**
 * 단락 하나를 maxWidth 기준으로 줄바꿈 처리.
 * Python wrap_paragraph()와 동일한 알고리즘.
 * @returns {string[]} 줄 문자열 배열
 */
export function wrapParagraph(ctx, text, maxWidth, letterSpacing = 0) {
  const result = []
  for (const sub of text.split('\n')) {
    const words = sub.split(/\s+/).filter(Boolean)
    if (!words.length) continue
    let current = ''
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word
      if (measureWidth(ctx, candidate, letterSpacing) <= maxWidth) {
        current = candidate
      } else {
        if (current) result.push(current)
        // 단어 자체가 maxWidth 초과 → 글자 단위 강제 분할
        if (measureWidth(ctx, word, letterSpacing) > maxWidth) {
          let buf = ''
          for (const ch of word) {
            if (measureWidth(ctx, buf + ch, letterSpacing) <= maxWidth) {
              buf += ch
            } else {
              if (buf) result.push(buf)
              buf = ch
            }
          }
          current = buf
        } else {
          current = word
        }
      }
    }
    if (current) result.push(current)
  }
  return result
}

/**
 * 본문 문자열 → 단락 배열.
 * - 엔터 한 번(\n) = 같은 단락 안 줄바꿈 (단락 간격 없음)
 * - 엔터 두 번(\n\n, 빈 줄) = 새 단락
 * - '---' 단독 행 = PAGE_BREAK 마커
 */
export function parseBodyText(bodyText) {
  const paragraphs = []
  const lines = bodyText.trim().split('\n')
  let cur = []

  const flush = () => {
    if (cur.length) { paragraphs.push(cur.join('\n')); cur = [] }
  }

  for (const line of lines) {
    if (line.trim() === '---') {
      flush()
      paragraphs.push(PAGE_BREAK)
    } else if (line.trim() === '') {
      flush()
    } else {
      cur.push(line)
    }
  }
  flush()
  return paragraphs
}
