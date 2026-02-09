import { useMemo } from 'react'
import styles from './AnimatedGarden.module.css'
import { usePhotoCatalog } from '../hooks/usePhotoCatalog'

const buildPhotoDrift = (photos) =>
  photos.map((photo, index) => {
    const size = 72 + ((index * 13) % 52)
    const left = 2 + ((index * 47.7) % 96)
    const duration = 32 + ((index * 11) % 24)
    const delay = -((index * 3.2) % duration)
    const drift = (index % 2 === 0 ? 1 : -1) * (10 + ((index * 7) % 22))
    const wobble = 4 + ((index * 5) % 8)
    const opacity = (0.28 + ((index % 6) * 0.06)).toFixed(2)
    const tilt = `${(index % 2 === 0 ? 1 : -1) * (3 + ((index * 3) % 8))}deg`

    return {
      ...photo,
      style: {
        '--left': `${left}%`,
        '--size': `${size}px`,
        '--duration': `${duration}s`,
        '--delay': `${delay}s`,
        '--drift': `${drift}vw`,
        '--wobble': `${wobble}px`,
        '--alpha': opacity,
        '--tilt': tilt
      }
    }
  })

const cats = [
  { left: '-22%', y: '86%', size: 118, duration: '32s', delay: '0s' },
  { left: '-28%', y: '78%', size: 106, duration: '36s', delay: '11s' }
]

const birds = [
  { top: '8%', size: 72, duration: '23s', delay: '0s' },
  { top: '16%', size: 64, duration: '29s', delay: '8s' },
  { top: '27%', size: 76, duration: '26s', delay: '14s' }
]

const hearts = [
  { left: '8%', size: 18, duration: '14s', delay: '0s', drift: '22px' },
  { left: '18%', size: 16, duration: '17s', delay: '3s', drift: '-18px' },
  { left: '32%', size: 22, duration: '16s', delay: '6s', drift: '28px' },
  { left: '49%', size: 15, duration: '13s', delay: '2s', drift: '-20px' },
  { left: '64%', size: 20, duration: '15s', delay: '8s', drift: '20px' },
  { left: '78%', size: 17, duration: '18s', delay: '1s', drift: '-16px' },
  { left: '90%', size: 14, duration: '12s', delay: '5s', drift: '14px' }
]

const flowers = [
  { left: '4%', top: '69%', size: 74, sway: '6s', delay: '0s' },
  { left: '10%', top: '88%', size: 60, sway: '5.2s', delay: '1s' },
  { left: '84%', top: '72%', size: 70, sway: '6.8s', delay: '0.6s' },
  { left: '91%', top: '90%', size: 62, sway: '5.5s', delay: '1.8s' }
]

function CatIcon() {
  return (
    <svg viewBox="0 0 180 120" className={styles.icon} xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="88" cy="72" rx="52" ry="30" fill="#b58de8" />
      <ellipse cx="134" cy="78" rx="24" ry="18" fill="#9c73d7" />
      <circle cx="58" cy="48" r="27" fill="#c9a3f3" />
      <path d="M36 35L45 12L56 33Z" fill="#c9a3f3" />
      <path d="M60 33L70 10L78 34Z" fill="#c9a3f3" />
      <circle cx="48" cy="47" r="4" fill="#141823" />
      <circle cx="66" cy="47" r="4" fill="#141823" />
      <ellipse cx="57" cy="57" rx="6" ry="4" fill="#f3d0de" />
      <path d="M146 66C162 58 176 66 174 81" fill="none" stroke="#9c73d7" strokeWidth="9" strokeLinecap="round" />
      <ellipse cx="58" cy="95" rx="10" ry="8" fill="#d6b6f5" />
      <ellipse cx="84" cy="98" rx="10" ry="8" fill="#d6b6f5" />
    </svg>
  )
}

function BirdIcon() {
  return (
    <svg viewBox="0 0 130 90" className={styles.icon} xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="66" cy="50" rx="34" ry="24" fill="#74d8ee" />
      <path className={styles.wing} d="M54 45C30 18 10 38 22 58C30 70 46 62 58 55" fill="#56bed4" />
      <circle cx="85" cy="44" r="4" fill="#121826" />
      <path d="M98 50L120 44L98 38Z" fill="#f7c55c" />
      <path d="M34 58C22 66 18 74 20 82C30 80 40 74 47 66" fill="#56bed4" />
    </svg>
  )
}

function HeartIcon() {
  return (
    <svg viewBox="0 0 100 90" className={styles.icon} xmlns="http://www.w3.org/2000/svg">
      <path
        d="M50 82C37 70 12 55 10 33C8 18 20 8 34 10C42 11 48 16 50 22C52 16 58 11 66 10C80 8 92 18 90 33C88 55 63 70 50 82Z"
        fill="#f98ac1"
      />
      <path
        d="M50 74C39 63 18 50 17 33C16 23 24 16 33 17C40 18 46 23 50 29C54 23 60 18 67 17C76 16 84 23 83 33C82 50 61 63 50 74Z"
        fill="#ffd1e7"
        opacity="0.65"
      />
    </svg>
  )
}

