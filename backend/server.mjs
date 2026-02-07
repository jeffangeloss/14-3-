import cors from 'cors'
import express from 'express'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

const webPhotosDir = path.join(rootDir, 'public', 'photos', 'web')
const notesPath = path.join(rootDir, 'backend', 'photo-notes.json')
const distDir = path.join(rootDir, 'dist')
const distIndexPath = path.join(distDir, 'index.html')

const port = Number(process.env.PORT ?? 8787)
const refreshMs = Math.max(5000, Number(process.env.REINDEX_MS ?? 15000))

const imageExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif'])
const ruiTokens = new Set([
  'rui',
  'ruinene',
  'kamishiro',
  'chishiya',
  'shuntarou',
  'shuntaro',
  'garcello',
  'miku',
  'roblox',
  'kaorima'
])

const app = express()
app.use(cors())
app.use(express.json())

const clamp = (value, min, max) => Math.max(min, Math.min(max, value))

const safeReadJson = async (targetPath, fallback) => {
  try {
    const content = await fs.readFile(targetPath, 'utf8')
    return JSON.parse(content)
  } catch {
    return fallback
  }
}

const fileExists = async (targetPath) => {
  try {
    await fs.access(targetPath)
    return true
  } catch {
    return false
  }
}

const isImageFile = (fileName) => imageExtensions.has(path.extname(fileName).toLowerCase())

const humanizeTitle = (fileName) => {
  const base = path.basename(fileName, path.extname(fileName))
  return base.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim() || fileName
}

const detectTheme = (fileName, relativePath) => {
  const source = `${relativePath} ${fileName}`.toLowerCase()
  const noExt = source.replace(path.extname(source), '')
  const first = noExt.match(/[a-z]+/)
  return first ? first[0] : 'general'
}

const detectCollection = (theme, relativePath, fileName) => {
  const source = `${relativePath} ${fileName}`.toLowerCase().replaceAll('\\', '/')
  if (source.includes('/rui/') || source.startsWith('rui/')) return 'rui'

  for (const token of ruiTokens) {
    if (theme === token || source.includes(token)) return 'rui'
  }

  return 'main'
}

const encodeSrc = (relativePath) => {
  const segments = relativePath.split('/').map((segment) => encodeURIComponent(segment))
  return `/media/web/${segments.join('/')}`
}

const readWebFiles = async (baseDir, relativeDir = '') => {
  let entries = []
  try {
    entries = await fs.readdir(path.join(baseDir, relativeDir), { withFileTypes: true })
  } catch {
    return []
  }

  const rows = []

  for (const entry of entries) {
    const nextRelative = path.join(relativeDir, entry.name)

    if (entry.isDirectory()) {
      const nested = await readWebFiles(baseDir, nextRelative)
      rows.push(...nested)
      continue
    }

    if (!entry.isFile() || !isImageFile(entry.name)) continue

    const fullPath = path.join(baseDir, nextRelative)
    const stats = await fs.stat(fullPath)

    rows.push({
      relativePath: nextRelative.replaceAll('\\', '/'),
      fileName: entry.name,
      modifiedAt: stats.mtime.toISOString(),
      size: stats.size
    })
  }

  return rows
}

let cache = {
  updatedAt: null,
  photos: [],
  bestPhotoId: null
}
let lastIndexAt = 0

const reindex = async () => {
  const [notes, files] = await Promise.all([safeReadJson(notesPath, {}), readWebFiles(webPhotosDir)])

  files.sort((a, b) => a.relativePath.localeCompare(b.relativePath, 'en', { numeric: true }))

  const photos = files.map((file, index) => {
    const theme = detectTheme(file.fileName, file.relativePath)
    const collection = detectCollection(theme, file.relativePath, file.fileName)

    const noteKeyByCollection = `${collection}/${file.fileName}`
    const noteKeyByPath = file.relativePath
    const noteData = notes[noteKeyByCollection] ?? notes[noteKeyByPath] ?? notes[file.fileName] ?? {}

    const finalCollection = noteData.collection ?? collection
    const finalTheme = noteData.theme ?? theme

    return {
      id: `p${index + 1}`,
      fileName: file.fileName,
      relativePath: file.relativePath,
      src: encodeSrc(file.relativePath),
      title: noteData.title ?? humanizeTitle(file.fileName),
      caption: noteData.caption ?? '',
      alt: noteData.alt ?? `Foto ${index + 1}`,
      note: noteData.note ?? '',
      tags: Array.isArray(noteData.tags) ? noteData.tags : [],
      collection: finalCollection,
      theme: finalTheme,
      size: file.size,
      modifiedAt: file.modifiedAt,
      score: file.size
    }
  })

  const ranked = [...photos].sort((a, b) => b.score - a.score)
  const rankMap = new Map(ranked.map((item, index) => [item.id, index + 1]))

  cache = {
    updatedAt: new Date().toISOString(),
    photos: photos.map((photo) => ({ ...photo, featuredRank: rankMap.get(photo.id) })),
    bestPhotoId: ranked[0]?.id ?? null
  }

  lastIndexAt = Date.now()
}

