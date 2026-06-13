import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

// useTilt + useWishlist + useQueryClient.prefetch all reach into APIs the
// jsdom shim covers, but they're harmless under tests.

import RelatedListings from './RelatedListings'

const mockUseRelated = vi.fn()
vi.mock('@features/marketplace/queries', () => ({
  useRelated: (...args: unknown[]) => mockUseRelated(...args),
}))

function withProviders(node: React.ReactNode) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return (
    <MemoryRouter>
      <QueryClientProvider client={qc}>{node}</QueryClientProvider>
    </MemoryRouter>
  )
}

const card = {
  id: 'l1',
  slug: 'l1-slug',
  title: 'Card title',
  type: 'PROMPT',
  description: 'desc',
  category: 'Coding',
  tags: [],
  models: [],
  technique: null,
  difficulty: 'intermediate',
  license: 'MIT',
  version: '1.0.0',
  priceCents: 0,
  coverEmoji: '✨',
  downloads: 0,
  avgRating: 0,
  reviewCount: 0,
  createdAt: '2026-05-01T00:00:00Z',
}

describe('<RelatedListings />', () => {
  it('renders 4 skeleton placeholders while pending', () => {
    mockUseRelated.mockReturnValue({ data: undefined, isPending: true })
    render(withProviders(<RelatedListings listingId="l1" />))
    // SkeletonCard renders into the .cards-fluid grid; we can locate them by
    // testing for the grid container class.
    const grids = document.querySelectorAll('.cards-fluid')
    expect(grids.length).toBe(1)
    // The skeleton container has 4 children.
    expect(grids[0].children.length).toBe(4)
  })

  it('renders the Korean empty-state hint when items is []', () => {
    mockUseRelated.mockReturnValue({ data: { items: [] }, isPending: false })
    render(withProviders(<RelatedListings listingId="l1" />))
    expect(screen.getByText('아직 관련 리스팅이 없어요.')).toBeTruthy()
  })

  it('normalises the legacy bare-array API shape', () => {
    mockUseRelated.mockReturnValue({ data: [card], isPending: false })
    render(withProviders(<RelatedListings listingId="l1" />))
    expect(screen.getByText('Card title')).toBeTruthy()
  })

  it('normalises the modern { items: [...] } API shape', () => {
    mockUseRelated.mockReturnValue({
      data: { items: [card] },
      isPending: false,
    })
    render(withProviders(<RelatedListings listingId="l1" />))
    expect(screen.getByText('Card title')).toBeTruthy()
  })
})
