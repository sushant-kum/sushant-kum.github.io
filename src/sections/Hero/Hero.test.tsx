import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { Hero } from './Hero'

describe('Hero', () => {
  it('renders the name as h1 and the role', () => {
    render(<Hero />)
    expect(screen.getByRole('heading', { level: 1, name: /sushant kumar/i })).toBeInTheDocument()
    expect(screen.getByText(/senior software engineer/i)).toBeInTheDocument()
  })
  it('renders skill chips', () => {
    render(<Hero />)
    expect(screen.getByText('TypeScript')).toBeInTheDocument()
    expect(screen.getByText('React')).toBeInTheDocument()
  })
  it('has no a11y violations', async () => {
    const { container } = render(<Hero />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
