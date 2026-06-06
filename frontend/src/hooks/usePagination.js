/**
 * usePagination.js — DOM 텍스트 측정 기반 실시간 페이지 분할 훅
 *
 * 숨겨진 div 요소(measureRef)를 이용해 각 단락의 높이를 측정하고
 * 1080×1080 기준으로 몇 페이지에 걸쳐야 하는지 계산한다.
 * bodyText 또는 cfg의 주요 값이 바뀌면 자동으로 재계산된다.
 */

import { useLayoutEffect, useState } from 'react'
import { stripInlineMarkdown } from '../lib/inlineMarkdown'

/**
 * bodyText를 { t:'p'|'break', text? } 배열로 파싱.
 * - 엔터 한 번(\n) = 같은 단락 내 줄바꿈 (단락 간격 없음)
 * - 빈 줄(\n\n) = 새 단락
 * - '---' 단독 줄 = 강제 페이지 분리
 */
function buildBlocks(bodyText) {
  const normalized = (bodyText || '').replace(/\r\n/g, '\n')
  if (!normalized.trim()) return []

  const blocks = []
  const lines = normalized.split('\n')
  let cur = []

  const flush = () => {
    if (cur.length) { blocks.push({ t: 'p', text: cur.join('\n') }); cur = [] }
  }

  for (const line of lines) {
    if (line.trim() === '---') {
      flush()
      blocks.push({ t: 'break' })
    } else if (line.trim() === '') {
      flush()
    } else {
      cur.push(line)
    }
  }
  flush()
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
      `white-space:pre-line`,
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
      el.textContent = stripInlineMarkdown(text)
      return el.offsetHeight
    }

    const blocks = buildBlocks(bodyText)

    // 마지막에 □ 단락 추가
    if (blocks.length > 0) blocks.push({ t: 'p', text: '□' })

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
      h += (cur.length > 1 ? gap : 0) + ph
    }
    flush()

    // □가 혼자 마지막 페이지에 있으면 → 이전 페이지 마지막 단락에 ' □' 붙임
    if (bodyPages.length > 0) {
      const lastPage = bodyPages[bodyPages.length - 1]
      if (lastPage.length === 1 && lastPage[0] === '□') {
        bodyPages.pop()
        if (bodyPages.length > 0) {
          const prev = bodyPages[bodyPages.length - 1]
          prev[prev.length - 1] += ' □'
        }
      }
    }

    setPages([
      { type: 'cover' },
      ...bodyPages.map((paras, i) => ({ type: 'body', n: i + 2, paras })),
    ])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bodyText, cfg.bodyFontSize, cfg.lineSpacing, cfg.paraSpacing, cfg.margin])

  return pages
}
