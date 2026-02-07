import { useEffect, useMemo, useState } from 'react'
import Lightbox from './Lightbox'
import Pebble from './Pebble'
import styles from './ImmersiveGallery.module.css'

const apiBase = import.meta.env.VITE_API_BASE_URL ?? ''
const immersiveLimit = 36

const chunk = (list, size) => {
  const rows = []
  for (let index = 0; index < list.length; index += size) rows.push(list.slice(index, index + size))
  return rows
}

export default function ImmersiveGallery() {
  const [items, setItems] = useState([])
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    const loadPhotos = async () => {
      try {
        const response = await fetch(
          `${apiBase}/api/photos?collection=featured&limit=${immersiveLimit}&cursor=0`
        )

        if (!response.ok) throw new Error('No se pudo cargar la experiencia inmersiva.')

        const payload = await response.json()
        if (cancelled) return
        setItems(Array.isArray(payload.items) ? payload.items : [])
        setError('')
      } catch {
        if (!cancelled) setError('No se pudo cargar la experiencia inmersiva.')
      }
    }

    loadPhotos()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (items.length === 0) return undefined

    const id = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % items.length)
    }, 2800)

    return () => window.clearInterval(id)
  }, [items])

  const mosaic = useMemo(() => items.slice(0, 16), [items])
  const ribbons = useMemo(() => chunk(items.slice(16, 40), 8), [items])
  const orbit = useMemo(() => items.slice(4, 16), [items])
  const spotlight = items[activeIndex] ?? items[0] ?? null

  return (
    <section id="experiencia" className={styles.wrap}>
      <header className={`section-inner ${styles.header}`}>
        <span className="pill">Experiencia inmersiva</span>
        <h2>Un viaje mas grande, vivo y sorprendente</h2>
        <p>
          Ahora no esta todo comprimido en un solo bloque: son 3 escenas distintas, cada una con
          su propio movimiento y escala.
        </p>
        <div className={styles.actions}>
          <a className="btn" href="#experiencia-carrusel">
            Ver carrusel vivo
          </a>
          <a className="btn ghost" href="#recuerdos">
            Ir a recuerdos
          </a>
        </div>
      </header>

      <section className={styles.sceneOne} aria-label="Mosaico animado">
        <div className={`section-inner ${styles.sceneInner}`}>
          <h3>Mosaico vivo</h3>
          <div className={styles.mosaicGrid}>
            {mosaic.map((photo, index) => (
              <button
                key={photo.id}
                type="button"
                className={styles.mosaicCard}
                style={{ '--delay': `${index * 90}ms` }}
                onClick={() => setSelectedPhoto(photo)}
                aria-label={`Abrir ${photo.title ?? photo.alt}`}
              >
                <img src={photo.src} alt={photo.alt} loading="lazy" />
                <span>{photo.title ?? photo.alt}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section id="experiencia-carrusel" className={styles.sceneTwo} aria-label="Cintas de fotos en movimiento">
        <h3 className="sr-only">Cintas en movimiento</h3>
        {ribbons.map((row, rowIndex) => (
          <div
            key={`row-${rowIndex}`}
            className={`${styles.ribbon} ${rowIndex % 2 === 1 ? styles.reverse : ''}`}
          >
            {[...row, ...row].map((photo, index) => (
              <button
                key={`${photo.id}-${index}`}
                type="button"
                className={styles.ribbonCard}
                onClick={() => setSelectedPhoto(photo)}
                aria-label={`Abrir ${photo.title ?? photo.alt}`}
              >
                <img src={photo.src} alt={photo.alt} loading="lazy" />
              </button>
            ))}
          </div>
        ))}
      </section>

      <section className={styles.sceneThree} aria-label="Orbita de recuerdos">
        <div className={`section-inner ${styles.sceneInnerThree}`}>
          <div className={styles.spotlightBox}>
            <h3>Orbita romantica</h3>
            <p>Una foto principal cambia sola y gira con sus recuerdos alrededor.</p>
            {spotlight ? (
              <button
                type="button"
                className={styles.spotlightCard}
                onClick={() => setSelectedPhoto(spotlight)}
                aria-label={`Abrir ${spotlight.title ?? spotlight.alt}`}
              >
                <img src={spotlight.src} alt={spotlight.alt} loading="lazy" />
                <span>{spotlight.title ?? spotlight.alt}</span>
              </button>
            ) : (
              <div className={styles.placeholder}>Cargando fotos...</div>
            )}
          </div>

          <div className={styles.orbitShell} aria-hidden="true">
            <div className={styles.orbitRing}>
              {orbit.map((photo, index) => {
                const angle = (360 / Math.max(orbit.length, 1)) * index
                return (
                  <button
                    key={`orbit-${photo.id}`}
                    type="button"
                    className={styles.orbitThumb}
                    style={{ '--angle': `${angle}deg` }}
                    onClick={() => setSelectedPhoto(photo)}
                    aria-label={`Abrir ${photo.title ?? photo.alt}`}
                  >
                    <img src={photo.src} alt={photo.alt} loading="lazy" />
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {error && (
        <div className={`section-inner ${styles.error}`} role="status">
          {error}
        </div>
      )}

      <Pebble
        id="pebble-2"
        message="Piedrita escondida entre las luces"
        className={styles.pebbleTwo}
      />
      <Pebble
        id="pebble-3"
        message="Otra piedrita encontrada"
        className={styles.pebbleThree}
      />

      <Lightbox photo={selectedPhoto} onClose={() => setSelectedPhoto(null)} />
    </section>
  )
}
