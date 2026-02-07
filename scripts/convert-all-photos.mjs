import { spawn } from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'
import convert from 'heic-convert'

const root = process.cwd()
const photosRoot = path.join(root, 'public', 'photos')
const outputDir = path.join(photosRoot, 'web')
const catalogPath = path.join(root, 'backend', 'photo-catalog.json')

const imageExtensions = new Set(['.jpg', '.jpeg', '.png', '.heic', '.heif'])
const managedDirNames = new Set(['all', 'gallery', 'web'])
const ruiKeywords = ['rui', 'kamishiro', 'chishiya', 'garcello']

const slug = (text) =>
  text
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/_+/g, '-')
    .toLowerCase() || 'general'

const pad = (value, size) => String(value).padStart(size, '0')

const parseDateFromName = (name) => {
  const match = name.match(/(20\d{2})(\d{2})(\d{2})[_-]?(\d{2})?(\d{2})?(\d{2})?/)
  if (!match) return null

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const hour = match[4] ? Number(match[4]) : 12
  const minute = match[5] ? Number(match[5]) : 0
  const second = match[6] ? Number(match[6]) : 0

  if (!year || !month || !day) return null
  return new Date(year, month - 1, day, hour, minute, second)
}

const runFfmpegToJpg = (input, output) =>
  new Promise((resolve, reject) => {
    const args = ['-hide_banner', '-y', '-i', input, '-frames:v', '1', '-q:v', '2', output]
    const proc = spawn('ffmpeg', args, { stdio: 'ignore' })
    proc.on('error', reject)
    proc.on('close', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`ffmpeg failed with code ${code}`))
    })
  })

const runFfprobe = (targetPath) =>
  new Promise((resolve) => {
    const args = [
      '-v',
      'error',
      '-select_streams',
      'v:0',
      '-show_entries',
      'stream=width,height',
      '-of',
      'json',
      targetPath
    ]

    const proc = spawn('ffprobe', args)
    let stdout = ''

    proc.stdout.on('data', (chunk) => {
      stdout += chunk.toString()
    })

    proc.on('error', () => resolve({ width: null, height: null }))
    proc.on('close', () => {
      try {
        const payload = JSON.parse(stdout)
        const stream = payload.streams?.[0]
        resolve({ width: stream?.width ?? null, height: stream?.height ?? null })
      } catch {
        resolve({ width: null, height: null })
      }
    })
  })

const collectFiles = async (baseDir, relativeDir = '', skipManaged = true) => {
  let entries = []
  try {
    entries = await fs.readdir(path.join(baseDir, relativeDir), { withFileTypes: true })
  } catch {
    return []
  }

  const files = []

  for (const entry of entries) {
    const entryRelative = path.join(relativeDir, entry.name)

    if (entry.isDirectory()) {
      if (skipManaged && managedDirNames.has(entry.name.toLowerCase())) continue
      const nested = await collectFiles(baseDir, entryRelative, skipManaged)
      files.push(...nested)
      continue
    }

    if (!entry.isFile()) continue

    const extension = path.extname(entry.name).toLowerCase()
    if (!imageExtensions.has(extension)) continue

    const fullPath = path.join(baseDir, entryRelative)
    const stats = await fs.stat(fullPath)

    files.push({
      fullPath,
      relativePath: entryRelative.replaceAll('\\', '/'),
      fileName: entry.name,
      extension,
      size: stats.size,
      date: parseDateFromName(entry.name) ?? stats.mtime
    })
  }

  return files
}

const detectCollection = (relativePath, fileName) => {
  const source = `${relativePath} ${fileName}`.toLowerCase()
  const match = ruiKeywords.some((keyword) => source.includes(keyword))
  return match ? 'rui' : 'main'
}

const detectTheme = (relativePath, collection) => {
  if (collection === 'rui') return 'rui'
  const parts = relativePath.split('/')
  if (parts.length > 1) {
    const first = parts[0].toLowerCase()
    if (!managedDirNames.has(first)) return slug(first)
  }
  return 'general'
}

