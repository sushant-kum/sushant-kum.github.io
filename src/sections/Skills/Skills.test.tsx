import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, it, expect } from 'vitest';

import { Skills } from './Skills';
import { skills } from '../../data/skills';

describe('Skills', () => {
  it('renders each group label and a sample item', () => {
    render(<Skills />);
    for (const g of skills) expect(screen.getByText(g.label)).toBeInTheDocument();
    expect(screen.getByText('Angular')).toBeInTheDocument();
  });
  it('has no a11y violations', async () => {
    const { container } = render(<Skills />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
