import { useEffect, useMemo, useRef, useState } from 'react'
import Lightbox from './Lightbox'
import Pebble from './Pebble'
import styles from './ImmersiveGallery.module.css'

const apiBase = import.meta.env.VITE_API_BASE_URL ?? ''
const pageSize = 80
const maxPages = 8

const chunk = (list, size) => {
  const rows = []
  for (let index = 0; index < list.length; index += size) rows.push(list.slice(index, index + size))
  return rows
}

const uniqueById = (list) => {
  const seen = new Set()
  const result = []
  for (const item of list) {
    if (seen.has(item.id)) continue
    seen.add(item.id)
    result.push(item)
  }
  return result
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
  const y =
    13 * Math.cos(t) -
    5 * Math.cos(2 * t) -
    2 * Math.cos(3 * t) -
    Math.cos(4 * t)

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
  const mosaic = photos.slice(0, Math.min(24, photos.length))
  const ribbons = chunk(photos, 14).filter((row) => row.length > 0)
  const orbitStart = Math.floor(photos.length * 0.22)
  const orbit = photos.slice(orbitStart, orbitStart + Math.min(16, photos.length))
  const heart = photos

  return {
    mosaic: mosaic.length > 0 ? mosaic : photos.slice(0, Math.min(12, photos.length)),
    ribbons:
      ribbons.length > 0
        ? ribbons
        : chunk(photos.slice(0, Math.min(24, photos.length)), 8).filter((row) => row.length > 0),
    orbit: orbit.length > 0 ? orbit : photos.slice(0, Math.min(10, photos.length)),
    heart: heart.length > 0 ? heart : photos.slice(0, Math.min(14, photos.length))
  }
}

export default function ImmersiveGallery() {
  const [items, setItems] = useState([])
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [error, setError] = useState('')
  const [ribbonShift, setRibbonShift] = useState([])
  const ribbonViewportRefs = useRef([])
  const ribbonTrackRefs = useRef([])

  useEffect(() => {
    let cancelled = false

    const loadPhotos = async () => {
      try {
        let cursor = 0
        let page = 0
        const merged = []

        while (page < maxPages) {
          const query = new URLSearchParams({
            collection: 'all',
            limit: String(pageSize),
            cursor: String(cursor)
          })

          const response = await fetch(`${apiBase}/api/photos?${query.toString()}`)
          if (!response.ok) throw new Error('No se pudo cargar la experiencia inmersiva.')

          const payload = await response.json()
          const received = Array.isArray(payload.items) ? payload.items : []

          if (received.length === 0) break
          merged.push(...received)

          if (payload.nextCursor === null || payload.nextCursor === undefined) break
          if (Number(payload.nextCursor) === cursor) break

          cursor = Number(payload.nextCursor)
          page += 1
        }

        if (cancelled) return
        const arranged = interleaveByCategory(uniqueById(merged))
        setItems(arranged)
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
    }, 2600)

    return () => window.clearInterval(id)
  }, [items])

  const { mosaic, ribbons, orbit, heart } = useMemo(() => buildScenes(items), [items])
  const heartPoints = useMemo(() => buildHeartPoints(heart.length), [heart.length])
  const spotlight = items[activeIndex] ?? items[0] ?? null

  useEffect(() => {
    const updateRibbonShift = () => {
      const next = ribbons.map((_, index) => {
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
  }, [ribbons])

  return (
    <section id="experiencia" className={styles.wrap}>
      <header className={`section-inner ${styles.header}`}>
        <span className="pill">Experiencia inmersiva</span>
        <h2>Todas las fotos vivas en una experiencia romantica que no se detiene</h2>
        <p>
          Fondo en movimiento constante por toda la pagina, mosaicos con mas variedad y un corazon
          gigante que late con todos los recuerdos.
        </p>
        <span className={styles.counter}>{items.length} fotos cargadas</span>
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
                style={{ '--delay': `${index * 70}ms` }}
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

      <section
        id="experiencia-carrusel"
        className={styles.sceneTwo}
        aria-label="Carruseles de fotos en movimiento"
      >
        <h3 className="sr-only">Carruseles sin repeticion</h3>
        {ribbons.map((row, rowIndex) => {
          const shift = ribbonShift[rowIndex] ?? 0
          const staticRow = shift < 12

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
                  <button
                    key={photo.id}
                    type="button"
                    className={styles.ribbonCard}
                    onClick={() => setSelectedPhoto(photo)}
                    aria-label={`Abrir ${photo.title ?? photo.alt}`}
                  >
                    <img src={photo.src} alt={photo.alt} loading="lazy" />
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </section>

      <section className={styles.sceneThree} aria-label="Orbita de recuerdos">
        <div className={`section-inner ${styles.sceneInnerThree}`}>
          <div className={styles.spotlightBox}>
            <h3>Orbita romantica</h3>
            <p>Foto protagonista cambiante con una orbita de recuerdos alrededor.</p>
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

      <section className={styles.sceneFour} aria-label="Constelacion de fotos en forma de corazon">
        <div className={`section-inner ${styles.sceneInnerHeart}`}>
          <h3>Corazon gigante en movimiento</h3>
          <p>Todos los recuerdos laten juntos en una constelacion romantica mas grande y visible.</p>
          <span className={styles.heartCount}>{heart.length} recuerdos latiendo al mismo tiempo</span>
          <div className={styles.heartStage}>
            <div className={styles.heartGlow} />
            <div className={styles.heartHalo} />
            {heart.map((photo, index) => {
              const point = heartPoints[index] ?? { x: 0, y: 0, layer: 0, floatX: 0, floatY: 0, size: 84 }
              return (
                <button
                  key={`heart-${photo.id}`}
                  type="button"
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
                  onClick={() => setSelectedPhoto(photo)}
                  aria-label={`Abrir ${photo.title ?? photo.alt}`}
                >
                  <img src={photo.src} alt={photo.alt} loading="lazy" />
                </button>
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
