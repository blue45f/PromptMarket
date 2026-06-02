import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import ListingDetailPage from './ListingDetailPage'
import {
  useListing,
  usePurchase,
  useCreateReview,
  useCreateReviewReply,
} from '@features/marketplace/queries'
import { useAuthStore } from '@store/auth'

vi.mock('@features/marketplace/queries', () => ({
  useListing: vi.fn(),
  usePurchase: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useCreateReview: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useCreateReviewReply: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
}))

vi.mock('@store/auth', () => ({ useAuthStore: vi.fn() }))

vi.mock('@hooks/useRecentlyViewed', () => ({
  useRecentlyViewed: vi.fn(() => ({ slugs: [], track: vi.fn(), clear: vi.fn() })),
}))

vi.mock('@hooks/useWishlist', () => ({
  useWishlist: vi.fn(() => ({ slugs: [], has: () => false, toggle: vi.fn(), clear: vi.fn() })),
}))

vi.mock('@hooks/usePageMeta', () => ({ usePageMeta: vi.fn() }))

vi.mock('@hooks/useStructuredData', () => ({ useStructuredData: vi.fn() }))

vi.mock('@components/RelatedListings', () => ({
  default: () => <div data-testid="related-listings" />,
}))

vi.mock('@components/RecentlyViewed', () => ({
  default: () => <div data-testid="recently-viewed" />,
}))

vi.mock('@components/WishlistButton', () => ({
  default: () => <button type="button">wishlist</button>,
}))

vi.mock('@components/InstallPanel', () => ({
  default: () => <div data-testid="install-panel" />,
}))

const mockListing = {
  id: 'l1',
  slug: 'test-slug',
  title: 'Test Listing Title',
  type: 'PROMPT' as const,
  description: 'A great prompt',
  category: 'Coding',
  tags: [],
  models: ['claude-opus-4-7'],
  technique: null,
  difficulty: 'intermediate' as const,
  license: 'MIT' as const,
  version: '1.0.0',
  priceCents: 499,
  coverEmoji: '✨',
  downloads: 10,
  avgRating: 4.5,
  reviewCount: 2,
  createdAt: '2026-05-01T00:00:00Z',
  updatedAt: '2026-05-01T00:00:00Z',
  body: '# Test Body\n\nSome content here.',
  previewBody: '# Test Body',
  author: { id: 'a1', username: 'testauthor' },
}

function makeClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } })
}

