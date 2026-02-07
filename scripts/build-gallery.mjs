import fs from 'node:fs/promises'
import path from 'node:path'
import convert from 'heic-convert'

const root = process.cwd()
const sourceDir = path.join(root, 'public', 'photos')
const outDir = path.join(sourceDir, 'gallery')

const isImageExt = new Set(['.jpg', '.jpeg', '.png', '.heic', '.heif'])
const minSizeBytes = 250_000
const maxTotal = 36
const perDay = 2

const monthNames = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre'
]

const adjectives = [
  'Recuerdo lila',
  'Brillo suave',
  'Instante bonito',
  'Luz neón',
  'Momento dorado',
  'Sonrisa tranquila',
  'Abrazo tierno',
  'Vibra bonita',
  'Calma dulce',
  'Risa luminosa'
]

const pad = (value) => String(value).padStart(2, '0')

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

const formatDateLong = (date) => {
  const day = date.getDate()
  const month = monthNames[date.getMonth()]
  const year = date.getFullYear()
  return `${day} de ${month} de ${year}`
}

const tagFromHour = (hour) => {
  if (hour >= 19 || hour < 6) return 'Noche'
  if (hour < 11) return 'Mañana'
  if (hour < 16) return 'Día'
  if (hour < 19) return 'Tarde'
  return 'Noche'
}

const loadFiles = async () => {
  const entries = await fs.readdir(sourceDir, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    if (!entry.isFile()) continue
    const ext = path.extname(entry.name).toLowerCase()
    if (!isImageExt.has(ext)) continue

    const fullPath = path.join(sourceDir, entry.name)
    const stats = await fs.stat(fullPath)
    if (stats.size < minSizeBytes) continue

    const parsed = parseDateFromName(entry.name)
    const date = parsed ?? stats.mtime

    files.push({
      name: entry.name,
      ext,
      fullPath,
      size: stats.size,
      date
    })
  }

  return files
}

const selectFiles = (files) => {
  const groups = new Map()

  for (const file of files) {
    const key = `${file.date.getFullYear()}-${pad(file.date.getMonth() + 1)}-${pad(file.date.getDate())}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(file)
  }

  const selected = []
  const leftovers = []

  for (const items of groups.values()) {
    items.sort((a, b) => b.size - a.size)
    selected.push(...items.slice(0, perDay))
    leftovers.push(...items.slice(perDay))
  }

  selected.sort((a, b) => a.date - b.date)
  leftovers.sort((a, b) => b.size - a.size)

  for (const item of leftovers) {
    if (selected.length >= maxTotal) break
    selected.push(item)
  }

  return selected.slice(0, maxTotal)
}

const buildGallery = async () => {
  await fs.rm(outDir, { recursive: true, force: true })
  await fs.mkdir(outDir, { recursive: true })

  const files = await loadFiles()
  if (files.length === 0) {
    console.log('No se encontraron imagenes validas en public/photos.')
    return
  }

  const selected = selectFiles(files)
  const counters = new Map()
  const photos = []
  const map = []

  for (const [index, file] of selected.entries()) {
    const dateKey = `${file.date.getFullYear()}-${pad(file.date.getMonth() + 1)}-${pad(file.date.getDate())}`
    const count = (counters.get(dateKey) ?? 0) + 1
    counters.set(dateKey, count)

    const baseName = `gaby-${dateKey}-${pad(count)}`
    const outName = `${baseName}.jpg`
    const outPath = path.join(outDir, outName)

    if (file.ext === '.heic' || file.ext === '.heif') {
      const inputBuffer = await fs.readFile(file.fullPath)
      const outputBuffer = await convert({ buffer: inputBuffer, format: 'JPEG', quality: 0.9 })
      await fs.writeFile(outPath, outputBuffer)
    } else {
      await fs.copyFile(file.fullPath, outPath)
    }

    const dateLong = formatDateLong(file.date)
    const hour = file.date.getHours()
    const tag = tagFromHour(hour)
    const caption = `${adjectives[index % adjectives.length]} - ${dateLong}`

    photos.push({
      id: `p${index + 1}`,
      src: `/photos/gallery/${outName}`,
      alt: `Foto del ${dateLong}`,
      caption,
      tag
    })

    map.push({
      original: file.name,
      output: outName,
      date: dateLong,
      size: file.size
    })
  }

  const photosJs = `export const photos = ${JSON.stringify(photos, null, 2)}\n`
  await fs.writeFile(path.join(root, 'src', 'data', 'photos.js'), photosJs, 'utf8')
  await fs.writeFile(path.join(outDir, '_map.json'), JSON.stringify(map, null, 2), 'utf8')

  console.log(`Galeria creada con ${photos.length} fotos en public/photos/gallery`)
}

await buildGallery()
