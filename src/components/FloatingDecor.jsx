import styles from './FloatingDecor.module.css'

export default function FloatingDecor() {
  return (
    <div className={styles.decor} aria-hidden="true">
      <span className={`${styles.item} ${styles.cat} ${styles.catOne}`}>🐈</span>
      <span className={`${styles.item} ${styles.cat} ${styles.catTwo}`}>🐱</span>
      <span className={`${styles.item} ${styles.cat} ${styles.catThree}`}>🐾</span>

      <span className={`${styles.item} ${styles.butterfly} ${styles.butterflyOne}`}>🦋</span>
      <span className={`${styles.item} ${styles.butterfly} ${styles.butterflyTwo}`}>🦋</span>
      <span className={`${styles.item} ${styles.butterfly} ${styles.butterflyThree}`}>🦋</span>

      <span className={`${styles.item} ${styles.bird} ${styles.birdOne}`}>🐦</span>
      <span className={`${styles.item} ${styles.bird} ${styles.birdTwo}`}>🕊️</span>

      <span className={`${styles.item} ${styles.flower} ${styles.flowerOne}`}>🌸</span>
      <span className={`${styles.item} ${styles.flower} ${styles.flowerTwo}`}>🌷</span>
      <span className={`${styles.item} ${styles.flower} ${styles.flowerThree}`}>🌼</span>
      <span className={`${styles.item} ${styles.flower} ${styles.flowerFour}`}>🌺</span>
      <span className={`${styles.item} ${styles.flower} ${styles.flowerFive}`}>💮</span>
    </div>
  )
}
