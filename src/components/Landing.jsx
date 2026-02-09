import { useMemo } from 'react'
import styles from './Landing.module.css'
import { usePhotoCatalog } from '../hooks/usePhotoCatalog'

const hasJuntosToken = (photo) => {
  const source = [
    photo?.fileName,
    photo?.relativePath,
    photo?.src,
    photo?.title,
    photo?.alt,
    photo?.name
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  return source.includes('juntos')
}

const buildFilledTiles = (photos, total) => {
  if (photos.length === 0 || total <= 0) return []

  const result = []
  for (let index = 0; index < total; index += 1) {
    const photo = photos[index % photos.length]
    result.push({
      ...photo,
      tileKey: `${photo.id ?? photo.src}-${index}`
    })
  }
  return result
}

export default function Landing({ energySaver = false }) {
  const { photos } = usePhotoCatalog()

  const juntosPhotos = useMemo(() => {
    const filtered = photos.filter(hasJuntosToken)
    const unique = []
    const seen = new Set()

    for (const photo of filtered) {
      if (!photo?.src || seen.has(photo.src)) continue
      seen.add(photo.src)
      unique.push(photo)
    }

    return unique
  }, [photos])

  const heartTiles = useMemo(() => {
    const cols = energySaver ? 6 : 7
    const rows = energySaver ? 6 : 7
    return buildFilledTiles(juntosPhotos, cols * rows)
  }, [juntosPhotos, energySaver])

  const gridSize = energySaver ? 6 : 7

  return (
    <section id="inicio" className={`section ${styles.hero}`}>
      <div className={`section-inner ${styles.heroInner}`}>
        <div className={styles.content}>
          <span className={styles.kitty}>Para Gaby, de Jeff</span>
          <h1 className={styles.title}>Querida Gaby, bienvenida! 🍃💎🌦️💗🤲🌺💞</h1>
          <p className={styles.subtitle}>
            He creado con mucho cariño este hermoso recopilatorio de nuestros recuerdos juntos, todo
            esto describe lo mucho que te aprecio y lo enormemente feliz que me haces cada día 🤲💗
          </p>
          <div className={styles.actions}>
            <a className={`btn ${styles.enter}`} href="#experiencia">
              Entrar al viaje
            </a>
            <a className="btn ghost" href="#carta">
              Ver invitación
            </a>
          </div>
        </div>

        <div className={`${styles.heroArt} ${energySaver ? styles.energySave : ''}`} aria-hidden="true">
          <div className={styles.heartGlow} />
          <div className={styles.heartShell}>
            {heartTiles.length > 0 ? (
              <div
                className={styles.heartGrid}
                style={{ '--cols': String(gridSize), '--rows': String(gridSize) }}
              >
                {heartTiles.map((photo, index) => (
                  <span key={photo.tileKey} className={styles.tile}>
                    <img
                      src={photo.src}
                      alt=""
                      loading={index < 8 ? 'eager' : 'lazy'}
                      decoding="async"
                    />
                  </span>
                ))}
              </div>
            ) : (
              <div className={styles.heartFallback}>Gaby + Jeff</div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
