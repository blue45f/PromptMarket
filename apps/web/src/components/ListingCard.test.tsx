import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
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

  it('shows the localized free label for priceCents=0', () => {
    render(withProviders(<ListingCard listing={{ ...listing, priceCents: 0 }} />))
    expect(screen.getByText('무료')).toBeTruthy()
  })

  it('wraps in a link to /listings/test-listing', () => {
    render(withProviders(<ListingCard listing={listing} />))
    const link = screen.getByRole('link')
    expect(link.getAttribute('href')?.includes('test-listing')).toBeTruthy()
  })

  it('mirrors the hover affordance for keyboard focus', () => {
    render(withProviders(<ListingCard listing={listing} />))
    const link = screen.getByRole('link')
    expect(link.className).toContain('focus-visible:border-volt-400/70')
    expect(link.className).toContain('dark:focus-visible:border-volt-500/40')
    expect(link.className).toContain(
      'focus-visible:shadow-[0_28px_60px_-32px_oklch(0.65_0.18_125/0.45)]'
    )
  })

  it('keeps default card summaries denser on mobile', () => {
    render(withProviders(<ListingCard listing={listing} />))
    const description = screen.getByText('A test listing description.').closest('p')
    expect(description?.className).toContain('line-clamp-1')
    expect(description?.className).toContain('sm:line-clamp-2')
    expect(description?.className.split(' ')).not.toContain('min-h-[2.5rem]')
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

  it('shows compact artifact trust signals for quick marketplace scanning', () => {
    render(
      withProviders(<ListingCard listing={{ ...listing, models: ['claude-code', 'cursor'] }} />)
    )
    expect(screen.getByText('설치 준비')).toBeTruthy()
    expect(screen.getByText('검증 리뷰')).toBeTruthy()
  })

  it('exposes an optional compare toggle without navigating the card', () => {
    const onToggle = vi.fn()
    render(
      withProviders(
        <ListingCard listing={listing} compare={{ selected: false, onToggle, disabled: false }} />
      )
    )

    fireEvent.click(screen.getByRole('button', { name: '비교에 추가: My Test Listing' }))
    expect(onToggle).toHaveBeenCalledWith(listing)
  })
})
