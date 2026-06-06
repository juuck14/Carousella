import { useState, useCallback } from 'react'

const KEY = 'carousel_drafts'
const MAX_DRAFTS = 20

function loadFromStorage() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]')
  } catch {
    return []
  }
}

export function useDrafts() {
  const [drafts, setDrafts] = useState(loadFromStorage)

  const saveDraft = useCallback((doc, settings) => {
    const draft = {
      id: Date.now(),
      title: doc.title || '(제목 없음)',
      savedAt: new Date().toISOString(),
      doc: {
        title:    doc.title,
        subtitle: doc.subtitle,
        label:    doc.label,
        imageUrl: doc.imageUrl,
        body:     doc.body,
      },
      settings,
    }

    const next = [draft, ...drafts].slice(0, MAX_DRAFTS)

    try {
      localStorage.setItem(KEY, JSON.stringify(next))
      setDrafts(next)
      return { ok: true }
    } catch (e) {
      if (e.name === 'QuotaExceededError' || e.code === 22) {
        // 이미지 없이 재시도
        const withoutImg = { ...draft, doc: { ...draft.doc, imageUrl: null } }
        const next2 = [withoutImg, ...drafts].slice(0, MAX_DRAFTS)
        try {
          localStorage.setItem(KEY, JSON.stringify(next2))
          setDrafts(next2)
          return { ok: true, imageDropped: true }
        } catch {
          return { ok: false }
        }
      }
      return { ok: false }
    }
  }, [drafts])

  const deleteDraft = useCallback((id) => {
    const next = drafts.filter(d => d.id !== id)
    localStorage.setItem(KEY, JSON.stringify(next))
    setDrafts(next)
  }, [drafts])

  return { drafts, saveDraft, deleteDraft }
}
