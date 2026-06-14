import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import FeaturedCarousel from './FeaturedCarousel'

function withProviders(node: React.ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return (
    <MemoryRouter>
      <QueryClientProvider client={qc}>{node}</QueryClientProvider>
    </MemoryRouter>
  )
}

const card = {
  id: 'l1',
  slug: 'l1-slug',
  title: 'Card 1',
  type: 'PROMPT' as const,
  description: 'd',
  category: 'Coding',
  tags: [],
  models: [],
  author: { id: 'author-1', username: 'author-1' },
  technique: null,
  difficulty: 'intermediate' as const,
  license: 'MIT' as const,
  version: '1.0.0',
  priceCents: 0,
  coverEmoji: '✨',
  downloads: 0,
  avgRating: 0,
  reviewCount: 0,
  createdAt: '2026-05-01T00:00:00Z',
}

describe('<FeaturedCarousel />', () => {
  it('renders 6 SkeletonCards while loading', () => {
    const { container } = render(withProviders(<FeaturedCarousel items={[]} loading />))
    // SkeletonCard renders inside a fixed-width wrapper. There should be 6.
    const wrappers = container.querySelectorAll('.snap-start')
    expect(wrappers.length).toBe(6)
  })

  it('renders one ListingCard per item when not loading', () => {
    render(
      withProviders(<FeaturedCarousel items={[card, { ...card, id: 'l2', title: 'Card 2' }]} />)
    )
    expect(screen.getByText('Card 1')).toBeTruthy()
    expect(screen.getByText('Card 2')).toBeTruthy()
  })

  it('exposes the rail as a region with an accessible label', () => {
    render(withProviders(<FeaturedCarousel items={[card]} />))
    expect(screen.getByRole('region', { name: '추천 리스팅' })).toBeTruthy()
  })
})
