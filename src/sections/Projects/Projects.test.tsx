import { render, screen, within } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, it, expect } from 'vitest';

import { Projects } from './Projects';
import { projects } from '../../data/projects';

describe('Projects', () => {
  it('renders every featured project title', () => {
    render(<Projects />);
    for (const p of projects) expect(screen.getByText(p.title)).toBeInTheDocument();
  });
  it('contains NO links (cards are showcase-only)', () => {
    const { container } = render(<Projects />);
    const section = container.querySelector('#projects')!;
    expect(within(section as HTMLElement).queryByRole('link')).toBeNull();
    expect((section as HTMLElement).querySelectorAll('a').length).toBe(0);
  });
  it('has no a11y violations', async () => {
    const { container } = render(<Projects />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
