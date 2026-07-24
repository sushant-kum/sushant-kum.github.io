import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, it, expect } from 'vitest';

import { CursorGlow } from './CursorGlow';

describe('CursorGlow', () => {
  it('renders two aria-hidden layers', () => {
    const { container } = render(<CursorGlow />);
    const hidden = container.querySelectorAll('[aria-hidden="true"]');
    expect(hidden.length).toBe(2);
  });

  it('has no a11y violations', async () => {
    const { container } = render(<CursorGlow />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
