/**
 * generate.js — 캐러셀 이미지 생성 진입점 (Canvas 기반 PNG 내보내기)
 *
 * 모듈 구조:
 *   canvasUtils  — setFont, measureWidth, drawTextLine
 *   parseText    — PAGE_BREAK, wrapParagraph, parseBodyText
 *   layout       — splitIntoPages
 *   renderCover  — loadCoverImage, renderCover
 *   renderBody   — renderBody
 */

import { parseBodyText } from './parseText'
import { splitIntoPages } from './layout'
import { loadCoverImage, renderCover } from './renderCover'
import { renderBody } from './renderBody'

// ─── 폰트 로딩 ────────────────────────────────────────────────

/**
 * 캔버스 렌더링 전에 필요한 폰트를 모두 로드한다.
 * Google Fonts <link>가 index.html에 삽입된 상태여야 한다.
 */
export async function loadFonts(cfg) {
  const specs = [
    // 본문 / 규칙선 / 페이지 번호
    `400 ${cfg.bodyFontSize}px "Noto Serif KR"`,
    `400 ${cfg.pageNumSize}px "Noto Serif KR"`,
    // 표지 레이블
    `400 ${cfg.coverLabelSize}px "Noto Serif KR"`,
    // 표지 제목 (Nanum Myeongjo)
    `700 ${cfg.coverTitleSize}px "Nanum Myeongjo"`,
    `400 ${cfg.coverTitleSize}px "Nanum Myeongjo"`,
  ]
  await Promise.all(specs.map(spec => document.fonts.load(spec)))
}

// ─── 공개 API ─────────────────────────────────────────────────

/**
 * 캐러셀 이미지 생성 — 1080×1080 PNG data URL 배열 반환
 * @param {string}    title
 * @param {string}    subtitle
 * @param {File|null} imageFile  — 표지 이미지 (없으면 null)
 * @param {string}    bodyText
 * @param {object}    cfg        — DEFAULT_CONFIG 기반 설정
 * @returns {Promise<string[]>}  PNG data URL 배열 (index 0 = 표지)
 */
export async function generateCarousel(title, subtitle, imageFile, bodyText, cfg) {
  await loadFonts(cfg)

  const coverImg   = await loadCoverImage(imageFile)
  const paragraphs = parseBodyText(bodyText)

  // 페이지 분할 계산용 임시 캔버스
  const tmpCanvas  = document.createElement('canvas')
  tmpCanvas.width  = cfg.canvasSize
  tmpCanvas.height = cfg.canvasSize
  const tmpCtx     = tmpCanvas.getContext('2d')

  const availableH = cfg.canvasSize - cfg.margin * 2 - 60
  const pages      = splitIntoPages(paragraphs, tmpCtx, cfg, availableH)

  const dataUrls = []

  // 표지
  const coverCanvas  = document.createElement('canvas')
  coverCanvas.width  = cfg.canvasSize
  coverCanvas.height = cfg.canvasSize
  renderCover(coverCanvas.getContext('2d'), title, subtitle, coverImg, cfg)
  dataUrls.push(coverCanvas.toDataURL('image/png'))

  // 본문 페이지
  for (let i = 0; i < pages.length; i++) {
    const canvas  = document.createElement('canvas')
    canvas.width  = cfg.canvasSize
    canvas.height = cfg.canvasSize
    renderBody(canvas.getContext('2d'), pages[i], i + 2, cfg)
    dataUrls.push(canvas.toDataURL('image/png'))
  }

  return dataUrls
}
