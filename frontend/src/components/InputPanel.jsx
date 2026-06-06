/**
 * InputPanel.jsx — 입력 사이드바
 *
 * Props:
 *   doc              — { title, subtitle, imageFile, imageUrl, body }
 *   setDoc           — (patch) => void
 *   settings         — cfg 객체 (coverBgColor 등)
 *   onSettingsChange — (newSettings) => void
 */

import { useCallback, useRef } from 'react'
import { useDropzone } from 'react-dropzone'
import { TEST_DATA } from '../lib/testData'
import styles from './InputPanel.module.css'

// ── 표지 배경 팔레트 ────────────────────────────────────────────────
const COVER_PALETTES = [
  { color: '#141210', label: '먹'  },
  { color: '#1C1C1C', label: '흑'  },
  { color: '#1A1A2E', label: '남'  },
  { color: '#0D1F2D', label: '청'  },
  { color: '#1A1228', label: '보'  },
  { color: '#1A2318', label: '녹'  },
  { color: '#2D231A', label: '갈'  },
  { color: '#2A1A0A', label: '동'  },
]

// ── 서식 삽입 헬퍼 ────────────────────────────────────────────────
function insertFormat(textarea, marker) {
  const start = textarea.selectionStart
  const end   = textarea.selectionEnd
  const val   = textarea.value
  const sel   = val.slice(start, end)

  let newVal, newStart, newEnd

  if (marker === '---') {
    // 현재 줄 끝에 페이지 구분자 삽입
    const before = val.slice(0, start)
    const after  = val.slice(end)
    const prefix = before && !before.endsWith('\n') ? '\n' : ''
    const suffix = after  && !after.startsWith('\n') ? '\n' : ''
    newVal = `${before}${prefix}\n---\n${suffix}${after}`
    newStart = newEnd = start + prefix.length + 5
  } else {
    // 선택 텍스트 감싸기 (이미 감싸져 있으면 해제)
    const len = marker.length
    const wrapped = `${marker}${sel}${marker}`
    if (sel.startsWith(marker) && sel.endsWith(marker) && sel.length >= len * 2) {
      // 마커 해제
      const inner = sel.slice(len, -len)
      newVal   = `${val.slice(0, start)}${inner}${val.slice(end)}`
      newStart = start
      newEnd   = start + inner.length
    } else {
      newVal   = `${val.slice(0, start)}${wrapped}${val.slice(end)}`
      newStart = start + len
      newEnd   = end   + len
    }
  }

  // React controlled input 업데이트 (nativeInputValueSetter 트릭)
  const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set
  if (nativeSetter) nativeSetter.call(textarea, newVal)
  textarea.dispatchEvent(new Event('input', { bubbles: true }))
  textarea.setSelectionRange(newStart, newEnd)
  textarea.focus()
}

