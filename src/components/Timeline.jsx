import { memories } from '../data/memories'
import Pebble from './Pebble'
import Reveal from './Reveal'
import styles from './Timeline.module.css'

export default function Timeline() {
  return (
    <section id="recuerdos" className={`section ${styles.timeline}`}>
      <div className="section-inner">
        <div className="section-header">
          <div>
            <h2 className="section-title">Linea de tiempo</h2>
            <p className="section-subtitle">
              Un mapa de recuerdos que siguen brillando con cada paso.
            </p>
          </div>
          <span className="pill">Recuerdos + magia</span>
        </div>
        <ul className={styles.list}>
          {memories.map((memory, index) => (
            <li key={memory.id} className={styles.item}>
              <span className={styles.dot} aria-hidden="true" />
              <Reveal delay={index * 80}>
                <div className={styles.card}>
                  <div className={styles.date}>{memory.date}</div>
                  <h3 className={styles.title}>{memory.title}</h3>
                  <p className={styles.text}>{memory.text}</p>
                </div>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
      <Pebble
        id="pebble-4"
        message="Un recuerdo se convirtio en piedrita"
        className={styles.pebbleFour}
      />
    </section>
  )
}
