import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import styles from './InputPanel.module.css'

// 개발용 테스트 데이터
const TEST_DATA = {
  title: '디지털, 혹은 재현된 환상',
  subtitle: '[Velocity : Design : Comfort] 리뷰',
  body: `나는 <Velocity : Design : Comfort>을 몇 년 전 친구의 추천으로 처음 듣게 되었다. 나는 그 당시를 어렴풋이 기억한다. 안타깝지만 이 앨범을 듣자마자 거대한 쇼크가 일어나서 온몸에 전율이 돋고 내 인생이 바뀌는 일 같은 건 일어나지 않았다.

대신에 이 앨범을 들으면서 나는, 뭐지, 이런 앨범도 있네, 라고 생각했지만, 이 앨범을 제외한 다른 모든 음악이 내 머릿속에서 지워지는 느낌이었다.

나는 이 앨범을 계속 들으면서도, 이 앨범이 너무 좋아서 미칠 것 같다는 생각은 들지 않았지만, 마치 세상에 음악이라고는 단 하나밖에 존재하지 않는 것처럼, 그래서 이 앨범을 듣는 게 당연한 일인 것처럼 계속해서 이 앨범을 찾았다.

그건 정말로 신기한 경험이었다. 지금까지 음악을 들으면서 이와 같은 느낌을 받았던 적은 한 번도 없었다.

---

나는 이 글을 쓰면서, 내가 처음으로 라디오헤드의 "Paranoid Android"를 들었던 2015년 1월의 어느날 밤 자기 직전 순간을 떠올렸다. 나는 그날 밤을 여전히 내 인생이 완전히 뒤바뀐 날로 생각하고 있다.

하지만 불행하게도 <Velocity : Design : Comfort>는 내 인생을 거의 바꾸지 못했다. 라디오헤드는 하나의 거대하고도 완전히 새로운 세계의 지평을 열어젖혔던 반면에, <Velocity : Design : Comfort>는 단지 그 앨범에서 세계가 끝나버렸기 때문이다.

---

나는 의도적으로 이 글에서 스윗 트립을 거의 언급하지 않았다. 내게 <Velocity : Design : Comfort>는 스윗 트립의 작품이라기보다는 차라리 어느날 외계에서 갑자기 떨어진 것처럼 느껴지기 때문이다.

나는 이 앨범을 사랑한다. <Velocity : Design : Comfort>는 내 인생 최고의 앨범 중 하나이다.`,
}

export default function InputPanel({ onGenerate, loading }) {
  const [title,      setTitle]      = useState('')
  const [subtitle,   setSubtitle]   = useState('')
  const [body,       setBody]       = useState('')
  const [imgFile,    setImgFile]    = useState(null)
  const [imgPreview, setImgPreview] = useState('')

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

  function fillTestData() {
    setTitle(TEST_DATA.title)
    setSubtitle(TEST_DATA.subtitle)
    setBody(TEST_DATA.body)
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim() || !body.trim()) return
    onGenerate({ title, subtitle, body, imageFile: imgFile })
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

      {/* 버튼 */}
      <div className={styles.actions}>
        <button type="submit" className={styles.submitBtn} disabled={!canSubmit}>
          {loading ? '생성 중...' : '미리보기 생성'}
        </button>
        <button type="button" className={styles.testBtn} onClick={fillTestData} disabled={loading}>
          테스트 데이터
        </button>
      </div>

    </form>
  )
}
