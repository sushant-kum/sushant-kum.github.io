import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { Nav } from './Nav'

describe('Nav', () => {
  it('renders anchor links to each section', () => {
    render(<Nav />)
    for (const id of ['about', 'experience', 'projects', 'skills', 'contact']) {
      const link = screen.getByRole('link', { name: new RegExp(id, 'i') })
      expect(link).toHaveAttribute('href', `#${id}`)
    }
  })
  it('has no a11y violations', async () => {
    const { container } = render(<Nav />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
