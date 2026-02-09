import styles from './Letter.module.css'

const closingMessage = `PRECIOSA GABY, QUIERES SER MI SAN VALENTÍN? ¿Te gustaría que este 14 sea nuestro? 🌙💗
Podríamos salir juntitos este 14 de febrero si es que puedes :')
En todo caso, también podemos elegir otro día!

Esta cita juntos si o si presentará:
- Muchos abracitos <3
- Infinitos momentos tomados de la manito :')
- Lindas, hermosas, sentimentales flores!
- Demasiados te quiero muchísimo preciosa
- Un día de muchas risas y bonitos momentos juntos!`

export default function Letter() {
  return (
    <footer id="carta" className={styles.footerInvite} role="contentinfo">
      <div className="section-inner">
        <div className={`section-header ${styles.header}`}>
          <div>
            <h2 className="section-title">Invitación</h2>
            <p className="section-subtitle">Una propuesta hecha con todo mi cariño para ti.</p>
          </div>
          <span className="pill">Para Gaby</span>
        </div>

        <article className={styles.messageBlock}>
          <p className={styles.messageText}>{closingMessage}</p>
        </article>
      </div>
    </footer>
  )
}
