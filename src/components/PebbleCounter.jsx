import { usePebbles } from '../hooks/usePebbles.jsx'
import styles from './PebbleCounter.module.css'

export default function PebbleCounter() {
  const { found, total, complete } = usePebbles()

  return (
    <div className={styles.counter} aria-live="polite">
      <span className={styles.label}>Piedritas</span>
      <span className={styles.value}>{found.length}/{total}</span>
      {complete && <span className={styles.badge}>Secreto desbloqueado</span>}
    </div>
  )
}
