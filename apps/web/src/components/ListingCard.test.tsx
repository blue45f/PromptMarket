import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import ListingCard from './ListingCard'

function withProviders(node: React.ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return (
    <MemoryRouter>
      <QueryClientProvider client={qc}>{node}</QueryClientProvider>
    </MemoryRouter>
  )
}

const listing = {
  id: 'l1',
  slug: 'test-listing',
  title: 'My Test Listing',
  type: 'PROMPT' as const,
  description: 'A test listing description.',
  category: 'Coding',
  tags: [],
  models: ['claude-opus-4-7'],
  technique: null,
  difficulty: 'intermediate' as const,
  license: 'MIT' as const,
  version: '1.0.0',
  priceCents: 199,
  coverEmoji: '✨',
  downloads: 42,
  avgRating: 4.5,
  reviewCount: 8,
  createdAt: '2026-05-01T00:00:00Z',
  author: { id: 'a1', username: 'testauthor' },
}

describe('<ListingCard />', () => {
  it('renders the listing title', () => {
    render(withProviders(<ListingCard listing={listing} />))
    expect(screen.getByText('My Test Listing')).toBeTruthy()
  })

  it('renders the author username', () => {
    render(withProviders(<ListingCard listing={listing} />))
    expect(screen.getByText('@testauthor')).toBeTruthy()
  })

  it('shows "$1.99" for priceCents=199', () => {
    render(withProviders(<ListingCard listing={listing} />))
    expect(screen.getByText('$1.99')).toBeTruthy()
  })

  it('shows "Free" for priceCents=0', () => {
    render(withProviders(<ListingCard listing={{ ...listing, priceCents: 0 }} />))
    expect(screen.getByText('Free')).toBeTruthy()
  })

  it('wraps in a link to /listings/test-listing', () => {
    render(withProviders(<ListingCard listing={listing} />))
    const link = screen.getByRole('link')
    expect(link.getAttribute('href')?.includes('test-listing')).toBeTruthy()
  })

  it('renders download count "42"', () => {
    render(withProviders(<ListingCard listing={listing} />))
    expect(screen.getByText('42')).toBeTruthy()
  })

  it('shows a "no reviews yet" label instead of empty stars when unrated', () => {
    render(withProviders(<ListingCard listing={{ ...listing, reviewCount: 0, avgRating: 0 }} />))
    expect(screen.getByText('아직 리뷰 없음')).toBeTruthy()
  })

  it('shows the rating (not the unrated label) once the listing has reviews', () => {
    render(withProviders(<ListingCard listing={listing} />))
    expect(screen.queryByText('아직 리뷰 없음')).toBeNull()
  })
})
