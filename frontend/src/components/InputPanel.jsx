import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import styles from './InputPanel.module.css'

export default function InputPanel({ onGenerate, loading }) {
  const [title,    setTitle]    = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [body,     setBody]     = useState('')
  const [imgFile,  setImgFile]  = useState(null)   // File object
  const [imgPreview, setImgPreview] = useState('')  // data URL

  // react-dropzone
  const onDrop = useCallback((accepted) => {
    const file = accepted[0]
    if (!file) return
    setImgFile(file)
    const reader = new FileReader()
    reader.onload = (e) => setImgPreview(e.target.result)
    reader.readAsDataURL(file)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxFiles: 1,
  })

  function clearImage(e) {
    e.stopPropagation()
    setImgFile(null)
    setImgPreview('')
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim() || !body.trim()) return

    const fd = new FormData()
    fd.append('title',    title)
    fd.append('subtitle', subtitle)
    fd.append('body',     body)
    if (imgFile) fd.append('image', imgFile)

    onGenerate(fd)
  }

  const canSubmit = title.trim() && body.trim() && !loading

  return (
    <form className={styles.form} onSubmit={handleSubmit}>

      {/* 제목 */}
      <div className={styles.field}>
        <label className={styles.label}>제목 <span className={styles.required}>*</span></label>
        <input
          className={styles.input}
          type="text"
          placeholder="앨범 / 작품 제목"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
      </div>

      {/* 부제목 */}
      <div className={styles.field}>
        <label className={styles.label}>부제목 <span className={styles.optional}>선택</span></label>
        <input
          className={styles.input}
          type="text"
          placeholder="아티스트, 연도 등"
          value={subtitle}
          onChange={e => setSubtitle(e.target.value)}
        />
      </div>

      {/* 표지 이미지 */}
      <div className={styles.field}>
        <label className={styles.label}>표지 이미지 <span className={styles.optional}>선택</span></label>
        <div
          {...getRootProps()}
          className={`${styles.dropzone} ${isDragActive ? styles.dragActive : ''} ${imgPreview ? styles.hasImage : ''}`}
        >
          <input {...getInputProps()} />
          {imgPreview ? (
            <>
              <img src={imgPreview} className={styles.preview} alt="표지 미리보기" />
              <button type="button" className={styles.clearBtn} onClick={clearImage}>✕</button>
            </>
          ) : (
            <span className={styles.dropHint}>
              {isDragActive ? '이미지를 놓으세요' : '이미지 드래그 또는 클릭'}
            </span>
          )}
        </div>
      </div>

      {/* 본문 */}
      <div className={styles.field}>
        <label className={styles.label}>
          본문 <span className={styles.required}>*</span>
          <span className={styles.hint}>빈 줄 = 단락 구분 &nbsp;·&nbsp; <code>---</code> = 강제 페이지 분리</span>
        </label>
        <textarea
          className={styles.textarea}
          placeholder="평론 본문을 입력하세요..."
          value={body}
          onChange={e => setBody(e.target.value)}
          rows={16}
        />
      </div>

      {/* 생성 버튼 */}
      <div className={styles.actions}>
        <button
          type="submit"
          className={styles.submitBtn}
          disabled={!canSubmit}
        >
          {loading ? '생성 중...' : '미리보기 생성'}
        </button>
      </div>

    </form>
  )
}
