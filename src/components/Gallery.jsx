import { useCallback, useEffect, useRef, useState } from 'react'
import Lightbox from './Lightbox'
import Pebble from './Pebble'
import styles from './Gallery.module.css'

const pageSize = 18
const apiBase = import.meta.env.VITE_API_BASE_URL ?? ''

const defaultCollections = [
  { id: 'all', label: 'Todo', total: 0 },
  { id: 'featured', label: 'Destacadas', total: 0 },
  { id: 'main', label: 'Principal', total: 0 },
  { id: 'rui', label: 'Rui', total: 0 }
]

const defaultThemes = [{ id: 'all', label: 'Todas', total: 0 }]

export default function Gallery() {
  const [items, setItems] = useState([])
  const [cursor, setCursor] = useState(0)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const [collection, setCollection] = useState('all')
  const [theme, setTheme] = useState('all')
  const [collections, setCollections] = useState(defaultCollections)
  const [themes, setThemes] = useState(defaultThemes)
  const [bestPhoto, setBestPhoto] = useState(null)
  const loadingRef = useRef(false)

  const fetchMeta = useCallback(async () => {
    try {
      const [collectionsRes, themesRes, featuredRes] = await Promise.all([
        fetch(`${apiBase}/api/collections`),
        fetch(`${apiBase}/api/themes`),
        fetch(`${apiBase}/api/photos?collection=featured&limit=1&cursor=0`)
      ])

      if (collectionsRes.ok) {
        const payload = await collectionsRes.json()
        if (Array.isArray(payload.collections) && payload.collections.length > 0) {
          setCollections(payload.collections)
        }
      }

      if (themesRes.ok) {
        const payload = await themesRes.json()
        if (Array.isArray(payload.themes) && payload.themes.length > 0) {
          setThemes(payload.themes)
        }
      }

      if (featuredRes.ok) {
        const payload = await featuredRes.json()
        setBestPhoto(payload.items?.[0] ?? null)
      }
    } catch {
      // Keep defaults if metadata fetch fails.
    }
  }, [])

  const fetchPage = useCallback(async ({ reset, cursorValue, collectionValue, themeValue }) => {
    if (loadingRef.current) return

    loadingRef.current = true
    setLoading(true)
    setError('')

    try {
      const query = new URLSearchParams({
        collection: collectionValue,
        theme: themeValue,
        limit: String(pageSize),
        cursor: String(cursorValue)
      })

      const response = await fetch(`${apiBase}/api/photos?${query.toString()}`)

      if (!response.ok) {
        throw new Error('No se pudo cargar la galeria desde el backend.')
      }

      const payload = await response.json()
      setItems((prev) => (reset ? payload.items : [...prev, ...payload.items]))
      setCursor(payload.nextCursor)
      setTotal(payload.total)
    } catch (fetchError) {
      setError(fetchError.message)
    } finally {
      loadingRef.current = false
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMeta()
  }, [fetchMeta])

  useEffect(() => {
    setCursor(0)
    fetchPage({ reset: true, cursorValue: 0, collectionValue: collection, themeValue: theme })
  }, [collection, theme, fetchPage])

  const hasMore = cursor !== null

  const handleLoadMore = () => {
    if (cursor === null) return
    fetchPage({ reset: false, cursorValue: cursor, collectionValue: collection, themeValue: theme })
  }

  return (
    <section id="galeria" className={`section ${styles.gallery}`}>
      <div className="section-inner">
        <div className="section-header">
          <div>
            <h2 className="section-title">Tunel 3D de recuerdos</h2>
            <p className="section-subtitle">
              Modo exploracion: carga incremental desde backend, filtros por coleccion y tematica.
            </p>
          </div>
          <div className={styles.controls}>
            <label htmlFor="collection" className={styles.label}>
              Coleccion
            </label>
            <select
              id="collection"
              className={styles.select}
              value={collection}
              onChange={(event) => setCollection(event.target.value)}
            >
              {collections.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label} ({option.total})
                </option>
              ))}
            </select>
          </div>
        </div>

        {bestPhoto && (
          <button
            type="button"
            className={styles.bestCard}
            onClick={() => setSelectedPhoto(bestPhoto)}
            aria-label="Abrir foto destacada"
          >
            <img src={bestPhoto.src} alt={bestPhoto.alt} loading="lazy" />
            <div className={styles.bestInfo}>
              <span className="pill">Foto destacada</span>
              <h3>{bestPhoto.title}</h3>
              <p>{bestPhoto.collection} · {bestPhoto.theme}</p>
            </div>
          </button>
        )}

        <div className={styles.themeRow}>
          {themes.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`${styles.themeChip} ${theme === option.id ? styles.themeChipActive : ''}`}
              onClick={() => setTheme(option.id)}
            >
              {option.label} ({option.total})
            </button>
          ))}
        </div>

        <div className={styles.statusRow}>
          <span className="pill">
            {items.length} / {total} fotos
          </span>
          <span className={styles.hint}>Click para ampliar</span>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.tunnelStage}>
          <div className={styles.tunnelLane}>
            {items.map((photo, index) => {
              const depth = index * 120
              const side = index % 2 === 0 ? -1 : 1
              const x = side * (60 + (index % 4) * 12)
              const rotate = side * -8

              return (
                <button
                  key={photo.id}
                  type="button"
                  className={styles.tunnelCard}
                  style={{
                    '--z': `${-depth}px`,
                    '--x': `${x}px`,
                    '--r': `${rotate}deg`
                  }}
                  onClick={() => setSelectedPhoto(photo)}
                  aria-label={`Abrir ${photo.title ?? photo.alt}`}
                >
                  <img src={photo.src} alt={photo.alt} loading="lazy" />
                  <div className={styles.captionWrap}>
                    <p className={styles.caption}>{photo.title ?? photo.caption}</p>
                    <span className={styles.tag}>{photo.theme}</span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <div className={styles.actions}>
          {hasMore && (
            <button type="button" className="btn" onClick={handleLoadMore} disabled={loading}>
              {loading ? 'Cargando...' : 'Cargar mas fotos'}
            </button>
          )}
        </div>
      </div>

      <Pebble
        id="pebble-2"
        message="Otra piedrita para tu coleccion"
        className={styles.pebbleTwo}
      />
      <Pebble
        id="pebble-3"
        message="Te ganaste un brillito extra"
        className={styles.pebbleThree}
      />

      <Lightbox photo={selectedPhoto} onClose={() => setSelectedPhoto(null)} />
    </section>
  )
}
