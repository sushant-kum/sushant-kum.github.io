import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, it, expect } from 'vitest';

import { SectionHeading } from './SectionHeading';

describe('SectionHeading', () => {
  it('renders the title and eyebrow text', () => {
    render(<SectionHeading id="x" title="Experience" eyebrow="// career --log" />);
    expect(screen.getByRole('heading', { level: 2, name: 'Experience' })).toBeInTheDocument();
    expect(screen.getByText('// career --log')).toBeInTheDocument();
  });

  it('has no a11y violations', async () => {
    const { container } = render(<SectionHeading id="x" title="Projects" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
