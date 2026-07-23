import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { SkipLink } from './SkipLink/SkipLink'
import { Chip } from './Chip/Chip'
import { SectionHeading } from './SectionHeading/SectionHeading'
import { GlowBackground } from './GlowBackground/GlowBackground'

describe('primitives', () => {
  it('SkipLink targets #main and is a link', () => {
    render(<SkipLink />)
    const link = screen.getByRole('link', { name: /skip to content/i })
    expect(link).toHaveAttribute('href', '#main')
  })
  it('Chip renders its children', () => {
    render(<Chip>React</Chip>)
    expect(screen.getByText('React')).toBeInTheDocument()
  })
  it('SectionHeading renders an h2 with the given id', () => {
    render(<SectionHeading id="skills" title="Skills" eyebrow="// stack" />)
    const h = screen.getByRole('heading', { level: 2, name: 'Skills' })
    expect(h).toHaveAttribute('id', 'skills')
  })
  it('GlowBackground is decorative (aria-hidden) with no a11y violations', async () => {
    const { container } = render(<GlowBackground />)
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true')
    expect(await axe(container)).toHaveNoViolations()
  })
})
