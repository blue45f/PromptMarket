import { describe, expect, it, vi, beforeEach, type Mock } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

vi.mock('@store/auth', () => ({ useAuthStore: vi.fn() }))
vi.mock('@features/marketplace/queries', () => ({
  useMyListings: vi.fn(() => ({ data: [], isPending: false, error: null })),
  useMyPurchases: vi.fn(() => ({ data: [], isPending: false, error: null })),
  useTopup: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useListings: vi.fn(() => ({ data: { items: [] }, isPending: false })),
}))
vi.mock('@hooks/useWishlist', () => ({
  useWishlist: vi.fn(() => ({ slugs: [], isWishlisted: () => false, toggle: vi.fn() })),
}))
vi.mock('@hooks/usePageMeta', () => ({ usePageMeta: vi.fn() }))

import { useAuthStore } from '@store/auth'
import DashboardPage from './DashboardPage'

function withProviders(node: React.ReactNode, initialEntries = ['/dashboard']) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return (
    <MemoryRouter initialEntries={initialEntries}>
      <QueryClientProvider client={qc}>{node}</QueryClientProvider>
    </MemoryRouter>
  )
}

describe('<DashboardPage />', () => {
  beforeEach(() => {
    ;(useAuthStore as unknown as Mock).mockReturnValue({
      user: { id: 'u1', username: 'alice', balanceCents: 5000 },
    })
  })

  it('renders the "내 리스팅" tab', () => {
    render(withProviders(<DashboardPage />))
    expect(screen.getByRole('tab', { name: '내 리스팅' })).toBeTruthy()
  })

  it('renders the "라이브러리" tab', () => {
    render(withProviders(<DashboardPage />))
    expect(screen.getByRole('tab', { name: '라이브러리' })).toBeTruthy()
  })

  it('renders the "지갑" tab', () => {
    render(withProviders(<DashboardPage />))
    expect(screen.getByRole('tab', { name: '지갑' })).toBeTruthy()
  })

  it('shows empty state when there are no listings', () => {
    render(withProviders(<DashboardPage />))
    expect(screen.getByText('아직 등록한 리스팅이 없어요')).toBeTruthy()
  })

  it('opens the wishlist tab from a tab query parameter', () => {
    render(withProviders(<DashboardPage />, ['/dashboard?tab=wishlist']))
    expect(screen.getByRole('tab', { name: '위시리스트' }).getAttribute('aria-selected')).toBe(
      'true'
    )
    expect(screen.getByText('아직 담은 항목이 없어요')).toBeTruthy()
  })
})
