import { useRef } from 'react';

import styles from './StatStrip.module.scss';
import { stats, type Stat } from '../../data/stats';
import { useCountUp } from '../../hooks/useCountUp';

const StatItem = ({ value, suffix, label }: Stat) => {
  const ref = useRef<HTMLSpanElement>(null);
  useCountUp(ref, value, { suffix });
  return (
    <li className={styles.stat}>
      <span ref={ref} className={styles.value}>
        {value}
        {suffix ?? ''}
      </span>
      <span className={styles.label}>{label}</span>
    </li>
  );
};

export const StatStrip = () => (
  <ul className={styles.strip}>
    {stats.map((s) => (
      <StatItem key={s.label} {...s} />
    ))}
  </ul>
);
