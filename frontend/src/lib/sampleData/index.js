/**
 * sampleData/index.js — "샘플" 버튼용 더미 데이터 묶음
 *
 * SAMPLE_REVIEW   — 샘플 텍스트 (제목·부제·본문)
 * SAMPLE_IMAGE_URL — 샘플 표지 이미지 경로 (frontend/public/sample/cover.jpg)
 * loadSampleImageFile — 샘플 이미지를 File 객체로 가져오기 (드롭존 업로드와 동일하게 처리하기 위함)
 */

import { SAMPLE_REVIEW } from './sampleReview'

export { SAMPLE_REVIEW }

export const SAMPLE_IMAGE_URL = `${import.meta.env.BASE_URL}sample/cover.jpg`

export async function loadSampleImageFile() {
  const res = await fetch(SAMPLE_IMAGE_URL)
  if (!res.ok) return null
  const blob = await res.blob()
  return new File([blob], 'sample-cover.jpg', { type: blob.type || 'image/jpeg' })
}
