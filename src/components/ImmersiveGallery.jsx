import { useEffect, useMemo, useRef, useState } from 'react'
import styles from './ImmersiveGallery.module.css'
import { usePhotoCatalog } from '../hooks/usePhotoCatalog'

const chunk = (list, size) => {
  const rows = []
  for (let index = 0; index < list.length; index += size) rows.push(list.slice(index, index + size))
  return rows
}

const interleaveByCategory = (photos) => {
  const buckets = new Map()
  for (const photo of photos) {
    const key = `${photo.collection ?? 'main'}-${photo.theme ?? 'general'}`
    if (!buckets.has(key)) buckets.set(key, [])
    buckets.get(key).push(photo)
  }

  const lists = [...buckets.values()].sort((a, b) => b.length - a.length)
  const mixed = []
  let added = true

  while (added) {
    added = false
    for (const list of lists) {
      const photo = list.shift()
      if (!photo) continue
      mixed.push(photo)
      added = true
    }
  }

  return mixed
}

const createHeartPoint = (t, scale) => {
  const x = 16 * Math.sin(t) ** 3
  const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)

  return {
    x: x * 17 * scale,
    y: -y * 13.6 * scale
  }
}

const buildHeartPoints = (count) => {
  if (count <= 0) return []

  const layerScales =
    count > 120 ? [1, 0.84, 0.68, 0.52] : count > 84 ? [1, 0.84, 0.68] : count > 42 ? [1, 0.78] : [1]
  const density = Math.max(0.52, Math.min(1, 56 / count))

  const points = []
  let assigned = 0

  for (let layerIndex = 0; layerIndex < layerScales.length; layerIndex += 1) {
    const scale = layerScales[layerIndex]
    const remaining = count - assigned
    if (remaining <= 0) break

    const layersLeft = layerScales.length - layerIndex
    const amount = Math.max(1, Math.round(remaining / layersLeft))

    for (let index = 0; index < amount && assigned < count; index += 1) {
      const t = (Math.PI * 2 * index) / amount
      const base = createHeartPoint(t, scale)
      const layerSoftness = 1 - scale

      points.push({
        x: base.x + Math.sin(index * 1.73 + layerIndex) * 9 * layerSoftness,
        y: base.y + Math.cos(index * 1.31 + layerIndex) * 8 * layerSoftness,
        layer: layerIndex,
        floatX: ((assigned * 7) % 20) - 10,
        floatY: ((assigned * 11) % 18) - 9,
        size: Math.max(44, Math.round((118 - layerIndex * 20 + ((assigned * 3) % 8) - 4) * density))
      })
      assigned += 1
    }
  }

  return points
}

const buildScenes = (photos) => {
  if (photos.length === 0) {
    return { mosaic: [], ribbons: [], orbit: [], heart: [] }
  }

  // Ensure every uploaded photo appears at least once in the living mosaic.
  const mosaic = [...photos]

  const ribbonPoolSize = Math.min(112, photos.length)
  const ribbons = chunk(photos.slice(0, ribbonPoolSize), 14).filter((row) => row.length > 0)

  const orbit = photos.slice(0, Math.min(14, photos.length))

  const heartTarget = Math.min(64, Math.max(22, Math.round(photos.length * 0.28)))
  const heart = photos.slice(0, heartTarget)

  return {
    mosaic,
    ribbons,
    orbit,
    heart
  }
}