export default function InputPanel({ doc, setDoc, settings, onSettingsChange }) {
  const textareaRef = useRef(null)

  // 이미지 드롭/클릭 처리
  const onDrop = useCallback((accepted) => {
    const file = accepted[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => setDoc({ imageFile: file, imageUrl: e.target.result })
    reader.readAsDataURL(file)
  }, [setDoc])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxFiles: 1,
  })

  function clearImage(e) {
    e.stopPropagation()
    setDoc({ imageFile: null, imageUrl: null })
  }

  function loadSample() {
    setDoc({
      title:    TEST_DATA.title,
      subtitle: TEST_DATA.subtitle,
      body:     TEST_DATA.body,
    })
  }

  function clearAll() {
    setDoc({ title: '', subtitle: '', body: '', imageFile: null, imageUrl: null })
  }

  // 서식 툴바 클릭
  function handleFormat(marker) {
    if (textareaRef.current) insertFormat(textareaRef.current, marker)
  }

  // 키보드 단축키 (Ctrl+B, Ctrl+I)
  function onKeyDown(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
      e.preventDefault()
      handleFormat('**')
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
      e.preventDefault()
      handleFormat('*')
    }
  }

  // 표지 배경색 변경
  function setCoverBg(color) {
    if (onSettingsChange) onSettingsChange({ ...settings, coverBgColor: color })
  }

  const currentBg = settings?.coverBgColor || '#141210'

  return (
    <div className={styles.form}>

      {/* 제목 */}
      <div className={styles.field}>
        <label className={styles.label}>
          TITLE <span className={styles.req}>*</span>
        </label>
        <input
          className={styles.input}
          type="text"
          placeholder="앨범 / 작품 제목"
          value={doc.title}
          onChange={e => setDoc({ title: e.target.value })}
        />
      </div>

      {/* 라벨 */}
      <div className={styles.field}>
        <label className={styles.label}>LABEL</label>
        <div className={styles.labelPicker}>
          {['음악', '영화', '기타'].map(l => (
            <button
              key={l}
              type="button"
              className={`${styles.labelBtn} ${doc.label === l ? styles.labelBtnActive : ''}`}
              onClick={() => setDoc({ label: l })}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* 부제목 */}
      <div className={styles.field}>
        <label className={styles.label}>
          SUBTITLE <span className={styles.opt}>선택</span>
        </label>
        <input
          className={styles.input}
          type="text"
          placeholder="아티스트, 연도 등"
          value={doc.subtitle}
          onChange={e => setDoc({ subtitle: e.target.value })}
        />
      </div>

      {/* 표지 이미지 + 배경색 */}
      <div className={styles.field}>
        <label className={styles.label}>
          COVER <span className={styles.opt}>이미지 · 배경색</span>
        </label>
        <div
          {...getRootProps()}
          className={[
            styles.dropzone,
            isDragActive  ? styles.dragActive : '',
            doc.imageUrl  ? styles.hasImage   : '',
          ].join(' ')}
        >
          <input {...getInputProps()} />
          {doc.imageUrl ? (
            <>
              <img src={doc.imageUrl} className={styles.preview} alt="표지" />
              <button type="button" className={styles.clearImgBtn} onClick={clearImage}>✕</button>
            </>
          ) : (
            <span className={styles.dropHint}>
              {isDragActive ? '이미지를 놓으세요' : '이미지 드래그 또는 클릭'}
            </span>
          )}
        </div>

        {/* 배경색 팔레트 */}
        <div className={styles.palette}>
          {COVER_PALETTES.map(({ color, label }) => (
            <button
              key={color}
              type="button"
              className={`${styles.swatch} ${color === currentBg ? styles.swatchActive : ''}`}
              style={{ background: color }}
              title={label}
              onClick={() => setCoverBg(color)}
            />
          ))}
        </div>
      </div>

      {/* 본문 */}
      <div className={styles.field} style={{ flex: 1 }}>
        <label className={styles.label}>
          BODY <span className={styles.req}>*</span>
          <span className={styles.hint}>
            빈 줄 = 단락 구분 &nbsp;·&nbsp; <code>---</code> = 강제 페이지 분리
          </span>
        </label>

        {/* 서식 툴바 */}
        <div className={styles.toolbar}>
          <button
            type="button"
            className={styles.fmtBtn}
            title="굵게 (Ctrl+B)"
            onClick={() => handleFormat('**')}
          >
            <strong>B</strong>
          </button>
          <button
            type="button"
            className={styles.fmtBtn}
            title="기울임 (Ctrl+I)"
            onClick={() => handleFormat('*')}
          >
            <em>I</em>
          </button>
          <div className={styles.fmtDivider} />
          <button
            type="button"
            className={styles.fmtBtn}
            title="페이지 구분선 삽입"
            onClick={() => handleFormat('---')}
          >
            ——
          </button>
        </div>

        <textarea
          ref={textareaRef}
          className={styles.textarea}
          placeholder="평론 본문을 입력하세요..."
          value={doc.body}
          onChange={e => setDoc({ body: e.target.value })}
          onKeyDown={onKeyDown}
          rows={14}
        />
      </div>

      {/* 하단 버튼 */}
      <div className={styles.actions}>
        <button type="button" className={styles.sampleBtn} onClick={loadSample}>
          샘플 불러오기
        </button>
        <button type="button" className={styles.clearBtn} onClick={clearAll}>
          비우기
        </button>
      </div>

    </div>
  )
}
