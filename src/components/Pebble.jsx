import { useState } from 'react'
import { usePebbles } from '../hooks/usePebbles.jsx'
import styles from './Pebble.module.css'

export default function Pebble({ id, message, className = '', style }) {
  const { addPebble, foundSet } = usePebbles()
  const found = foundSet.has(id)
  const [sparkle, setSparkle] = useState(false)
  const [showMessage, setShowMessage] = useState(false)

  const handleClick = () => {
    if (found) return
    const added = addPebble(id)
    if (added) {
      // Trigger micro-animation and sweet message when collected.
      setSparkle(true)
      setShowMessage(true)
      window.setTimeout(() => setSparkle(false), 900)
      window.setTimeout(() => setShowMessage(false), 1600)
    }
  }

  return (
    <button
      type="button"
      className={`${styles.pebble} ${found ? styles.found : ''} ${sparkle ? styles.sparkle : ''} ${className}`}
      style={style}
      onClick={handleClick}
      aria-label={found ? 'Piedrita encontrada' : 'Piedrita escondida'}
      aria-pressed={found}
    >
      <span className={styles.core} />
      {showMessage && <span className={styles.message}>{message}</span>}
    </button>
  )
}
