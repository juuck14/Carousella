import { useState, useCallback } from 'react'
import { generateCarousel } from '../lib/generate'

/**
 * 캐러셀 이미지 생성 상태 훅.
 * 생성 결과(pages), 로딩 상태, 에러를 관리한다.
 *
 * @param {object} settings — useSettings().settings
 */
export function useCarousel(settings) {
  const [pages,   setPages]   = useState([])   // PNG data URL 배열
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const generate = useCallback(async ({ title, subtitle, body, imageFile }) => {
    setLoading(true)
    setError('')
    setPages([])
    try {
      const urls = await generateCarousel(title, subtitle, imageFile, body, settings)
      setPages(urls)
    } catch (e) {
      setError(e.message || '이미지 생성 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }, [settings])

  return { pages, loading, error, generate }
}
