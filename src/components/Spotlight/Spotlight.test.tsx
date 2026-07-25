import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, it, expect } from 'vitest';

import { Spotlight } from './Spotlight';

describe('Spotlight', () => {
  it('renders an aria-hidden layer', () => {
    const { container } = render(<Spotlight />);
    const el = container.firstElementChild as HTMLElement;
    expect(el.getAttribute('aria-hidden')).toBe('true');
  });
  it('has no a11y violations', async () => {
    const { container } = render(<Spotlight />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
