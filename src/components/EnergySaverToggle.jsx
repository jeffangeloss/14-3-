import styles from './EnergySaverToggle.module.css'

export default function EnergySaverToggle({ enabled, onToggle }) {
  return (
    <button
      type="button"
      className={styles.toggle}
      onClick={() => onToggle(!enabled)}
      aria-pressed={enabled}
      aria-label="Activar o desactivar modo ahorro"
    >
      <span className={styles.label}>Modo ahorro</span>
      <span className={`${styles.state} ${enabled ? styles.on : styles.off}`}>
        {enabled ? 'Activado' : 'Desactivado'}
      </span>
    </button>
  )
}
