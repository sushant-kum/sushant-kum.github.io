import styles from './SectionHeading.module.scss'

type Props = { id: string; title: string; eyebrow?: string }

export function SectionHeading({ id, title, eyebrow }: Props) {
  return (
    <header className={styles.head}>
      {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
      <h2 id={id} className={styles.title}>{title}</h2>
    </header>
  )
}
