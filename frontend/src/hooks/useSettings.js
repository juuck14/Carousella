import { useState, useCallback } from 'react'
import { DEFAULT_CONFIG } from '../lib/defaultConfig'

const STORAGE_KEY = 'carousel_settings'

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_CONFIG
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_CONFIG
  }
}

/**
 * 디자인 설정 상태 + localStorage 영속화 훅.
 * 새로고침해도 설정이 유지된다.
 */
export function useSettings() {
  const [settings, setSettings] = useState(loadFromStorage)

  const update = useCallback((next) => {
    setSettings(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }, [])

  return { settings, update }
}
