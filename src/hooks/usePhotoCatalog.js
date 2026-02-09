import { useEffect, useState } from 'react'

const apiBase = import.meta.env.VITE_API_BASE_URL ?? ''
const basePath = import.meta.env.BASE_URL ?? '/'
const pageSize = 80
const maxPages = 8
const cacheTtlMs = 5 * 60 * 1000

const toBasePath = (relativePath) => {
  const safeBase = basePath.endsWith('/') ? basePath : `${basePath}/`
  const safeRelative = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath
  return `${safeBase}${safeRelative}`
}

const localManifestPath = toBasePath('photos/web/_manifest.json')

const catalogCache = {
  items: [],
  fetchedAt: 0,
  pending: null
}

const warmedImages = new Set()

const uniqueById = (list) => {
  const seen = new Set()
  const result = []
  for (const item of list) {
    const key = item?.id ?? item?.src
    if (!key || seen.has(key)) continue
    seen.add(key)
    result.push(item)
  }
  return result
}

const hasFreshCache = () =>
  catalogCache.items.length > 0 && Date.now() - catalogCache.fetchedAt < cacheTtlMs

const safeTitle = (fileName, fallback) => {
  if (!fileName || typeof fileName !== 'string') return fallback
  return fileName
    .replace(/\.[^/.]+$/, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const encodePublicPhotoPath = (fileName) =>
  toBasePath(`photos/web/${encodeURIComponent(fileName)}`)

const isAbsoluteSource = (value) =>
  typeof value === 'string' &&
  (value.startsWith('/') || /^https?:\/\//i.test(value) || /^data:/i.test(value))

const normalizeSource = (source, fallbackFileName) => {
  if (typeof source === 'string' && source.trim().length > 0) {
    const raw = source.trim()
    if (isAbsoluteSource(raw)) return raw
    if (raw.startsWith('media/web/')) return `/${raw}`
    return encodePublicPhotoPath(raw)
  }

  return encodePublicPhotoPath(fallbackFileName)
}

const normalizeApiPhoto = (photo, index) => {
  const fallbackFileName = `foto-${index + 1}.jpg`
  const fileName = photo?.fileName ?? photo?.filename ?? fallbackFileName
  const src = normalizeSource(photo?.src ?? photo?.web ?? photo?.path, fileName)
  const title = photo?.title ?? safeTitle(fileName, `Foto ${index + 1}`)

  return {
    ...photo,
    id: photo?.id ?? `api-${index + 1}`,
    fileName,
    src,
    title,
    alt: photo?.alt ?? `Foto ${index + 1}`,
    caption: photo?.caption ?? '',
    note: photo?.note ?? '',
    collection: photo?.collection ?? 'main',
    theme: photo?.theme ?? 'general',
    tags: Array.isArray(photo?.tags) ? photo.tags : []
  }
}

const fetchAllPhotos = async () => {
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
    if (!response.ok) {
      throw new Error('No se pudo cargar el catalogo de fotos.')
    }

    const payload = await response.json()
    const received = Array.isArray(payload.items) ? payload.items : []

    if (received.length === 0) break
    merged.push(...received.map((photo, index) => normalizeApiPhoto(photo, merged.length + index)))

    if (payload.nextCursor === null || payload.nextCursor === undefined) break
    const nextCursor = Number(payload.nextCursor)
    if (!Number.isFinite(nextCursor) || nextCursor === cursor) break

    cursor = nextCursor
    page += 1
  }

  return uniqueById(merged)
}

const fetchLocalManifest = async () => {
  const response = await fetch(localManifestPath, { cache: 'no-store' })
  if (!response.ok) {
    throw new Error('No se pudo cargar el manifiesto local de fotos.')
  }

  const payload = await response.json()
  if (!Array.isArray(payload)) throw new Error('Manifiesto local invalido.')

  const items = payload
    .map((entry, index) => {
      if (typeof entry === 'string' && entry.trim().length > 0) {
        const fileName = entry.trim()
        return {
          id: `local-${index + 1}`,
          fileName,
          src: encodePublicPhotoPath(fileName),
          title: safeTitle(fileName, `Foto ${index + 1}`),
          caption: '',
          alt: `Foto ${index + 1}`,
          note: '',
          tags: [],
          collection: 'main',
          theme: 'general',
          featuredRank: index + 1
        }
      }

      if (entry && typeof entry === 'object') {
        const fileName = entry.fileName ?? entry.filename ?? entry.name ?? `foto-${index + 1}.jpg`
        const src = normalizeSource(entry.src ?? entry.web ?? entry.path, fileName)
        return {
          id: entry.id ?? `local-${index + 1}`,
          fileName,
          src,
          title: entry.title ?? safeTitle(fileName, `Foto ${index + 1}`),
          caption: entry.caption ?? '',
          alt: entry.alt ?? `Foto ${index + 1}`,
          note: entry.note ?? '',
          tags: Array.isArray(entry.tags) ? entry.tags : [],
          collection: entry.collection ?? 'main',
          theme: entry.theme ?? 'general',
          featuredRank: index + 1
        }
      }

      return null
    })
    .filter(Boolean)

  return uniqueById(items)
}

const loadCatalog = async () => {
  try {
    const localItems = await fetchLocalManifest()
    if (localItems.length > 0) return localItems
  } catch {
    // Fallback below.
  }

  try {
    const apiItems = await fetchAllPhotos()
    if (apiItems.length > 0) return apiItems
  } catch {
    // Fallback below.
  }

  throw new Error('No se pudieron cargar fotos desde el manifiesto local ni desde /api/photos.')
}

export const primePhotoCatalog = async ({ force = false } = {}) => {
  if (!force && hasFreshCache()) return catalogCache.items
  if (!force && catalogCache.pending) return catalogCache.pending

  catalogCache.pending = loadCatalog()
    .then((items) => {
      catalogCache.items = items
      catalogCache.fetchedAt = Date.now()
      return items
    })
    .finally(() => {
      catalogCache.pending = null
    })

  return catalogCache.pending
}

const preloadImage = async (src) => {
  if (!src || warmedImages.has(src)) return

  await new Promise((resolve) => {
    let settled = false
    const image = new Image()

    const done = () => {
      if (settled) return
      settled = true
      image.onload = null
      image.onerror = null
      warmedImages.add(src)
      resolve()
    }

    image.decoding = 'async'
    image.loading = 'eager'
    image.src = src

    if (typeof image.decode === 'function') {
      image.decode().then(done).catch(() => {})
    }

    image.onload = done
    image.onerror = done
  })
}

export const warmupPhotoAssets = async (
  photos,
  { limit = 28, concurrency = 4, onProgress } = {}
) => {
  const srcList = [...new Set((photos ?? []).map((photo) => photo?.src).filter(Boolean))].slice(
    0,
    Math.max(0, limit)
  )

  if (srcList.length === 0) {
    if (onProgress) onProgress(1, 0, 0)
    return
  }

  let cursor = 0
  let completed = 0

  const worker = async () => {
    while (cursor < srcList.length) {
      const current = srcList[cursor]
      cursor += 1
      await preloadImage(current)
      completed += 1
      if (onProgress) onProgress(completed / srcList.length, completed, srcList.length)
    }
  }

  const workers = Array.from(
    { length: Math.min(Math.max(1, concurrency), srcList.length) },
    () => worker()
  )
  await Promise.all(workers)
}

export function usePhotoCatalog() {
  const [photos, setPhotos] = useState(() => catalogCache.items)
  const [loading, setLoading] = useState(() => catalogCache.items.length === 0)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    const shouldRefresh = catalogCache.items.length === 0 || !hasFreshCache()
    if (!shouldRefresh) return () => {}

    primePhotoCatalog()
      .then((items) => {
        if (cancelled) return
        setPhotos(items)
        setError('')
      })
      .catch((loadError) => {
        if (cancelled) return
        const message =
          loadError instanceof Error ? loadError.message : 'No se pudo cargar el catalogo de fotos.'
        setError(message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const refresh = async () => {
    const items = await primePhotoCatalog({ force: true })
    setPhotos(items)
    setError('')
    return items
  }

  return { photos, loading, error, refresh }
}
