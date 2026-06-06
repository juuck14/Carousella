/**
 * generate.js — 브라우저 Canvas API 기반 캐러셀 이미지 생성 엔진
 * Python/Pillow generate.py의 로직을 그대로 JS로 재구현.
 */

export const PAGE_BREAK = '---'

// ============================================================
//  폰트 로딩 (Google Fonts → Canvas)
// ============================================================

export async function loadFonts(cfg) {
  // index.html의 Google Fonts CSS link가 먼저 삽입된 상태여야 한다.
  // document.fonts.load()는 해당 폰트 파일 다운로드를 트리거하고 완료를 기다린다.
  const specs = [
    `400 ${cfg.bodyFontSize}px "Noto Serif KR"`,
    `400 ${cfg.coverLabelSize}px "Noto Serif KR"`,
    `400 ${cfg.pageNumSize}px "Noto Serif KR"`,
    `700 ${cfg.coverTitleSize}px "Noto Serif KR"`,
  ]
  await Promise.all(specs.map(spec => document.fonts.load(spec)))
}

// ============================================================
//  텍스트 유틸
// ============================================================

function setFont(ctx, size, weight = 400) {
  ctx.font = `${weight} ${size}px "Noto Serif KR"`
}

function measureWidth(ctx, text, letterSpacing = 0) {
  if (!text) return 0
  if (letterSpacing === 0) return ctx.measureText(text).width
  let w = 0
  for (const ch of text) {
    w += ctx.measureText(ch).width + letterSpacing
  }
  return Math.max(0, w - letterSpacing)
}

function wrapParagraph(ctx, text, maxWidth, letterSpacing = 0) {
  /**
   * 단락 하나를 줄바꿈 처리 → 줄 문자열 배열 반환.
   * Python의 wrap_paragraph()와 동일한 알고리즘.
   */
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

function drawTextLine(ctx, x, y, text, letterSpacing = 0) {
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

// ============================================================
//  본문 텍스트 파싱
// ============================================================

export function parseBodyText(bodyText) {
  /**
   * 본문 문자열 → 단락 배열.
   * - 빈 줄(\n\n)로 단락 구분
   * - '---' 단독 행은 PAGE_BREAK 마커로 보존 (앞뒤 빈줄 없어도 인식)
   */
  const normalized = bodyText.trim().replace(/\n{3,}/g, '\n\n')
  const paragraphs = []

  for (const block of normalized.split('\n\n')) {
    const trimmed = block.trim()
    if (!trimmed) continue

    // 블록 안에서 --- 단독 행을 기준으로 추가 분리
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

// ============================================================
//  페이지 분할
// ============================================================

function splitIntoPages(paragraphs, ctx, cfg, availableHeight) {
  /**
   * 단락 배열 → 페이지별 [[text, isFirstLine], ...] 배열 리스트.
   * Python split_paragraphs_into_pages()와 동일한 알고리즘.
   */
  const { bodyFontSize, lineSpacing, paraSpacing, letterSpacing, canvasSize, margin } = cfg
  const lineH     = bodyFontSize * lineSpacing
  const paraGapH  = bodyFontSize * paraSpacing
  const maxWidth  = canvasSize - margin * 2
  const ls        = letterSpacing

  setFont(ctx, bodyFontSize, 400)

  const pages        = []
  let currentPage    = []
  let currentHeight  = 0

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

    // 현재 페이지에 안 들어가면 → 새 페이지
    if (currentPage.length && currentHeight + paraH > availableHeight) {
      pages.push(currentPage)
      currentPage   = []
      currentHeight = 0
    }

    // 단락 자체가 한 페이지 초과 → 줄 단위 강제 분할
    const curGap     = currentPage.length ? paraGapH : 0
    const curParaH   = lines.length * lineH + curGap
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
        currentPage.push(['', true])   // 단락 간격 마커
        currentHeight += paraGapH
      }
      currentPage.push([lines[i], i === 0])
      currentHeight += lineH
    }
  }

  if (currentPage.length) pages.push(currentPage)
  return pages
}

// ============================================================
//  이미지 커버핏 로딩
// ============================================================

async function loadCoverImage(file) {
  if (!file) return null
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload  = () => { URL.revokeObjectURL(url); resolve(img) }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('이미지 로드 실패')) }
    img.src = url
  })
}

