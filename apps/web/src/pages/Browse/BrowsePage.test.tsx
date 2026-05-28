import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import BrowsePage from './BrowsePage';

const { mockUseListings } = vi.hoisted(() => ({
  mockUseListings: vi.fn(() => ({ data: null as unknown, isPending: true, error: null })),
}));

vi.mock('@features/marketplace/queries', () => ({
  useListings: mockUseListings,
}));

vi.mock('@hooks/useSavedFilters', () => ({
  useSavedFilters: vi.fn(() => ({
    entries: [],
    save: vi.fn(),
    remove: vi.fn(),
  })),
}));

vi.mock('@hooks/useScrollRestore', () => ({ useScrollRestore: vi.fn() }));

vi.mock('@hooks/usePageMeta', () => ({ usePageMeta: vi.fn() }));

function withProviders(node: React.ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <MemoryRouter>
      <QueryClientProvider client={qc}>{node}</QueryClientProvider>
    </MemoryRouter>
  );
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
};

describe('<BrowsePage />', () => {
  it('shows skeleton cards while loading', () => {
    mockUseListings.mockReturnValue({ data: null, isPending: true, error: null });
    const { container } = render(withProviders(<BrowsePage />));
    const pulseEls = container.querySelectorAll('[class*="animate-pulse"]');
    expect(pulseEls.length > 0).toBeTruthy();
  });

  it('renders the "둘러보기" h1 heading', () => {
    mockUseListings.mockReturnValue({ data: null, isPending: true, error: null });
    render(withProviders(<BrowsePage />));
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading.textContent).toContain('둘러보기');
  });

  it('renders the FilterPanel with "타입" section label', () => {
    mockUseListings.mockReturnValue({ data: null, isPending: true, error: null });
    render(withProviders(<BrowsePage />));
    expect(screen.getByText('타입')).toBeTruthy();
  });

  it('renders listing cards when useListings returns data with items', () => {
    mockUseListings.mockReturnValue({
      data: { items: [card], total: 1, totalPages: 1 },
      isPending: false,
      error: null,
    });
    render(withProviders(<BrowsePage />));
    expect(screen.getByText('Browse Test Listing')).toBeTruthy();
  });
});
