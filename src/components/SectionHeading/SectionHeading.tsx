import { useRef } from 'react';

import styles from './SectionHeading.module.scss';
import { useScramble } from '../../hooks/useScramble';

type Props = { id: string; title: string; eyebrow?: string };

export const SectionHeading = ({ id, title, eyebrow }: Props) => {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const eyebrowRef = useRef<HTMLParagraphElement>(null);
  useScramble(titleRef, title);
  useScramble(eyebrowRef, eyebrow ?? '');
  return (
    <header className={styles.head}>
      {eyebrow && (
        <p ref={eyebrowRef} className={styles.eyebrow}>
          {eyebrow}
        </p>
      )}
      <h2 id={id} ref={titleRef} className={styles.title}>
        {title}
      </h2>
    </header>
  );
};
