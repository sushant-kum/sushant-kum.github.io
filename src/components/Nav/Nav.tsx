import styles from './Nav.module.scss'

const LINKS = [
  { id: 'about', label: 'about' },
  { id: 'experience', label: 'experience' },
  { id: 'projects', label: 'projects' },
  { id: 'skills', label: 'skills' },
  { id: 'contact', label: 'contact' },
]

export function Nav() {
  return (
    <nav className={styles.nav} aria-label="Primary">
      <a className={styles.brand} href="#top">SK<span>.</span></a>
      <ul className={styles.links}>
        {LINKS.map((l) => (
          <li key={l.id}><a href={`#${l.id}`}>{l.label}</a></li>
        ))}
      </ul>
    </nav>
  )
}