function drawCoverFit(ctx, img, destX, destY, targetW, targetH) {
  const scale = Math.max(targetW / img.width, targetH / img.height)
  const sw    = img.width  * scale
  const sh    = img.height * scale
  const sx    = (sw - targetW) / 2
  const sy    = (sh - targetH) / 2
  ctx.drawImage(img, destX - sx, destY - sy, sw, sh)
}

// ============================================================
//  표지 렌더링
// ============================================================

function renderCover(ctx, title, subtitle, coverImg, cfg) {
  const {
    margin, coverSplitRatio, coverTitleSize, coverLabelSize,
    coverBgColor, coverTextColor, coverLabelColor, canvasSize,
  } = cfg

  const splitY   = Math.round(canvasSize * coverSplitRatio)
  const imgAreaH = canvasSize - splitY

  // 배경
  ctx.fillStyle = coverBgColor
  ctx.fillRect(0, 0, canvasSize, canvasSize)

  // 하단 이미지 영역 (cover-fit + 약한 블러)
  if (coverImg) {
    ctx.save()
    ctx.beginPath()
    ctx.rect(0, splitY, canvasSize, imgAreaH)
    ctx.clip()
    ctx.filter = 'blur(1px)'
    drawCoverFit(ctx, coverImg, 0, splitY, canvasSize, imgAreaH)
    ctx.restore()
  } else {
    ctx.fillStyle = '#1A1A1A'
    ctx.fillRect(0, splitY, canvasSize, imgAreaH)
  }

  // 분리선
  ctx.strokeStyle = '#333330'
  ctx.lineWidth   = 1
  ctx.beginPath()
  ctx.moveTo(0,        splitY)
  ctx.lineTo(canvasSize, splitY)
  ctx.stroke()

  // 레이블 "— 평론 —"
  const label = '— 평론 —'
  setFont(ctx, coverLabelSize, 400)
  ctx.fillStyle   = coverLabelColor
  ctx.textBaseline = 'top'
  ctx.fillText(label, margin, margin)

  const labelH = coverLabelSize * 1.2
  const ruleY  = margin + labelH + 16

  // 레이블 아래 구분선
  ctx.strokeStyle = '#3A3A38'
  ctx.lineWidth   = 1
  ctx.beginPath()
  ctx.moveTo(margin,            ruleY)
  ctx.lineTo(canvasSize - margin, ruleY)
  ctx.stroke()

  // 제목 줄바꿈 (bold)
  const tw = canvasSize - margin * 2
  setFont(ctx, coverTitleSize, 700)
  const titleLines  = wrapParagraph(ctx, title, tw, 0)
  const titleLineH  = Math.round(coverTitleSize * 1.28)
  const titleBlockH = titleLines.length * titleLineH

  // 부제목 줄바꿈
  setFont(ctx, coverLabelSize, 400)
  const subLines   = subtitle ? wrapParagraph(ctx, subtitle, tw, 0) : []
  const subLineH   = Math.round(coverLabelSize * 1.5)
  const subBlockH  = subLines.length ? subLines.length * subLineH + coverLabelSize : 0

  // 텍스트 영역(ruleY ~ splitY) 중앙에 배치
  let ty = Math.round((ruleY + splitY) / 2 - (titleBlockH + subBlockH) / 2)

  setFont(ctx, coverTitleSize, 700)
  ctx.fillStyle    = coverTextColor
  ctx.textBaseline = 'top'
  for (const line of titleLines) {
    ctx.fillText(line, margin, ty)
    ty += titleLineH
  }

  if (subLines.length) {
    ty += coverLabelSize
    setFont(ctx, coverLabelSize, 400)
    ctx.fillStyle = coverLabelColor
    for (const line of subLines) {
      ctx.fillText(line, margin, ty)
      ty += subLineH
    }
  }

  // 날짜 (텍스트 영역 우하단)
  const d       = new Date()
  const dateStr = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
  setFont(ctx, coverLabelSize, 400)
  ctx.fillStyle    = coverLabelColor
  ctx.textBaseline = 'middle'
  const dateW = ctx.measureText(dateStr).width
  ctx.fillText(dateStr, canvasSize - margin - dateW, splitY - margin / 2)
}

