import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import { useRef } from 'react';
import { describe, it, expect } from 'vitest';

import { useGlare } from './useGlare';

const Host = () => {
  const ref = useRef<HTMLDivElement>(null);
  useGlare(ref);
  return <div ref={ref}>card</div>;
};

describe('useGlare', () => {
  it('renders its host without throwing', () => {
    const { getByText } = render(<Host />);
    expect(getByText('card')).toBeInTheDocument();
  });
  it('has no a11y violations', async () => {
    const { container } = render(<Host />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
