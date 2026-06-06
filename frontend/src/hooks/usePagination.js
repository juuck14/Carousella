/**
 * usePagination.js — DOM 텍스트 측정 기반 실시간 페이지 분할 훅
 *
 * 숨겨진 div 요소(measureRef)를 이용해 각 단락의 높이를 측정하고
 * 1080×1080 기준으로 몇 페이지에 걸쳐야 하는지 계산한다.
 * bodyText 또는 cfg의 주요 값이 바뀌면 자동으로 재계산된다.
 */

import { useLayoutEffect, useState } from 'react'

/** bodyText를 { t:'p'|'break', text? } 배열로 파싱 */
function buildBlocks(bodyText) {
  const normalized = (bodyText || '')
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  if (!normalized) return []

  const blocks = []
  for (const block of normalized.split('\n\n')) {
    const trimmed = block.trim()
    if (!trimmed) continue
    const lines = trimmed.split('\n')
    let cur = []
    for (const line of lines) {
      if (line.trim() === '---') {
        if (cur.length) {
          const para = cur.join('\n').trim()
          if (para) blocks.push({ t: 'p', text: para })
          cur = []
        }
        blocks.push({ t: 'break' })
      } else {
        cur.push(line)
      }
    }
    if (cur.length) {
      const para = cur.join('\n').trim()
      if (para) blocks.push({ t: 'p', text: para })
    }
  }
  return blocks
}

/**
 * @param {string}      bodyText   — 본문 원문
 * @param {object}      cfg        — DEFAULT_CONFIG 기반 설정
 * @param {React.Ref}   measureRef — position:fixed; visibility:hidden 으로 숨겨진 div ref
 * @returns {{ type:'cover' } | { type:'body', n:number, paras:string[] }}[]
 */
export function usePagination(bodyText, cfg, measureRef) {
  const [pages, setPages] = useState([{ type: 'cover' }])

  useLayoutEffect(() => {
    const el = measureRef.current
    if (!el) return

    const m    = cfg.margin
    const maxH = 1080 - 2 * m - 60          // 가용 텍스트 높이
    const gap  = cfg.bodyFontSize * cfg.paraSpacing   // 단락 간 간격(px)

    // 측정용 div 스타일 (1080 기준 절대 크기)
    el.style.cssText = [
      `width:${1080 - 2 * m}px`,
      `font-size:${cfg.bodyFontSize}px`,
      `line-height:${cfg.lineSpacing}`,
      `font-family:'Noto Serif KR',serif`,
      `word-break:keep-all`,
      `text-align:justify`,
      `white-space:normal`,
      `box-sizing:content-box`,
      `padding:0`,
      `margin:0`,
      `position:fixed`,
      `left:-99999px`,
      `top:0`,
      `visibility:hidden`,
      `pointer-events:none`,
    ].join(';')

    const measureH = (text) => {
      el.textContent = text
      return el.offsetHeight
    }

    const blocks    = buildBlocks(bodyText)
    const bodyPages = []
    let cur = [], h = 0

    const flush = () => {
      if (cur.length) { bodyPages.push([...cur]); cur = []; h = 0 }
    }

    for (const b of blocks) {
      if (b.t === 'break') { flush(); continue }

      const ph   = measureH(b.text)
      const addH = (cur.length ? gap : 0) + ph

      // 이미 내용이 있는데 넘치면 새 페이지
      if (cur.length && h + addH > maxH) flush()

      cur.push(b.text)
      // push 후 cur.length가 2 이상이어야 gap 추가 (첫 단락은 gap 없음)
      h += (cur.length > 1 ? gap : 0) + ph
    }
    flush()

    setPages([
      { type: 'cover' },
      ...bodyPages.map((paras, i) => ({ type: 'body', n: i + 2, paras })),
    ])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bodyText, cfg.bodyFontSize, cfg.lineSpacing, cfg.paraSpacing, cfg.margin])

  return pages
}
