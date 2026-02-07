import Pebble from './Pebble'
import styles from './Landing.module.css'

export default function Landing() {
  return (
    <section id="inicio" className={`section ${styles.hero}`}>
      <div className={`section-inner ${styles.heroInner}`}>
        <div className={styles.content}>
          <span className={styles.kitty}>Para Gaby, de Jeff</span>
          <h1 className={styles.title}>
            Gaby, este rincón es para ti <span>💜</span>
          </h1>
          <p className={styles.subtitle}>
            Un universo romántico en movimiento para celebrar lo bonito que se siente estar juntos.
          </p>
          <div className={styles.actions}>
            <a className={`btn ${styles.enter}`} href="#experiencia">
              Entrar al viaje
            </a>
            <a className="btn ghost" href="#juego">
              Buscar piedritas
            </a>
          </div>
        </div>
        <div className={styles.orbit} aria-hidden="true">
          <div className={styles.orbitRing}>
            <div className={styles.orbitGlow} />
            <div className={styles.orbitBadge}>Gaby + Jeff</div>
            <div className={styles.orbitCard}>
              Pequeños detalles, grandes recuerdos. Hoy quiero que todo se vea vivo para ti.
            </div>
          </div>
        </div>
      </div>
      <Pebble
        id="pebble-1"
        message="Encontraste la primera piedrita ✨"
        className={styles.pebbleOne}
      />
    </section>
  )
}