const toTitle = (fileName) => {
  const base = path.basename(fileName, path.extname(fileName))
  return base.replace(/[_-]+/g, ' ').trim() || fileName
}

const buildCatalog = async () => {
  const sourceFiles = await collectFiles(photosRoot, '', true)
  const sourceMode = sourceFiles.length > 0 ? 'photos-root' : 'all-fallback'
  const fallbackFiles = sourceMode === 'photos-root' ? [] : await collectFiles(path.join(photosRoot, 'all'), '', false)
  const files = (sourceMode === 'photos-root' ? sourceFiles : fallbackFiles).sort(
    (a, b) => a.date - b.date || a.relativePath.localeCompare(b.relativePath, 'en', { numeric: true })
  )

  if (files.length === 0) {
    throw new Error('No image files were found in public/photos.')
  }

  await fs.rm(outputDir, { recursive: true, force: true })
  await fs.mkdir(outputDir, { recursive: true })

  const padSize = Math.max(4, String(files.length).length)
  const rows = []

  for (const [index, file] of files.entries()) {
    const outputName = `photo-${pad(index + 1, padSize)}.jpg`
    const outputPath = path.join(outputDir, outputName)

    if (file.extension === '.heic' || file.extension === '.heif') {
      const inputBuffer = await fs.readFile(file.fullPath)
      const outputBuffer = await convert({ buffer: inputBuffer, format: 'JPEG', quality: 0.92 })
      await fs.writeFile(outputPath, outputBuffer)
    } else if (file.extension === '.png') {
      await runFfmpegToJpg(file.fullPath, outputPath)
    } else {
      await fs.copyFile(file.fullPath, outputPath)
    }

    const outputStats = await fs.stat(outputPath)
    const dimensions = await runFfprobe(outputPath)
    const megapixels = dimensions.width && dimensions.height ? (dimensions.width * dimensions.height) / 1_000_000 : 0
    const sizeMb = outputStats.size / (1024 * 1024)
    const score = Number((megapixels * 10 + sizeMb).toFixed(3))

    const collection = detectCollection(file.relativePath, file.fileName)
    const theme = detectTheme(file.relativePath, collection)

    rows.push({
      id: `p${index + 1}`,
      fileName: outputName,
      src: `/media/web/${outputName}`,
      originalPath: file.relativePath,
      title: toTitle(file.fileName),
      caption: '',
      alt: `Foto ${index + 1}`,
      note: '',
      tags: [],
      collection,
      theme,
      dateISO: file.date.toISOString(),
      width: dimensions.width,
      height: dimensions.height,
      size: outputStats.size,
      score
    })
  }

  const featured = [...rows].sort((a, b) => b.score - a.score)
  const rankById = new Map(featured.map((item, index) => [item.id, index + 1]))

  const photos = rows.map((item) => ({
    ...item,
    featuredRank: rankById.get(item.id)
  }))

  const catalog = {
    generatedAt: new Date().toISOString(),
    sourceMode,
    total: photos.length,
    bestPhotoId: featured[0]?.id ?? null,
    photos
  }

  await fs.writeFile(catalogPath, JSON.stringify(catalog, null, 2), 'utf8')
  await fs.writeFile(path.join(outputDir, '_map.json'), JSON.stringify(photos, null, 2), 'utf8')

  const fallback = photos.slice(0, 60).map((photo) => ({
    id: photo.id,
    src: photo.src,
    alt: photo.alt,
    caption: photo.title,
    tag: photo.theme
  }))
  const fallbackJs = `export const photos = ${JSON.stringify(fallback, null, 2)}\n`
  await fs.writeFile(path.join(root, 'src', 'data', 'photos.js'), fallbackJs, 'utf8')

  console.log(`Built catalog with ${photos.length} images using source: ${sourceMode}`)
}

await buildCatalog()
