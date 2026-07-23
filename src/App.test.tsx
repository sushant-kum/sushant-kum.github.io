import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import App from './App'

describe('App', () => {
  it('renders one main landmark and all section headings', () => {
    render(<App />)
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: /sushant kumar/i })).toBeInTheDocument()
    for (const name of [/about/i, /experience/i, /projects/i, /skills/i]) {
      expect(screen.getByRole('heading', { level: 2, name })).toBeInTheDocument()
    }
  })
  it('the whole page has no a11y violations', async () => {
    const { container } = render(<App />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
