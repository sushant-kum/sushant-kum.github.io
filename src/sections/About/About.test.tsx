import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { About } from './About'

describe('About', () => {
  it('renders heading, avatar with alt, and bio', () => {
    render(<About />)
    expect(screen.getByRole('heading', { level: 2, name: /about/i })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /sushant kumar/i })).toBeInTheDocument()
    expect(screen.getByText(/senior software engineer/i)).toBeInTheDocument()
  })
  it('has no a11y violations', async () => {
    const { container } = render(<About />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
