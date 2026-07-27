import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, it, expect } from 'vitest';

import { ScrollProgress } from './ScrollProgress';

describe('ScrollProgress', () => {
  it('renders an aria-hidden rail', () => {
    const { container } = render(<ScrollProgress />);
    expect(container.querySelector('[aria-hidden="true"]')).toBeTruthy();
  });

  it('has no a11y violations', async () => {
    const { container } = render(<ScrollProgress />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
