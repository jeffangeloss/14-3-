# San Valentin para Gaby

Proyecto React + Vite con backend local para galeria de fotos (tunel 3D), filtros y carga incremental.

## Inicio rapido (tu caso actual)
Tus fotos ya estan en `public/photos/web`, asi que solo necesitas levantar frontend + backend.

### Git Bash
1. `npm install`
2. `npm run dev:full`

### PowerShell (si bloquea scripts npm)
1. `npm.cmd install`
2. `npm.cmd run dev:full`

Servicios:
- Frontend: `http://localhost:5173`
- Backend/API: `http://localhost:8787`
- Fotos servidas desde: `/media/web/...`

## Si no se ven las fotos
1. Deten procesos viejos de Node (importante si cambiaste nombres de archivos):
   - PowerShell: `Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force`
2. Vuelve a levantar:
   - `npm.cmd run dev:full`
3. Fuerza reindexado manual:
   - Abre `http://localhost:8787/api/reindex`

El backend tambien reindexa automaticamente cada ~15 segundos.

## Flujo de fotos recomendado
- Carpeta que consume la web: `public/photos/web`
- Formatos soportados en esa carpeta: `.jpg .jpeg .png .webp .avif`
- Si agregas HEIC en otras carpetas y quieres convertirlos a JPG web:
  - `npm run photos:all`

## API
- `GET /api/health`
- `GET /api/reindex`
- `GET /api/collections`
- `GET /api/themes`
- `GET /api/photos?collection=all|featured|main|rui&theme=all|<theme>&limit=24&cursor=0`

## Notas, titulos y etiquetas
Edita `backend/photo-notes.json` para sobrescribir metadatos por archivo.
Claves validas por entrada:
- `collection`
- `theme`
- `title`
- `caption`
- `note`
- `alt`
- `tags`

Luego llama `GET /api/reindex` o reinicia backend.

## Despliegue local (frontend + backend en un solo servidor)
1. Build frontend:
   - Git Bash: `npm run build`
   - PowerShell: `npm.cmd run build`
2. Iniciar servidor unico (API + archivos estaticos):
   - Git Bash: `npm run start`
   - PowerShell: `npm.cmd run start`
3. Abrir: `http://localhost:8787`

## Estructura relevante
- `backend/server.mjs`: API, indexado de fotos y servido de `dist`
- `src/components/Gallery.jsx`: tunel 3D y filtros
- `public/photos/web/`: fotos finales para la web
- `backend/photo-notes.json`: ajustes manuales por foto
- `scripts/convert-all-photos.mjs`: conversion a JPG
