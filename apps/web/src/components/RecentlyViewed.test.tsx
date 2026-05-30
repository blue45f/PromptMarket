import { describe, it, expect, vi, type Mock } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import RecentlyViewed from './RecentlyViewed'
import { useRecentlyViewed } from '@hooks/useRecentlyViewed'

vi.mock('@hooks/useRecentlyViewed', () => ({
  useRecentlyViewed: vi.fn(),
}))

vi.mock('./ListingCard', () => ({
  default: ({ listing }: { listing: { id: string; title: string } }) => (
    <div data-testid="listing-card">{listing.title}</div>
  ),
}))

function makeClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } })
}

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <MemoryRouter>
      <QueryClientProvider client={makeClient()}>{children}</QueryClientProvider>
    </MemoryRouter>
  )
}

describe('<RecentlyViewed />', () => {
  it('returns null when slugs is empty', () => {
    ;(useRecentlyViewed as unknown as Mock).mockReturnValue({ slugs: [], clear: vi.fn() })
    const { container } = render(<RecentlyViewed />, { wrapper: Wrapper })
    expect(container.firstChild).toBeNull()
  })

  it('renders the "최근 본" section label when slugs are present', () => {
    ;(useRecentlyViewed as unknown as Mock).mockReturnValue({ slugs: ['slug-1'], clear: vi.fn() })
    render(<RecentlyViewed />, { wrapper: Wrapper })
    expect(screen.getByText(/최근 본/i)).toBeTruthy()
  })

  it('renders the "돌아가서 마저 볼만한" heading when slugs are present', () => {
    ;(useRecentlyViewed as unknown as Mock).mockReturnValue({ slugs: ['slug-1'], clear: vi.fn() })
    render(<RecentlyViewed />, { wrapper: Wrapper })
    expect(screen.getByText('돌아가서 마저 볼만한')).toBeTruthy()
  })

  it('calls clear only after two-step confirm', () => {
    const clear = vi.fn()
    ;(useRecentlyViewed as unknown as Mock).mockReturnValue({ slugs: ['slug-1'], clear })
    render(<RecentlyViewed />, { wrapper: Wrapper })
    // First click shows the confirmation buttons — clear not yet called.
    fireEvent.click(screen.getByText('기록 지우기'))
    expect(clear).not.toHaveBeenCalled()
    // Second click on the confirm button actually calls clear.
    fireEvent.click(screen.getByText('삭제'))
    expect(clear).toHaveBeenCalledTimes(1)
  })
})
