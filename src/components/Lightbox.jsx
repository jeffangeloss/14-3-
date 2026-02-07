import { useEffect } from 'react'
import styles from './Lightbox.module.css'

export default function Lightbox({ photo, onClose }) {
  useEffect(() => {
    if (!photo) return

    const handleKey = (event) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKey)

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKey)
    }
  }, [photo, onClose])

  if (!photo) return null

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label="Foto ampliada"
      onClick={onClose}
    >
      <div className={styles.modal} onClick={(event) => event.stopPropagation()}>
        <img src={photo.src} alt={photo.alt} />
        <p className={styles.caption}>{photo.note || photo.title || photo.caption || photo.alt}</p>
        <button type="button" className="btn ghost" onClick={onClose}>
          Cerrar
        </button>
      </div>
    </div>
  )
}
