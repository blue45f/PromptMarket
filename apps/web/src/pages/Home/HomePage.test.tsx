import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import HomePage from './HomePage'

vi.mock('@features/marketplace/queries', () => ({
  useListings: vi.fn(() => ({ data: { items: [] }, isPending: false, error: null })),
  useStats: vi.fn(() => ({ data: null })),
}))
vi.mock('@hooks/useRecentlyViewed', () => ({
  useRecentlyViewed: vi.fn(() => ({ slugs: [], record: vi.fn(), clear: vi.fn() })),
}))
vi.mock('@hooks/usePageMeta', () => ({ usePageMeta: vi.fn() }))
vi.mock('@hooks/useStructuredData', () => ({ useStructuredData: vi.fn() }))
vi.mock('@hooks/useReveal', () => ({
  useReveal: vi.fn(() => ({ ref: { current: null }, revealed: false })),
}))
vi.mock('@hooks/useSpotlight', () => ({
  useSpotlight: vi.fn(() => ({ current: null })),
}))
vi.mock('@components/Hero', () => ({
  default: () => (
    <section data-home-hero data-testid="hero">
      Hero
    </section>
  ),
}))
vi.mock('@components/StatsStrip', () => ({ default: () => null }))
vi.mock('@components/CategoryChips', () => ({ default: () => <div>CategoryChips</div> }))
vi.mock('@components/FeaturedCarousel', () => ({
  default: () => <div>FeaturedCarousel</div>,
}))
vi.mock('@components/ModelTabs', () => ({ default: () => <div>ModelTabs</div> }))
vi.mock('@components/RecentlyViewed', () => ({ default: () => null }))
vi.mock('@components/ListingCard', () => ({ default: () => <div data-testid="listing-card" /> }))
vi.mock('@components/SkeletonCard', () => ({
  default: () => <div data-testid="skeleton-card" />,
  SkeletonGrid: () => <div data-testid="skeleton-grid" />,
}))
vi.mock('@components/EmptyState', () => ({
  default: ({ title }: { title: string }) => <div data-testid="empty-state">{title}</div>,
}))

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <MemoryRouter>
      <QueryClientProvider client={qc}>
        <HomePage />
      </QueryClientProvider>
    </MemoryRouter>
  )
}

describe('HomePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders the Hero component', () => {
    renderPage()
    expect(screen.getByTestId('hero')).toBeTruthy()
  })

  it('renders the trending section heading', () => {
    renderPage()
    expect(screen.getByText('이번 주 뜨거워요')).toBeTruthy()
  })

  it('renders the recent section heading', () => {
    renderPage()
    expect(screen.getByText('방금 작업장에서 나왔어요')).toBeTruthy()
  })

  it('keeps the top scroll progress scoped to the hero range', async () => {
    let scrollY = 0
    vi.spyOn(window, 'scrollY', 'get').mockImplementation(() => scrollY)
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      callback(0)
      return 1
    })
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined)
    vi.spyOn(HTMLElement.prototype, 'offsetTop', 'get').mockImplementation(() => 0)
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(function (
      this: HTMLElement
    ) {
      return this.hasAttribute('data-home-hero') ? 800 : 0
    })

    const { container } = renderPage()
    const progress = container.querySelector('.scroll-progress') as HTMLElement

    expect(progress.style.getPropertyValue('--progress')).toBe('0')

    scrollY = 400
    window.dispatchEvent(new Event('scroll'))
    await waitFor(() => expect(progress.style.getPropertyValue('--progress')).toBe('0.5'))
    expect(progress.className).not.toContain('is-complete')

    scrollY = 900
    window.dispatchEvent(new Event('scroll'))
    await waitFor(() => expect(progress.style.getPropertyValue('--progress')).toBe('1'))
    expect(progress.className).toContain('is-complete')
  })
})
