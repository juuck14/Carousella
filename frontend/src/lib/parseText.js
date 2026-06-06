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
 * - 빈 줄(\n\n)로 단락 구분
 * - '---' 단독 행은 PAGE_BREAK 마커로 보존 (앞뒤 빈줄 없어도 인식)
 */
export function parseBodyText(bodyText) {
  const normalized = bodyText.trim().replace(/\n{3,}/g, '\n\n')
  const paragraphs = []

  for (const block of normalized.split('\n\n')) {
    const trimmed = block.trim()
    if (!trimmed) continue

    const lines = trimmed.split('\n')
    let currentLines = []

    for (const line of lines) {
      if (line.trim() === '---') {
        if (currentLines.length) {
          const para = currentLines.join('\n').trim()
          if (para) paragraphs.push(para)
          currentLines = []
        }
        paragraphs.push(PAGE_BREAK)
      } else {
        currentLines.push(line)
      }
    }

    if (currentLines.length) {
      const para = currentLines.join('\n').trim()
      if (para) paragraphs.push(para)
    }
  }

  return paragraphs
}
