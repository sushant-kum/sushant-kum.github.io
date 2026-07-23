import styles from './GlowBackground.module.scss'

export function GlowBackground() {
  return (
    <div className={styles.bg} aria-hidden="true">
      <div className={styles.grid} />
      <div className={`${styles.blob} ${styles.cy}`} />
      <div className={`${styles.blob} ${styles.vi}`} />
    </div>
  )
}
