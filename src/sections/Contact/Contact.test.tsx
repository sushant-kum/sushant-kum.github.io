import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, it, expect } from 'vitest';

import { Contact } from './Contact';

describe('Contact', () => {
  it('renders accessible social links with correct hrefs', () => {
    render(<Contact />);
    expect(screen.getByRole('link', { name: /github/i })).toHaveAttribute(
      'href',
      'https://github.com/sushant-kum',
    );
    expect(screen.getByRole('link', { name: /linkedin/i })).toHaveAttribute(
      'href',
      'https://www.linkedin.com/in/sushant-kum/',
    );
    expect(screen.getByRole('link', { name: /email/i })).toHaveAttribute(
      'href',
      'mailto:sushant.kum96@gmail.com',
    );
  });
  it('has no a11y violations', async () => {
    const { container } = render(<Contact />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
