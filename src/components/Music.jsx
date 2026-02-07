import { useEffect, useRef, useState } from 'react'
import { music } from '../data/music'
import Pebble from './Pebble'
import Reveal from './Reveal'
import styles from './Music.module.css'

export default function Music() {
  const hasEmbed = Boolean(music.embedUrl)
  const hasTracks = Array.isArray(music.tracks) && music.tracks.length > 0
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef(null)

  const currentTrack = hasTracks ? music.tracks[currentIndex] : null

  useEffect(() => {
    if (!audioRef.current || !currentTrack) return
    audioRef.current.src = currentTrack.src
    if (isPlaying) {
      audioRef.current.play().catch(() => {
        setIsPlaying(false)
      })
    }
  }, [currentTrack, isPlaying])

  const handlePlay = () => {
    if (!audioRef.current) return
    audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {
      setIsPlaying(false)
    })
  }

  const handlePause = () => {
    if (!audioRef.current) return
    audioRef.current.pause()
    setIsPlaying(false)
  }

  const handleSelect = (index) => {
    setCurrentIndex(index)
    setIsPlaying(false)
  }

  return (
    <section id="musica" className={`section ${styles.music}`}>
      <div className="section-inner">
        <div className="section-header">
          <div>
            <h2 className="section-title">Musica para el corazon</h2>
            <p className="section-subtitle">
              Puedes usar un embed de Spotify/YouTube o reproducir archivos locales en
              /public/audio.
            </p>
          </div>
          <span className="pill">Playlist</span>
        </div>

        {hasEmbed && (
          <Reveal>
            <div className={styles.embedWrap}>
              <iframe
                src={music.embedUrl}
                title="Playlist romantica"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
              />
            </div>
          </Reveal>
        )}

        {hasTracks && (
          <Reveal delay={120}>
            <div className={styles.player}>
              <div className={styles.controls}>
                <button type="button" className="btn" onClick={handlePlay}>
                  Reproducir
                </button>
                <button type="button" className="btn ghost" onClick={handlePause}>
                  Pausar
                </button>
                {currentTrack && (
                  <span className={styles.trackInfo}>
                    Sonando: {currentTrack.title} — {currentTrack.artist}
                  </span>
                )}
              </div>
              <ul className={styles.trackList}>
                {music.tracks.map((track, index) => (
                  <li key={track.id}>
                    <button
                      type="button"
                      className={`${styles.trackButton} ${index === currentIndex ? styles.active : ''}`}
                      onClick={() => handleSelect(index)}
                    >
                      <span>{track.title}</span>
                      <span>{track.artist}</span>
                    </button>
                  </li>
                ))}
              </ul>
              <audio
                ref={audioRef}
                preload="none"
                onEnded={() => setIsPlaying(false)}
                aria-label="Reproductor de musica"
              />
            </div>
          </Reveal>
        )}
      </div>
      <Pebble
        id="pebble-6"
        message="Una piedrita con ritmo"
        className={styles.pebbleSix}
      />
    </section>
  )
}
