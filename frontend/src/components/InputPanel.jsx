/**
 * InputPanel.jsx — 입력 사이드바
 *
 * Props:
 *   doc     — { title, subtitle, imageFile, imageUrl, body }
 *   setDoc  — (patch) => void
 */

import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { TEST_DATA } from '../lib/testData'
import styles from './InputPanel.module.css'

export default function InputPanel({ doc, setDoc }) {
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

      {/* 표지 이미지 */}
      <div className={styles.field}>
        <label className={styles.label}>
          COVER IMAGE <span className={styles.opt}>선택</span>
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
      </div>

      {/* 본문 */}
      <div className={styles.field} style={{ flex: 1 }}>
        <label className={styles.label}>
          BODY <span className={styles.req}>*</span>
          <span className={styles.hint}>
            빈 줄 = 단락 구분 &nbsp;·&nbsp; <code>---</code> = 강제 페이지 분리
          </span>
        </label>
        <textarea
          className={styles.textarea}
          placeholder="평론 본문을 입력하세요..."
          value={doc.body}
          onChange={e => setDoc({ body: e.target.value })}
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
