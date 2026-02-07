import styles from './PolaroidCard.module.css'

export default function PolaroidCard({ photo, tilt = 0, onClick }) {
  return (
    <button
      type="button"
      className={styles.card}
      style={{ '--tilt': `${tilt}deg` }}
      onClick={onClick}
      aria-label={`Abrir ${photo.alt}`}
    >
      <div className={styles.frame}>
        <img src={photo.src} alt={photo.alt} loading="lazy" />
      </div>
      <div className={styles.caption}>
        <span>{photo.caption}</span>
        <span className={styles.tag}>{photo.tag}</span>
      </div>
    </button>
  )
}
