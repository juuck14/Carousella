/**
 * imageFilters.js — 표지 이미지 필터 프리셋
 *
 * css 값은 Canvas 2D ctx.filter / CSS filter 양쪽에서 동일하게 사용 가능
 */
export const IMAGE_FILTERS = [
  { id: 'none',      label: '없음',  css: 'none' },
  { id: 'grayscale', label: '흑백',  css: 'grayscale(100%)' },
  { id: 'sepia',     label: '세피아', css: 'sepia(80%)' },
  { id: 'contrast',  label: '고대비', css: 'contrast(135%) saturate(110%)' },
  { id: 'fade',      label: '페이드', css: 'contrast(90%) brightness(108%) saturate(80%)' },
]

export function getFilterCss(id) {
  return IMAGE_FILTERS.find(f => f.id === id)?.css || 'none'
}
