/**
 * generate.js — 캐러셀 이미지 생성 진입점
 * 각 역할별 모듈을 조합해 generateCarousel()을 구성한다.
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

// ============================================================
//  폰트 로딩
// ============================================================

/**
 * Google Fonts에서 Noto Serif KR을 캔버스에 사용 가능한 상태로 로드.
 * index.html에 Google Fonts <link>가 삽입된 상태여야 한다.
 */
export async function loadFonts(cfg) {
  const specs = [
    `400 ${cfg.bodyFontSize}px "Noto Serif KR"`,
    `400 ${cfg.coverLabelSize}px "Noto Serif KR"`,
    `400 ${cfg.pageNumSize}px "Noto Serif KR"`,
    `700 ${cfg.coverTitleSize}px "Noto Serif KR"`,
  ]
  await Promise.all(specs.map(spec => document.fonts.load(spec)))
}

// ============================================================
//  공개 API
// ============================================================

/**
 * 캐러셀 이미지 생성.
 * @param {string}   title
 * @param {string}   subtitle
 * @param {File|null} imageFile  — 표지 이미지 (없으면 null)
 * @param {string}   bodyText
 * @param {object}   cfg        — defaultConfig.js DEFAULT_CONFIG 기반
 * @returns {Promise<string[]>} PNG data URL 배열 (index 0 = 표지)
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
