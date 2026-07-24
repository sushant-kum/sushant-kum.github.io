import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import { useRef } from 'react';
import { describe, it, expect } from 'vitest';

import { useCountUp } from './useCountUp';

const Host = () => {
  const ref = useRef<HTMLSpanElement>(null);
  useCountUp(ref, 7, { suffix: '+' });
  return <span ref={ref}>7+</span>;
};

describe('useCountUp', () => {
  it('shows the final value immediately (no ScrollTrigger enter in jsdom)', () => {
    const { getByText } = render(<Host />);
    expect(getByText('7+')).toBeInTheDocument();
  });
  it('has no a11y violations', async () => {
    const { container } = render(<Host />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
