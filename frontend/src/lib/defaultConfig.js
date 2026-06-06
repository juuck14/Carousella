/**
 * 캐러셀 디자인 기본값.
 * SettingsPanel의 localStorage 키와 generate.js의 cfg 키가 동일해야 한다.
 */
export const DEFAULT_CONFIG = {
  // 본문
  bodyFontSize:    22,
  lineSpacing:     2.05,
  paraSpacing:     0.9,
  letterSpacing:   0,
  margin:          120,

  // 표지
  coverSplitRatio: 0.42,   // 상단 텍스트 영역 비율 (0~1)
  coverTitleSize:  48,
  coverLabelSize:  20,

  // 색상
  bgColor:          '#F4F3EF',
  textColor:        '#1C1C1C',
  pageNumColor:     '#B0ADA6',
  ruleColor:        '#D8D5CE',
  coverBgColor:     '#111111',
  coverTextColor:   '#F4F3EF',
  coverLabelColor:  '#888880',

  // 페이지 번호
  pageNumSize: 20,

  // 캔버스 (변경 금지)
  canvasSize: 1080,
}
