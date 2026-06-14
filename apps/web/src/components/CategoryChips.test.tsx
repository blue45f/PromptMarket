import { CATEGORIES } from '@promptmarket/shared'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import CategoryChips from './CategoryChips'

function renderWithRouter(ui: React.ReactNode) {
  return render(<MemoryRouter>{ui}</MemoryRouter>)
}

describe('<CategoryChips />', () => {
  it('renders a chip for every shared CATEGORIES entry plus the "전체" reset chip', () => {
    renderWithRouter(<CategoryChips />)
    // "전체" + each category
    const allLink = screen.getByRole('link', { name: /전체/ })
    expect(allLink).toHaveAttribute('href', '/browse')
    for (const c of CATEGORIES) {
      // Use the localized label where available; fall back to the raw value.
      // We don't import LABELS to avoid duplicating it; instead probe by URL.
      const href = `/browse?category=${encodeURIComponent(c)}`
      const link = screen.getAllByRole('link').find((el) => el.getAttribute('href') === href)
      expect(link, `expected a link to ${href}`).toBeDefined()
    }
  })

  it('marks the active chip when active matches a category', () => {
    renderWithRouter(<CategoryChips active="Coding" />)
    const coding = screen
      .getAllByRole('link')
      .find((el) => el.getAttribute('href') === '/browse?category=Coding')
    expect(coding?.className).toContain('bg-ink')
  })

  it('treats no active prop as "전체" being active', () => {
    renderWithRouter(<CategoryChips />)
    const all = screen.getByRole('link', { name: /전체/ })
    expect(all.className).toContain('bg-ink')
  })
})
