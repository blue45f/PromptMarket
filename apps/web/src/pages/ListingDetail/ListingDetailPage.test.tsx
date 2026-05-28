import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ListingDetailPage from './ListingDetailPage';
import { useListing, usePurchase, useCreateReview } from '@features/marketplace/queries';
import { useAuthStore } from '@store/auth';

vi.mock('@features/marketplace/queries', () => ({
  useListing: vi.fn(),
  usePurchase: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useCreateReview: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
}));

vi.mock('@store/auth', () => ({ useAuthStore: vi.fn() }));

vi.mock('@hooks/useRecentlyViewed', () => ({
  useRecentlyViewed: vi.fn(() => ({ slugs: [], track: vi.fn(), clear: vi.fn() })),
}));

vi.mock('@hooks/useWishlist', () => ({
  useWishlist: vi.fn(() => ({ slugs: [], has: () => false, toggle: vi.fn(), clear: vi.fn() })),
}));

vi.mock('@hooks/usePageMeta', () => ({ usePageMeta: vi.fn() }));

vi.mock('@hooks/useStructuredData', () => ({ useStructuredData: vi.fn() }));

vi.mock('@components/RelatedListings', () => ({
  default: () => <div data-testid="related-listings" />,
}));

vi.mock('@components/RecentlyViewed', () => ({
  default: () => <div data-testid="recently-viewed" />,
}));

vi.mock('@components/WishlistButton', () => ({
  default: () => <button type="button">wishlist</button>,
}));

vi.mock('@components/InstallPanel', () => ({
  default: () => <div data-testid="install-panel" />,
}));

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
};

function makeClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function renderPage() {
  return render(
    <QueryClientProvider client={makeClient()}>
      <MemoryRouter initialEntries={['/listings/test-slug']}>
        <Routes>
          <Route path="/listings/:slug" element={<ListingDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  (useAuthStore as unknown as Mock).mockReturnValue({ token: null, user: null });
});

describe('<ListingDetailPage />', () => {
  it('shows skeleton while loading', () => {
    (useListing as unknown as Mock).mockReturnValue({ data: null, isPending: true, error: null });
    const { container } = renderPage();
    expect(container.querySelector('[class*="animate-pulse"]')).toBeTruthy();
  });

  it('shows error message when data fails', () => {
    (useListing as unknown as Mock).mockReturnValue({
      data: null,
      isPending: false,
      error: new Error('not found'),
    });
    renderPage();
    expect(screen.getByText('not found')).toBeTruthy();
  });

  it('shows the listing title when loaded', () => {
    (useListing as unknown as Mock).mockReturnValue({
      data: { listing: mockListing, reviews: [] },
      isPending: false,
      error: null,
    });
    renderPage();
    expect(screen.getAllByRole('heading', { level: 1 }).length).toBeGreaterThan(0);
    expect(screen.getAllByText('Test Listing Title').length).toBeGreaterThan(0);
  });

  it('shows the author username', () => {
    (useListing as unknown as Mock).mockReturnValue({
      data: { listing: mockListing, reviews: [] },
      isPending: false,
      error: null,
    });
    renderPage();
    expect(screen.getAllByText(/@testauthor/i).length).toBeGreaterThan(0);
  });

  it('shows the price for priceCents=499', () => {
    (useListing as unknown as Mock).mockReturnValue({
      data: { listing: mockListing, reviews: [] },
      isPending: false,
      error: null,
    });
    renderPage();
    expect(screen.getAllByText('$4.99').length).toBeGreaterThan(0);
  });
});
