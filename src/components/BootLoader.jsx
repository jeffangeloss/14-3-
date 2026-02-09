import styles from './BootLoader.module.css'

const clamp = (value, min, max) => Math.max(min, Math.min(max, value))

export default function BootLoader({ progress = 0, message = 'Cargando...' }) {
  const ratio = clamp(progress, 0, 1)
  const percent = Math.round(ratio * 100)

  return (
    <div className={styles.screen} role="status" aria-live="polite">
      <div className={styles.card}>
        <div className={styles.petWrap} aria-hidden="true">
          <img
            className={styles.pet}
            src="/photos/web/rui_miau.png"
            alt=""
            loading="eager"
            decoding="async"
          />
          <span className={styles.shadow} />
        </div>
        <p className={styles.title}>Cargando...</p>
        <p className={styles.message}>{message}</p>
        <div className={styles.progressTrack} aria-hidden="true">
          <span className={styles.progressFill} style={{ '--progress': ratio }} />
        </div>
        <p className={styles.percent}>{percent}%</p>
      </div>
    </div>
  )
}
