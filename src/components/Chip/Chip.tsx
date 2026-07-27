import { useRef } from 'react';

import styles from './Chip.module.scss';
import { useMagnetic } from '../../hooks/useMagnetic';

type Props = {
  children: React.ReactNode;
  variant?: 'cyan' | 'violet' | 'green';
  magnetic?: boolean;
};

export const Chip = ({ children, variant = 'cyan', magnetic = false }: Props) => {
  const ref = useRef<HTMLSpanElement>(null);
  useMagnetic(ref, magnetic);
  return (
    <span
      ref={ref}
      data-magnetic={magnetic || undefined}
      className={`${styles.chip} ${styles[variant]}`}
    >
      {children}
    </span>
  );
};
