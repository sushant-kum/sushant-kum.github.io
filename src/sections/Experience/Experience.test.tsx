import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { Experience } from './Experience'
import { experience } from '../../data/experience'

describe('Experience', () => {
  it('renders every company', () => {
    render(<Experience />)
    for (const e of experience) {
      expect(screen.getByText(e.company)).toBeInTheDocument()
    }
  })
  it('renders as a list', () => {
    render(<Experience />)
    expect(screen.getAllByRole('listitem').length).toBeGreaterThanOrEqual(experience.length)
  })
  it('has no a11y violations', async () => {
    const { container } = render(<Experience />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
