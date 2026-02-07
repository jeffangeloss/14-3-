import { useState } from 'react'
import { letterText } from '../data/letter'
import useReveal from '../hooks/useReveal'
import useTypewriter from '../hooks/useTypewriter'
import Pebble from './Pebble'
import styles from './Letter.module.css'

export default function Letter() {
  const [response, setResponse] = useState('')
  const [ref, isVisible] = useReveal()
  const typedText = useTypewriter(letterText, 24, isVisible)

  return (
    <section id="carta" className={`section ${styles.letter}`}>
      <div className="section-inner">
        <div className="section-header">
          <div>
            <h2 className="section-title">Carta final</h2>
            <p className="section-subtitle">
              Un mensaje escrito con calma, carino y un poquito de magia.
            </p>
          </div>
          <span className="pill">Typewriter</span>
        </div>
        <div ref={ref} className={`${styles.card} reveal ${isVisible ? 'reveal-visible' : ''}`}>
          <p className={styles.text} aria-live="polite">
            {typedText}
          </p>
        </div>
        <div className={styles.cta}>
          <button
            type="button"
            className="btn"
            onClick={() => setResponse('Si, me encantaria. Prometo muchos abrazos y musica.')}
          >
            Si, me encantaria
          </button>
          <button
            type="button"
            className="btn ghost"
            onClick={() =>
              setResponse('Gracias por tu sinceridad. Seguimos con calma, igual de bonito.')
            }
          >
            Todavia no
          </button>
        </div>
        {response && <div className={styles.response}>{response}</div>}
        <p className={styles.note}>
          Cualquier respuesta es bienvenida. Lo importante es seguir sumando momentos lindos.
        </p>
      </div>
      <Pebble
        id="pebble-7"
        message="La ultima piedrita es tuya"
        className={styles.pebbleSeven}
      />
    </section>
  )
}
