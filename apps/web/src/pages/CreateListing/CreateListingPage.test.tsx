import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CreateListingPage from './CreateListingPage';

vi.mock('@features/marketplace/queries', () => ({
  useCreateListing: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useListings: vi.fn(() => ({ data: { items: [] }, isPending: false })),
}));
vi.mock('@hooks/usePageMeta', () => ({ usePageMeta: vi.fn() }));
vi.mock('@components/ModelPicker', () => ({
  default: ({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) => (
    <div data-testid="model-picker" />
  ),
}));
vi.mock('@components/ListingCard', () => ({
  default: () => <div data-testid="listing-card" />,
}));
vi.mock('@components/MarkdownView', () => ({
  default: () => <div data-testid="markdown-view" />,
}));

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <MemoryRouter>
      <QueryClientProvider client={qc}>
        <CreateListingPage />
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

describe('CreateListingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the "기본" tab as active by default', () => {
    renderPage();
    expect(screen.getByRole('tab', { name: '기본' })).toBeTruthy();
    expect(
      screen.getByRole('tab', { name: '기본' }).getAttribute('data-state'),
    ).toBe('active');
  });

  it('renders the "본문" tab button', () => {
    renderPage();
    expect(screen.getByRole('tab', { name: '본문' })).toBeTruthy();
  });

  it('renders the "메타데이터" tab button', () => {
    renderPage();
    expect(screen.getByRole('tab', { name: '메타데이터' })).toBeTruthy();
  });

  it('shows the title input on the basics tab', () => {
    renderPage();
    const input = document.querySelector('input[name="title"]') as HTMLInputElement | null;
    expect(input).toBeTruthy();
    expect(input?.placeholder).toBe('SaaS 랜딩 페이지를 위한 살벌한 프롬프트');
  });
});
