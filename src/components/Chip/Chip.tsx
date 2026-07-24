import styles from './Chip.module.scss';

type Props = { children: React.ReactNode; variant?: 'cyan' | 'violet' | 'green' };

export const Chip = ({ children, variant = 'cyan' }: Props) => (
  <span className={`${styles.chip} ${styles[variant]}`}>{children}</span>
);
