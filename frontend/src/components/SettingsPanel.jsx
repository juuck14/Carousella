import { DEFAULT_CONFIG, CONFIG_FIELDS, FONT_OPTIONS } from '../lib/defaultConfig'
import styles from './SettingsPanel.module.css'

export default function SettingsPanel({ settings, onChange }) {
  function handleChange(key, value) {
    onChange({ ...settings, [key]: Number(value) })
  }

  function handleFontChange(id) {
    onChange({ ...settings, bodyFontFamily: id })
  }

  function handleReset() {
    const reset = { ...settings, bodyFontFamily: DEFAULT_CONFIG.bodyFontFamily }
    for (const { key } of CONFIG_FIELDS) reset[key] = DEFAULT_CONFIG[key]
    onChange(reset)
  }

  const currentFont = settings.bodyFontFamily ?? DEFAULT_CONFIG.bodyFontFamily

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <span className={styles.panelTitle}>디자인 설정</span>
        <button className={styles.resetBtn} onClick={handleReset}>초기화</button>
      </div>

      {/* 본문 폰트 선택 */}
      <div className={styles.field}>
        <div className={styles.fieldHeader}>
          <span className={styles.fieldLabel}>본문 폰트</span>
        </div>
        <div className={styles.fontRow}>
          {FONT_OPTIONS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              className={`${styles.fontBtn} ${id === currentFont ? styles.fontBtnActive : ''}`}
              style={{ fontFamily: `"${id}", serif` }}
              onClick={() => handleFontChange(id)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {CONFIG_FIELDS.map(({ key, label, min, max, step, unit = '', format }) => {
        const val     = settings[key] ?? DEFAULT_CONFIG[key]
        const display = format ? format(val) : `${val}${unit}`
        return (
          <div key={key} className={styles.field}>
            <div className={styles.fieldHeader}>
              <span className={styles.fieldLabel}>{label}</span>
              <span className={styles.fieldValue}>{display}</span>
            </div>
            <input
              type="range"
              className={styles.slider}
              min={min}
              max={max}
              step={step}
              value={val}
              onChange={e => handleChange(key, e.target.value)}
            />
          </div>
        )
      })}

      <p className={styles.hint}>
        모든 변경은 미리보기에 즉시 반영됩니다.<br />
        본문·줄간격·여백을 바꾸면 페이지가 다시 나뉩니다.<br />
        설정은 브라우저에 자동 저장됩니다.
      </p>
    </div>
  )
}
