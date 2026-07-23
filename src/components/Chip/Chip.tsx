import styles from './Chip.module.scss'

type Props = { children: React.ReactNode; variant?: 'cyan' | 'violet' | 'green' }

export function Chip({ children, variant = 'cyan' }: Props) {
  return <span className={`${styles.chip} ${styles[variant]}`}>{children}</span>
}
