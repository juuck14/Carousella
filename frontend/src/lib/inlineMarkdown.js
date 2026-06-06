/**
 * inlineMarkdown.js — 인라인 마크다운 파서
 *
 * 지원 문법:
 *   **bold**   → { t: 'bold', s: '...' }
 *   *italic*   → { t: 'em', s: '...' }
 *   그 외       → { t: 'text', s: '...' }
 */

/**
 * 텍스트 한 줄을 인라인 마크다운 세그먼트 배열로 파싱.
 * @param {string} text
 * @returns {{ t: 'text'|'bold'|'em', s: string }[]}
 */
export function parseInline(text) {
  const parts = []
  // **bold** 먼저, *italic* 나중에 (순서 중요)
  const re = /(\*\*(.+?)\*\*)|(\*(.+?)\*)/gs
  let last = 0
  let m
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) {
      parts.push({ t: 'text', s: text.slice(last, m.index) })
    }
    if (m[1]) {
      parts.push({ t: 'bold', s: m[2] })
    } else {
      parts.push({ t: 'em', s: m[4] })
    }
    last = m.index + m[0].length
  }
  if (last < text.length) {
    parts.push({ t: 'text', s: text.slice(last) })
  }
  return parts.length ? parts : [{ t: 'text', s: text }]
}

/**
 * 마크다운 마커를 제거한 순수 텍스트 반환 (측정용).
 * @param {string} text
 * @returns {string}
 */
export function stripInlineMarkdown(text) {
  return text
    .replace(/\*\*(.+?)\*\*/gs, '$1')
    .replace(/\*(.+?)\*/gs, '$1')
}
