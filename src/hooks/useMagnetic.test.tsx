import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import { useRef } from 'react';
import { describe, it, expect } from 'vitest';

import { useMagnetic } from './useMagnetic';

const Host = () => {
  const ref = useRef<HTMLButtonElement>(null);
  useMagnetic(ref, true);
  return <button ref={ref}>press</button>;
};

describe('useMagnetic', () => {
  it('renders its host element without throwing (no-op when pointer is not fine)', () => {
    const { getByRole } = render(<Host />);
    expect(getByRole('button', { name: 'press' })).toBeInTheDocument();
  });

  it('has no a11y violations', async () => {
    const { container } = render(<Host />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