function FlowerIcon() {
  return (
    <svg viewBox="0 0 120 120" className={styles.icon} xmlns="http://www.w3.org/2000/svg">
      <circle cx="60" cy="60" r="15" fill="#f6e0a1" />
      <ellipse cx="60" cy="23" rx="14" ry="20" fill="#f49cbf" />
      <ellipse cx="60" cy="97" rx="14" ry="20" fill="#f49cbf" />
      <ellipse cx="23" cy="60" rx="20" ry="14" fill="#f49cbf" />
      <ellipse cx="97" cy="60" rx="20" ry="14" fill="#f49cbf" />
      <ellipse cx="33" cy="33" rx="14" ry="18" transform="rotate(-45 33 33)" fill="#f2b0cd" />
      <ellipse cx="87" cy="87" rx="14" ry="18" transform="rotate(-45 87 87)" fill="#f2b0cd" />
      <ellipse cx="87" cy="33" rx="14" ry="18" transform="rotate(45 87 33)" fill="#f2b0cd" />
      <ellipse cx="33" cy="87" rx="14" ry="18" transform="rotate(45 33 87)" fill="#f2b0cd" />
    </svg>
  )
}

export default function AnimatedGarden({ energySaver = false }) {
  const { photos } = usePhotoCatalog()
  const shouldAnimate = !energySaver

  // Keep ambient decoration lightweight on low-power devices.
  const ambientPhotos = useMemo(() => {
    const target = shouldAnimate ? 48 : 0
    if (target <= 0) return []
    if (photos.length <= target) return photos
    const step = photos.length / target
    return Array.from({ length: target }, (_, index) => photos[Math.floor(index * step)]).filter(Boolean)
  }, [photos, shouldAnimate])

  const ambientHearts = useMemo(() => (shouldAnimate ? hearts : []), [shouldAnimate])
  const ambientBirds = useMemo(() => (shouldAnimate ? birds : []), [shouldAnimate])
  const ambientCats = useMemo(() => (shouldAnimate ? cats : []), [shouldAnimate])
  const ambientFlowers = useMemo(() => (shouldAnimate ? flowers : []), [shouldAnimate])

  const driftingPhotos = useMemo(() => buildPhotoDrift(ambientPhotos), [ambientPhotos])

  return (
    <div className={`${styles.decor} ${energySaver ? styles.energySave : ''}`} aria-hidden="true">
      <div className={styles.glowLayer} />

      <div className={styles.photoLayer}>
        {driftingPhotos.map((photo) => (
          <span key={`ambient-${photo.id}`} className={styles.photoPetal} style={photo.style}>
            <span className={styles.photoFrame}>
              <img src={photo.src} alt="" loading="lazy" decoding="async" />
            </span>
          </span>
        ))}
      </div>

      <div className={styles.heartsLayer}>
        {ambientHearts.map((heart, index) => (
          <span
            key={`heart-${index + 1}`}
            className={styles.heart}
            style={{
              '--left': heart.left,
              '--size': `${heart.size}px`,
              '--duration': heart.duration,
              '--delay': heart.delay,
              '--drift': heart.drift
            }}
          >
            <HeartIcon />
          </span>
        ))}
      </div>

      <div className={styles.birdsLayer}>
        {ambientBirds.map((bird, index) => (
          <span
            key={`bird-${index + 1}`}
            className={styles.bird}
            style={{
              '--top': bird.top,
              '--size': `${bird.size}px`,
              '--duration': bird.duration,
              '--delay': bird.delay
            }}
          >
            <BirdIcon />
          </span>
        ))}
      </div>

      <div className={styles.catsLayer}>
        {ambientCats.map((cat, index) => (
          <span
            key={`cat-${index + 1}`}
            className={styles.cat}
            style={{
              '--start-left': cat.left,
              '--bottom': cat.y,
              '--size': `${cat.size}px`,
              '--duration': cat.duration,
              '--delay': cat.delay
            }}
          >
            <CatIcon />
          </span>
        ))}
      </div>

      <div className={styles.flowersLayer}>
        {ambientFlowers.map((flower, index) => (
          <span
            key={`flower-${index + 1}`}
            className={styles.flower}
            style={{
              '--left': flower.left,
              '--top': flower.top,
              '--size': `${flower.size}px`,
              '--duration': flower.sway,
              '--delay': flower.delay
            }}
          >
            <FlowerIcon />
          </span>
        ))}
      </div>
    </div>
  )
}