function renderPage() {
  return render(
    <QueryClientProvider client={makeClient()}>
      <MemoryRouter initialEntries={['/listings/test-slug']}>
        <Routes>
          <Route path="/listings/:slug" element={<ListingDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

beforeEach(() => {
  ;(useAuthStore as unknown as Mock).mockReturnValue({ token: null, user: null })
  ;(useCreateReviewReply as unknown as Mock).mockReturnValue({
    mutateAsync: vi.fn(),
    isPending: false,
  })
})

describe('<ListingDetailPage />', () => {
  it('shows skeleton while loading', () => {
    ;(useListing as unknown as Mock).mockReturnValue({ data: null, isPending: true, error: null })
    const { container } = renderPage()
    expect(container.querySelector('[class*="animate-pulse"]')).toBeTruthy()
  })

  it('shows error message when data fails', () => {
    ;(useListing as unknown as Mock).mockReturnValue({
      data: null,
      isPending: false,
      error: new Error('not found'),
    })
    renderPage()
    expect(screen.getByText('not found')).toBeTruthy()
  })

  it('shows the listing title when loaded', () => {
    ;(useListing as unknown as Mock).mockReturnValue({
      data: { ...mockListing, reviews: [], isOwner: false, isPurchased: false, canViewBody: true },
      isPending: false,
      error: null,
    })
    renderPage()
    expect(screen.getAllByRole('heading', { level: 1 }).length).toBeGreaterThan(0)
    expect(screen.getAllByText('Test Listing Title').length).toBeGreaterThan(0)
  })

  it('shows the author username', () => {
    ;(useListing as unknown as Mock).mockReturnValue({
      data: { ...mockListing, reviews: [], isOwner: false, isPurchased: false, canViewBody: true },
      isPending: false,
      error: null,
    })
    renderPage()
    expect(screen.getAllByText(/@testauthor/i).length).toBeGreaterThan(0)
  })

  it('shows the price for priceCents=499', () => {
    ;(useListing as unknown as Mock).mockReturnValue({
      data: { ...mockListing, reviews: [], isOwner: false, isPurchased: false, canViewBody: true },
      isPending: false,
      error: null,
    })
    renderPage()
    expect(screen.getAllByText('$4.99').length).toBeGreaterThan(0)
  })

  it('shows a buyer decision checklist in the detail sidebar', () => {
    ;(useListing as unknown as Mock).mockReturnValue({
      data: { ...mockListing, reviews: [], isOwner: false, isPurchased: false, canViewBody: true },
      isPending: false,
      error: null,
    })
    renderPage()
    expect(screen.getByRole('heading', { name: '구매 전 체크' })).toBeTruthy()
    expect(screen.getByText('설치 준비')).toBeTruthy()
    expect(screen.getByText('검증 리뷰')).toBeTruthy()
  })

  it('shows run readiness from preview variables before purchase', () => {
    ;(useListing as unknown as Mock).mockReturnValue({
      data: {
        ...mockListing,
        models: ['claude-opus-4-7', 'gpt-5'],
        previewBody: 'Draft for {{audience}} in {{tone}}.',
        reviews: [],
        isOwner: false,
        isPurchased: false,
        canViewBody: false,
      },
      isPending: false,
      error: null,
    })
    renderPage()
    expect(screen.getByRole('heading', { name: '실행 준비도' })).toBeTruthy()
    expect(screen.getByText('audience')).toBeTruthy()
    expect(screen.getByText('tone')).toBeTruthy()
    expect(screen.getByText('미리보기 기준')).toBeTruthy()
    expect(screen.getAllByText('2개 모델').length).toBeGreaterThan(0)
  })

  it('shows an insufficient-balance hint with a /dashboard top-up link when short', () => {
    ;(useAuthStore as unknown as Mock).mockReturnValue({
      token: 't',
      user: { id: 'u1', username: 'buyer', balanceCents: 100 },
    })
    ;(useListing as unknown as Mock).mockReturnValue({
      data: { ...mockListing, reviews: [], isOwner: false, isPurchased: false, canViewBody: true },
      isPending: false,
      error: null,
    })
    renderPage()
    // Both desktop sidebar and mobile bar render a top-up link when short.
    const topUps = screen.getAllByRole('link', { name: /충전하기|Top up/i })
    expect(topUps.length).toBeGreaterThanOrEqual(1)
    expect(topUps[0].getAttribute('href')).toBe('/dashboard')
  })

  it('hides the insufficient-balance hint when the wallet covers the price', () => {
    ;(useAuthStore as unknown as Mock).mockReturnValue({
      token: 't',
      user: { id: 'u1', username: 'buyer', balanceCents: 99999 },
    })
    ;(useListing as unknown as Mock).mockReturnValue({
      data: { ...mockListing, reviews: [], isOwner: false, isPurchased: false, canViewBody: true },
      isPending: false,
      error: null,
    })
    renderPage()
    expect(screen.queryByRole('link', { name: /충전하기|Top up/i })).toBeNull()
  })

  it('shows review replies and lets a signed-in user add a reply inline', async () => {
    const replyMock = vi.fn().mockResolvedValue({ id: 'reply-new' })
    ;(useCreateReviewReply as unknown as Mock).mockReturnValue({
      mutateAsync: replyMock,
      isPending: false,
    })
    ;(useAuthStore as unknown as Mock).mockReturnValue({
      token: 't',
      user: { id: 'u2', username: 'maker', balanceCents: 99999 },
    })
    ;(useListing as unknown as Mock).mockReturnValue({
      data: {
        ...mockListing,
        reviews: [
          {
            id: 'review-1',
            rating: 5,
            comment: '설치가 쉬웠어요.',
            createdAt: '2026-05-02T00:00:00Z',
            user: { id: 'u1', username: 'buyer' },
            replies: [
              {
                id: 'reply-1',
                body: '사용 사례 공유 감사합니다.',
                createdAt: '2026-05-03T00:00:00Z',
                user: { id: 'u2', username: 'maker' },
              },
            ],
          },
        ],
        isOwner: false,
        isPurchased: true,
        canViewBody: true,
      },
      isPending: false,
      error: null,
    })

    renderPage()
    const reviewsTab = screen.getByRole('tab', { name: /리뷰/ })
    fireEvent.mouseDown(reviewsTab, { button: 0, ctrlKey: false })
    fireEvent.mouseUp(reviewsTab)
    fireEvent.click(reviewsTab)
    await waitFor(() => {
      expect(reviewsTab.getAttribute('data-state')).toBe('active')
    })

    expect(await screen.findByText('답글 1개')).toBeTruthy()
    expect(screen.getByText('사용 사례 공유 감사합니다.')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: '답글 남기기' }))
    fireEvent.change(screen.getByLabelText('답글 입력'), {
      target: { value: '저도 같은 방식으로 해결했습니다.' },
    })
    fireEvent.click(screen.getByRole('button', { name: '답글 등록' }))

    await waitFor(() => {
      expect(replyMock).toHaveBeenCalledWith({
        reviewId: 'review-1',
        body: '저도 같은 방식으로 해결했습니다.',
      })
    })
  })
})
