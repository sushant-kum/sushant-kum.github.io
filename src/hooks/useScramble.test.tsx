import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import { useRef } from 'react';
import { describe, it, expect } from 'vitest';

import { useScramble } from './useScramble';

const Host = ({ text }: { text: string }) => {
  const ref = useRef<HTMLSpanElement>(null);
  useScramble(ref, text);
  return <span ref={ref}>{text}</span>;
};

describe('useScramble', () => {
  it('shows the final text (reduced motion / no trigger in jsdom)', () => {
    const { getByText } = render(<Host text="Experience" />);
    expect(getByText('Experience')).toBeInTheDocument();
  });

  it('has no a11y violations', async () => {
    const { container } = render(<Host text="Projects" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
