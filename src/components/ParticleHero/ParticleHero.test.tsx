import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, it, expect } from 'vitest';

import { ParticleHero } from './ParticleHero';

describe('ParticleHero', () => {
  it('renders an aria-hidden container without throwing', () => {
    const { container } = render(<ParticleHero />);
    const el = container.firstElementChild as HTMLElement;
    expect(el).toBeTruthy();
    expect(el.getAttribute('aria-hidden')).toBe('true');
  });

  it('has no a11y violations', async () => {
    const { container } = render(<ParticleHero />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
