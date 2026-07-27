import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, it, expect } from 'vitest';

import { StatStrip } from './StatStrip';

describe('StatStrip', () => {
  it('renders each stat label', () => {
    render(<StatStrip />);
    expect(screen.getByText('years shipping')).toBeInTheDocument();
    expect(screen.getByText('companies')).toBeInTheDocument();
    expect(screen.getByText('technologies')).toBeInTheDocument();
  });
  it('has no a11y violations', async () => {
    const { container } = render(<StatStrip />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
