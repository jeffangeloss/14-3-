import { useEffect, useRef, useState } from 'react'
import Home from './pages/Home'
import AnimatedGarden from './components/AnimatedGarden'
import BootLoader from './components/BootLoader'
import { primePhotoCatalog, warmupPhotoAssets } from './hooks/usePhotoCatalog'
import useEnergySaver from './hooks/useEnergySaver'
import EnergySaverToggle from './components/EnergySaverToggle'

const minLoaderMs = 5000
const preloadLimit = 28
const loaderFadeMs = 520

function App() {
  const { energySaver, manualEnabled, setManualEnabled } = useEnergySaver()
  const [ready, setReady] = useState(false)
  const [loaderVisible, setLoaderVisible] = useState(true)
  const [loaderExiting, setLoaderExiting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [message, setMessage] = useState('Preparando recuerdos...')
  const startupPreloadLimitRef = useRef(manualEnabled ? 14 : preloadLimit)

  useEffect(() => {
    let cancelled = false
    let animationFrame = null
    const startedAt = Date.now()
    let bootstrapDone = false
    let bootstrapFailed = false

    const animateProgress = () => {
      if (cancelled) return

      const elapsed = Date.now() - startedAt
      const timeRatio = Math.min(1, elapsed / minLoaderMs)

      let nextProgress
      if (!bootstrapDone) {
        const base = timeRatio * 0.9
        const overtime =
          elapsed > minLoaderMs ? Math.min(0.08, ((elapsed - minLoaderMs) / 4000) * 0.08) : 0
        nextProgress = Math.min(0.98, base + overtime)
      } else {
        nextProgress = timeRatio < 1 ? Math.min(0.99, timeRatio * 0.99) : 1
      }

      setProgress((prev) => (nextProgress > prev ? nextProgress : prev))

      if (timeRatio < 0.35) {
        setMessage('Cargando fotos...')
      } else if (timeRatio < 0.8) {
        setMessage('Precargando recuerdos principales...')
      } else if (!bootstrapDone) {
        setMessage('Ajustando detalles...')
      } else if (timeRatio < 1) {
        setMessage('Casi listo...')
      }

      if (bootstrapDone && timeRatio >= 1) {
        setProgress(1)
        setMessage(bootstrapFailed ? 'Iniciando...' : 'Todo listo...')
        setReady(true)
        return
      }

      animationFrame = window.requestAnimationFrame(animateProgress)
    }

    const bootstrap = async () => {
      try {
        const photos = await primePhotoCatalog()
        if (cancelled) return

        await warmupPhotoAssets(photos, {
          limit: startupPreloadLimitRef.current,
          concurrency: 4
        })
      } catch {
        if (cancelled) return
        bootstrapFailed = true
      } finally {
        if (!cancelled) bootstrapDone = true
      }
    }

    animationFrame = window.requestAnimationFrame(animateProgress)
    bootstrap()

    return () => {
      cancelled = true
      if (animationFrame !== null) window.cancelAnimationFrame(animationFrame)
    }
  }, [])

  useEffect(() => {
    if (!ready || !loaderVisible) return () => {}
    setLoaderExiting(true)

    const timer = window.setTimeout(() => {
      setLoaderVisible(false)
    }, loaderFadeMs)

    return () => window.clearTimeout(timer)
  }, [ready, loaderVisible])

  useEffect(() => {
    document.body.dataset.energySave = energySaver ? 'true' : 'false'
    return () => {
      delete document.body.dataset.energySave
    }
  }, [energySaver])

  return (
    <>
      {ready && (
        <div className={`app-shell ${loaderExiting ? 'app-shell-visible' : ''}`}>
          <AnimatedGarden energySaver={energySaver} />
          <a className="skip-link" href="#contenido">
            Saltar al contenido
          </a>
          <EnergySaverToggle enabled={manualEnabled} onToggle={setManualEnabled} />
          <main id="contenido" className="app">
            <Home energySaver={energySaver} />
          </main>
        </div>
      )}

      {loaderVisible && (
        <div className={`boot-overlay ${loaderExiting ? 'boot-overlay-exit' : ''}`}>
          <BootLoader progress={progress} message={message} />
        </div>
      )}
    </>
  )
}

export default App