// ============================================================
//  본문 페이지 렌더링
// ============================================================

function renderBody(ctx, pageEntries, pageNum, cfg) {
  const {
    margin, bodyFontSize, lineSpacing, paraSpacing, letterSpacing,
    bgColor, textColor, pageNumColor, ruleColor, pageNumSize, canvasSize,
  } = cfg

  const lineH    = bodyFontSize * lineSpacing
  const paraGapH = bodyFontSize * paraSpacing

  // 배경
  ctx.fillStyle = bgColor
  ctx.fillRect(0, 0, canvasSize, canvasSize)

  // 상단 구분선
  ctx.strokeStyle = ruleColor
  ctx.lineWidth   = 1
  ctx.beginPath()
  ctx.moveTo(margin,            margin - 28)
  ctx.lineTo(canvasSize - margin, margin - 28)
  ctx.stroke()

  // 본문 텍스트
  setFont(ctx, bodyFontSize, 400)
  ctx.fillStyle    = textColor
  ctx.textBaseline = 'top'
  let y = margin

  for (const [text] of pageEntries) {
    if (text.trim()) {
      drawTextLine(ctx, margin, y, text, letterSpacing)
      y += lineH
    } else {
      y += paraGapH
    }
  }

  // 하단 구분선 + 페이지 번호
  const label = `— ${pageNum} —`
  setFont(ctx, pageNumSize, 400)
  ctx.fillStyle    = pageNumColor
  ctx.textBaseline = 'top'
  const pnW = ctx.measureText(label).width
  const pnY = canvasSize - margin + 8

  ctx.strokeStyle = ruleColor
  ctx.lineWidth   = 1
  ctx.beginPath()
  ctx.moveTo(margin,            pnY - 14)
  ctx.lineTo(canvasSize - margin, pnY - 14)
  ctx.stroke()

  ctx.fillText(label, (canvasSize - pnW) / 2, pnY)
}

// ============================================================
//  공개 API
// ============================================================

/**
 * 캐러셀 이미지 생성.
 * @returns {Promise<string[]>} PNG data URL 배열 (page_01 = 표지, page_02+ = 본문)
 */
export async function generateCarousel(title, subtitle, imageFile, bodyText, cfg) {
  // 폰트 로드 (Google Fonts)
  await loadFonts(cfg)

  const coverImg   = imageFile ? await loadCoverImage(imageFile) : null
  const paragraphs = parseBodyText(bodyText)

  // 임시 캔버스로 페이지 분할 계산
  const tmpCanvas  = document.createElement('canvas')
  tmpCanvas.width  = cfg.canvasSize
  tmpCanvas.height = cfg.canvasSize
  const tmpCtx     = tmpCanvas.getContext('2d')

  const availableH = cfg.canvasSize - cfg.margin * 2 - 60
  const pages      = splitIntoPages(paragraphs, tmpCtx, cfg, availableH)

  const dataUrls = []

  // 표지 생성
  const coverCanvas  = document.createElement('canvas')
  coverCanvas.width  = cfg.canvasSize
  coverCanvas.height = cfg.canvasSize
  renderCover(coverCanvas.getContext('2d'), title, subtitle, coverImg, cfg)
  dataUrls.push(coverCanvas.toDataURL('image/png'))

  // 본문 페이지 생성
  for (let i = 0; i < pages.length; i++) {
    const canvas  = document.createElement('canvas')
    canvas.width  = cfg.canvasSize
    canvas.height = cfg.canvasSize
    renderBody(canvas.getContext('2d'), pages[i], i + 2, cfg)
    dataUrls.push(canvas.toDataURL('image/png'))
  }

  return dataUrls
}
