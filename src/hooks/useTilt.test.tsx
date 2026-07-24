import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import { useRef } from 'react';
import { describe, it, expect } from 'vitest';

import { useTilt } from './useTilt';

const Host = () => {
  const ref = useRef<HTMLDivElement>(null);
  useTilt(ref);
  return <div ref={ref}>card</div>;
};

describe('useTilt', () => {
  it('renders its host without throwing', () => {
    const { getByText } = render(<Host />);
    expect(getByText('card')).toBeInTheDocument();
  });

  it('has no a11y violations', async () => {
    const { container } = render(<Host />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
