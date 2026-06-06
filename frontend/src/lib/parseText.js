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
 * - 엔터 한 번(\n) = 새 단락
 * - '---' 단독 행 = PAGE_BREAK 마커
 */
export function parseBodyText(bodyText) {
  const paragraphs = []
  for (const line of bodyText.trim().split('\n')) {
    const trimmed = line.trim()
    if (!trimmed) continue
    if (trimmed === '---') {
      paragraphs.push(PAGE_BREAK)
    } else {
      paragraphs.push(trimmed)
    }
  }
  return paragraphs
}