export default function ImmersiveGallery({ energySaver = false }) {
  const { photos, error } = usePhotoCatalog()
  const [activeIndex, setActiveIndex] = useState(0)
  const [ribbonShift, setRibbonShift] = useState([])
  const ribbonViewportRefs = useRef([])
  const ribbonTrackRefs = useRef([])

  const lowMotion = energySaver
  const items = useMemo(() => interleaveByCategory(photos), [photos])
  const { mosaic, ribbons, orbit, heart } = useMemo(() => buildScenes(items), [items])
  const displayRibbons = ribbons
  const displayOrbit = orbit
  const displayHeart = heart

  useEffect(() => {
    if (items.length === 0 || lowMotion) return undefined

    const id = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % items.length)
    }, 2600)

    return () => window.clearInterval(id)
  }, [items, lowMotion])

  const heartPoints = useMemo(() => buildHeartPoints(displayHeart.length), [displayHeart.length])
  const spotlight = items[activeIndex] ?? items[0] ?? null

  useEffect(() => {
    if (lowMotion) return () => {}

    const updateRibbonShift = () => {
      const next = displayRibbons.map((_, index) => {
        const viewport = ribbonViewportRefs.current[index]
        const track = ribbonTrackRefs.current[index]
        if (!viewport || !track) return 0
        return Math.max(0, track.scrollWidth - viewport.clientWidth)
      })
      setRibbonShift(next)
    }

    updateRibbonShift()
    window.addEventListener('resize', updateRibbonShift)
    return () => window.removeEventListener('resize', updateRibbonShift)
  }, [displayRibbons, lowMotion])

  return (
    <section id="experiencia" className={`${styles.wrap} ${energySaver ? styles.energySave : ''}`}>
      <header className={`section-inner ${styles.header}`}>
        <span className="pill">Experiencia inmersiva</span>
        <h2>Mosaico vivo de recuerdos</h2>
        <p>Las fotos aparecen completas y cada una se muestra al menos una vez.</p>
        <p>Desliza para ver carruseles, órbita y corazón.</p>
        <div className={styles.actions}>
          <a className="btn" href="#experiencia-carrusel">
            Ver carrusel vivo
          </a>
          <a className="btn ghost" href="#carta">
            Ir a invitación
          </a>
        </div>
      </header>

      <section className={styles.sceneOne} aria-label="Mosaico animado">
        <div className={`section-inner ${styles.sceneInner}`}>
          <h3>Mosaico vivo</h3>
          <div className={styles.mosaicGrid}>
            {mosaic.map((photo, index) => (
              <article key={photo.id} className={styles.mosaicCard} style={{ '--delay': `${index * 70}ms` }}>
                <img
                  src={photo.src}
                  alt=""
                  loading={index < 16 ? 'eager' : 'lazy'}
                  decoding="async"
                />
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="experiencia-carrusel" className={styles.sceneTwo} aria-label="Carruseles de fotos en movimiento">
        <h3 className="sr-only">Carruseles sin repeticion</h3>
        {displayRibbons.map((row, rowIndex) => {
          const shift = ribbonShift[rowIndex] ?? 0
          const staticRow = lowMotion || shift < 12

          return (
            <div
              key={`row-${rowIndex}`}
              className={styles.ribbonViewport}
              ref={(node) => {
                ribbonViewportRefs.current[rowIndex] = node
              }}
            >
              <div
                className={`${styles.ribbonTrack} ${rowIndex % 2 === 1 ? styles.reverse : ''} ${staticRow ? styles.static : ''}`}
                style={{
                  '--shift': `${shift}px`,
                  '--duration': `${32 + rowIndex * 4}s`
                }}
                ref={(node) => {
                  ribbonTrackRefs.current[rowIndex] = node
                }}
              >
                {row.map((photo) => (
                  <article key={photo.id} className={styles.ribbonCard}>
                    <img src={photo.src} alt="" loading="lazy" decoding="async" />
                  </article>
                ))}
              </div>
            </div>
          )
        })}
      </section>

      <section className={styles.sceneThree} aria-label="Orbita de recuerdos">
        <div className={`section-inner ${styles.sceneInnerThree}`}>
          <div className={styles.spotlightBox}>
            <h3>Fotos orbitantes</h3>
            <p>Un foco principal con recuerdos girando alrededor.</p>
            {spotlight ? (
              <div className={styles.spotlightCard}>
                <img src={spotlight.src} alt="" loading="lazy" decoding="async" />
              </div>
            ) : (
              <div className={styles.placeholder}>Cargando fotos...</div>
            )}
          </div>

          <div className={styles.orbitShell} aria-hidden="true">
            <div className={styles.orbitRing}>
              {displayOrbit.map((photo, index) => {
                const angle = (360 / Math.max(displayOrbit.length, 1)) * index
                return (
                  <div key={`orbit-${photo.id}`} className={styles.orbitThumb} style={{ '--angle': `${angle}deg` }}>
                    <img src={photo.src} alt="" loading="lazy" decoding="async" />
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      <section className={styles.sceneFour} aria-label="Constelacion de fotos en forma de corazon">
        <div className={`section-inner ${styles.sceneInnerHeart}`}>
          <h3>Un corazón construido por nuestros recuerdos</h3>
          <span className={styles.heartCount}>{heart.length} recuerdos latiendo al mismo tiempo</span>
          <div className={styles.heartStage}>
            <div className={styles.heartGlow} />
            <div className={styles.heartHalo} />
            {displayHeart.map((photo, index) => {
              const point = heartPoints[index] ?? { x: 0, y: 0, layer: 0, floatX: 0, floatY: 0, size: 84 }
              return (
                <div
                  key={`heart-${photo.id}`}
                  className={styles.heartNode}
                  style={{
                    '--tx': `${point.x}px`,
                    '--ty': `${point.y}px`,
                    '--fx': `${point.floatX}px`,
                    '--fy': `${point.floatY}px`,
                    '--size': `${point.size}px`,
                    '--delay': `${index * 90}ms`,
                    '--duration': `${4.2 + point.layer * 0.8 + (index % 5) * 0.35}s`,
                    '--tilt': `${index % 2 === 0 ? -6 : 6}deg`
                  }}
                >
                  <img src={photo.src} alt="" loading="lazy" decoding="async" />
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {error && (
        <div className={`section-inner ${styles.error}`} role="status">
          {error}
        </div>
      )}
    </section>
  )
}
