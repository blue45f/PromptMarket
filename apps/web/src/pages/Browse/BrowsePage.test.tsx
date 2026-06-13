import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, it, expect, vi } from 'vitest'

import BrowsePage from './BrowsePage'

const { mockUseListings } = vi.hoisted(() => ({
  mockUseListings: vi.fn(() => ({ data: null as unknown, isPending: true, error: null })),
}))

const { mockUseSearchHistory } = vi.hoisted(() => ({
  mockUseSearchHistory: vi.fn(() => ({
    entries: [],
    record: vi.fn(),
    remove: vi.fn(),
    clear: vi.fn(),
  })),
}))

vi.mock('@features/marketplace/queries', () => ({
  useListings: mockUseListings,
}))

vi.mock('@hooks/useSearchHistory', () => ({
  useSearchHistory: mockUseSearchHistory,
}))

vi.mock('@hooks/useSavedFilters', () => ({
  useSavedFilters: vi.fn(() => ({
    entries: [],
    save: vi.fn(),
    remove: vi.fn(),
  })),
}))

vi.mock('@hooks/useScrollRestore', () => ({ useScrollRestore: vi.fn() }))

vi.mock('@hooks/usePageMeta', () => ({ usePageMeta: vi.fn() }))

function withProviders(node: React.ReactNode, initialEntries = ['/browse']) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return (
    <MemoryRouter initialEntries={initialEntries}>
      <QueryClientProvider client={qc}>{node}</QueryClientProvider>
    </MemoryRouter>
  )
}

const card = {
  id: 'l1',
  slug: 'test-listing',
  title: 'Browse Test Listing',
  type: 'PROMPT' as const,
  description: 'A test description.',
  category: 'Coding',
  tags: [],
  models: [],
  author: { id: 'a1', username: 'author' },
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

describe('<BrowsePage />', () => {
  beforeEach(() => {
    mockUseListings.mockReturnValue({ data: null as unknown, isPending: true, error: null })
    mockUseSearchHistory.mockReturnValue({
      entries: [],
      record: vi.fn(),
      remove: vi.fn(),
      clear: vi.fn(),
    })
  })

  it('records a URL query into search history', () => {
    const recordMock = vi.fn()
    mockUseSearchHistory.mockReturnValue({
      entries: [],
      record: recordMock,
      remove: vi.fn(),
      clear: vi.fn(),
    })
    render(withProviders(<BrowsePage />, ['/browse?q=  prompt  ']))

    expect(recordMock).toHaveBeenCalledWith('prompt')
  })

  it('ignores URL-only whitespace query for search history', () => {
    const recordMock = vi.fn()
    mockUseSearchHistory.mockReturnValue({
      entries: [],
      record: recordMock,
      remove: vi.fn(),
      clear: vi.fn(),
    })
    render(withProviders(<BrowsePage />, ['/browse?q=   ']))

    expect(recordMock).not.toHaveBeenCalled()
  })

  it('shows skeleton cards while loading', () => {
    mockUseListings.mockReturnValue({ data: null, isPending: true, error: null })
    const { container } = render(withProviders(<BrowsePage />))
    const pulseEls = container.querySelectorAll('[class*="animate-pulse"]')
    expect(pulseEls.length > 0).toBeTruthy()
  })

  it('renders the "둘러보기" h1 heading', () => {
    mockUseListings.mockReturnValue({ data: null, isPending: true, error: null })
    render(withProviders(<BrowsePage />))
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading.textContent).toContain('둘러보기')
  })

  it('renders the FilterPanel with "타입" section label', () => {
    mockUseListings.mockReturnValue({ data: null, isPending: true, error: null })
    render(withProviders(<BrowsePage />))
    expect(screen.getByText('타입')).toBeTruthy()
  })

  it('renders listing cards when useListings returns data with items', () => {
    mockUseListings.mockReturnValue({
      data: { items: [card], total: 1, totalPages: 1 },
      isPending: false,
      error: null,
    })
    render(withProviders(<BrowsePage />))
    expect(screen.getByText('Browse Test Listing')).toBeTruthy()
  })

  it('passes the reviewed trust signal URL filter to the listings query', () => {
    mockUseListings.mockReturnValue({
      data: {
        items: [
          { ...card, id: 'reviewed', slug: 'reviewed', title: 'Reviewed prompt', reviewCount: 2 },
          { ...card, id: 'quiet', slug: 'quiet', title: 'Quiet prompt', reviewCount: 0 },
        ],
        total: 2,
        totalPages: 1,
      },
      isPending: false,
      error: null,
    })
    render(withProviders(<BrowsePage />, ['/browse?signal=reviewed']))

    expect(screen.getByText('Reviewed prompt')).toBeTruthy()
    expect(screen.getAllByText('검증 리뷰').length).toBeGreaterThan(0)
    expect(mockUseListings).toHaveBeenLastCalledWith(
      expect.objectContaining({ signal: 'reviewed' })
    )
  })

  it('lets buyers select two listings and compare them from the browse grid', () => {
    mockUseListings.mockReturnValue({
      data: {
        items: [
          { ...card, id: 'alpha', slug: 'alpha', title: 'Alpha prompt', priceCents: 199 },
          {
            ...card,
            id: 'beta',
            slug: 'beta',
            title: 'Beta MCP',
            type: 'MCP_SERVER',
            priceCents: 0,
            reviewCount: 2,
          },
        ],
        total: 2,
        totalPages: 1,
      },
      isPending: false,
      error: null,
    })
    render(withProviders(<BrowsePage />))

    fireEvent.click(screen.getByRole('button', { name: '비교에 추가: Alpha prompt' }))
    fireEvent.click(screen.getByRole('button', { name: '비교에 추가: Beta MCP' }))

    expect(screen.getByRole('heading', { name: '비교 후보' })).toBeTruthy()
    expect(screen.getAllByText('Alpha prompt').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Beta MCP').length).toBeGreaterThan(0)
    expect(screen.getAllByText('$1.99').length).toBeGreaterThan(0)
    expect(screen.getAllByText('무료').length).toBeGreaterThan(0)
  })
})
