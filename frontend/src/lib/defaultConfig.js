/**
 * defaultConfig.js — 캐러셀 디자인 토큰
 *
 * DEFAULT_CONFIG : 기본 설정값 (generate.js cfg 키와 동일)
 * CONFIG_FIELDS  : SettingsPanel 슬라이더 정의
 */

export const DEFAULT_CONFIG = {
  // 본문 — 무드 A(활자) 기준
  bodyFontSize:    30,
  lineSpacing:     1.95,
  paraSpacing:     0.93,
  letterSpacing:   0,
  margin:          120,

  // 표지
  coverSplitRatio: 0.42,   // 상단 텍스트 영역 비율 (0~1)
  coverTitleSize:  64,
  coverLabelSize:  23,

  // 색상 (Canvas 렌더용)
  bgColor:         '#F4F3EF',
  textColor:       '#1C1C1C',
  pageNumColor:    '#8A857C',
  ruleColor:       '#DBD7CF',
  coverBgColor:    '#141210',
  coverTextColor:  '#F4F3EF',
  coverLabelColor: '#8C857A',

  // 페이지 번호
  pageNumSize: 24,

  // 캔버스 크기 (인스타그램 표준)
  canvasSize:   1080,   // 너비 (고정)
  canvasHeight: 1080,   // 높이: 1080(1:1) or 1350(4:5)
}

/** SettingsPanel이 렌더링할 슬라이더 필드 목록 */
export const CONFIG_FIELDS = [
  {
    key: 'bodyFontSize',    label: '본문 폰트 크기',
    min: 20, max: 42, step: 1,    unit: 'px',
  },
  {
    key: 'lineSpacing',     label: '줄간격',
    min: 1.4, max: 2.8, step: 0.05, unit: '×',
  },
  {
    key: 'paraSpacing',     label: '단락 간격',
    min: 0.3, max: 1.6, step: 0.05,  unit: '×',
  },
  {
    key: 'margin',          label: '여백',
    min: 80,  max: 200, step: 4,   unit: 'px',
  },
  {
    key: 'coverSplitRatio', label: '표지 텍스트 비율',
    min: 0.25, max: 0.65, step: 0.01,
    format: v => `${Math.round(v * 100)}%`,
  },
  {
    key: 'coverTitleSize',  label: '표지 제목 크기',
    min: 36, max: 96, step: 2,    unit: 'px',
  },
]
