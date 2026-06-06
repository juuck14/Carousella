import { DEFAULT_CONFIG } from '../lib/defaultConfig'
import styles from './SettingsPanel.module.css'

const FIELDS = [
  {
    key: 'bodyFontSize', label: '본문 폰트 크기', type: 'range',
    min: 16, max: 36, step: 1, unit: 'px',
  },
  {
    key: 'lineSpacing', label: '줄간격', type: 'range',
    min: 1.4, max: 2.8, step: 0.05, unit: '×',
  },
  {
    key: 'paraSpacing', label: '단락 간격', type: 'range',
    min: 0.2, max: 1.6, step: 0.1, unit: '×',
  },
  {
    key: 'margin', label: '여백', type: 'range',
    min: 80, max: 200, step: 4, unit: 'px',
  },
  {
    key: 'coverSplitRatio', label: '표지 텍스트 비율', type: 'range',
    min: 0.25, max: 0.65, step: 0.01,
    format: v => `${Math.round(v * 100)}%`,
  },
  {
    key: 'coverTitleSize', label: '표지 제목 크기', type: 'range',
    min: 28, max: 80, step: 2, unit: 'px',
  },
]

export default function SettingsPanel({ settings, onChange }) {
  function handleChange(key, value) {
    onChange({ ...settings, [key]: Number(value) })
  }

  function handleReset() {
    onChange({ ...DEFAULT_CONFIG })
  }

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <span className={styles.panelTitle}>디자인 설정</span>
        <button className={styles.resetBtn} onClick={handleReset}>초기화</button>
      </div>

      {FIELDS.map(({ key, label, min, max, step, unit = '', format }) => {
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

      <p className={styles.hint}>설정은 브라우저에 자동 저장됩니다</p>
    </div>
  )
}
