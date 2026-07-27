import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, it, expect } from 'vitest';

import { Preloader } from './Preloader';

describe('Preloader', () => {
  it('renders an aria-hidden overlay', () => {
    const { container } = render(<Preloader />);
    const el = container.firstElementChild as HTMLElement;
    expect(el.getAttribute('aria-hidden')).toBe('true');
  });

  it('has no a11y violations', async () => {
    const { container } = render(<Preloader />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
