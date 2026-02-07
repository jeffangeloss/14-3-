import { usePebbles } from '../hooks/usePebbles.jsx'
import Pebble from './Pebble'
import styles from './PebbleGame.module.css'

export default function PebbleGame() {
  const { found, total, complete } = usePebbles()

  const handleSecret = () => {
    const section = document.querySelector('#carta')
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <section id="juego" className={`section ${styles.game}`}>
      <div className="section-inner">
        <div className="section-header">
          <div>
            <h2 className="section-title">Juego de piedritas</h2>
            <p className="section-subtitle">
              Hay 7 piedritas escondidas por toda la web. Tocarlas suma al contador
              y guarda el progreso aunque recargues.
            </p>
          </div>
          <span className="pill">Coleccionables</span>
        </div>
        <div className={styles.card}>
          <div className={styles.progress}>
            <span>Encontradas:</span>
            <span className={styles.count}>{found.length} / {total}</span>
            <span>Busca con calma y con sonrisas.</span>
          </div>
          {!complete && (
            <p>
              Tip: algunas se esconden cerca de fotos, otras al lado de la musica y una
              guarda el camino a la carta final.
            </p>
          )}
          {complete && (
            <div className={styles.secret}>
              <h3 className={styles.secretTitle}>Secreto desbloqueado</h3>
              <p className={styles.secretText}>
                Juntaste todas las piedritas. Hay una carta final esperandote con mucho
                carino.
              </p>
              <button type="button" className="btn" onClick={handleSecret}>
                Abrir la carta final
              </button>
            </div>
          )}
        </div>
      </div>
      <Pebble
        id="pebble-5"
        message="Un brillo mas para tu coleccion"
        className={styles.pebbleFive}
      />
    </section>
  )
}