const ensureFreshIndex = async () => {
  if (!cache.updatedAt || Date.now() - lastIndexAt >= refreshMs) {
    await reindex()
  }
}

const filterPhotos = ({ collection, theme }) => {
  let list = cache.photos

  if (collection === 'main' || collection === 'rui') {
    list = list.filter((photo) => photo.collection === collection)
  }

  if (collection === 'featured') {
    list = [...cache.photos]
      .sort((a, b) => (a.featuredRank ?? 999999) - (b.featuredRank ?? 999999))
      .slice(0, 80)
  }

  if (theme && theme !== 'all') {
    list = list.filter((photo) => photo.theme === theme)
  }

  return list
}

app.get('/api/health', async (_req, res, next) => {
  try {
    await ensureFreshIndex()
    res.json({ ok: true, total: cache.photos.length, updatedAt: cache.updatedAt })
  } catch (error) {
    next(error)
  }
})

app.get('/api/reindex', async (_req, res, next) => {
  try {
    await reindex()
    res.json({ ok: true, total: cache.photos.length, updatedAt: cache.updatedAt })
  } catch (error) {
    next(error)
  }
})

app.get('/api/photos', async (req, res, next) => {
  try {
    await ensureFreshIndex()

    const collection = String(req.query.collection ?? 'all')
    const theme = String(req.query.theme ?? 'all')
    const limit = clamp(Number(req.query.limit ?? 24), 1, 80)
    const cursor = Math.max(0, Number(req.query.cursor ?? 0))

    const source = filterPhotos({ collection, theme })
    const items = source.slice(cursor, cursor + limit)
    const nextCursor = cursor + limit < source.length ? cursor + limit : null

    res.json({
      items,
      nextCursor,
      total: source.length,
      limit,
      collection,
      theme,
      bestPhotoId: cache.bestPhotoId,
      updatedAt: cache.updatedAt
    })
  } catch (error) {
    next(error)
  }
})

app.get('/api/collections', async (_req, res, next) => {
  try {
    await ensureFreshIndex()
    const allTotal = cache.photos.length
    const mainTotal = cache.photos.filter((photo) => photo.collection === 'main').length
    const ruiTotal = cache.photos.filter((photo) => photo.collection === 'rui').length

    res.json({
      collections: [
        { id: 'all', label: 'Todo', total: allTotal },
        { id: 'featured', label: 'Destacadas', total: Math.min(80, allTotal) },
        { id: 'main', label: 'Principal', total: mainTotal },
        { id: 'rui', label: 'Rui', total: ruiTotal }
      ],
      updatedAt: cache.updatedAt
    })
  } catch (error) {
    next(error)
  }
})

app.get('/api/themes', async (_req, res, next) => {
  try {
    await ensureFreshIndex()
    const counts = new Map()

    for (const photo of cache.photos) {
      const key = photo.theme || 'general'
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }

    const themes = [{ id: 'all', label: 'Todas', total: cache.photos.length }]
    for (const [id, total] of [...counts.entries()].sort((a, b) => b[1] - a[1])) {
      themes.push({ id, label: id, total })
    }

    res.json({ themes, updatedAt: cache.updatedAt })
  } catch (error) {
    next(error)
  }
})

app.use('/media/web', express.static(webPhotosDir, { maxAge: '7d' }))

if (await fileExists(distIndexPath)) {
  app.use(express.static(distDir))
  app.get(/^(?!\/api|\/media).*/, (_req, res) => {
    res.sendFile(distIndexPath)
  })
}

app.use((error, _req, res, _next) => {
  res.status(500).json({ ok: false, error: error.message })
})

await reindex()

const server = app.listen(port, () => {
  console.log(`Photo API listening on http://localhost:${port}`)
})

server.on('error', (error) => {
  console.error('Photo API failed:', error)
  process.exitCode = 1
})
