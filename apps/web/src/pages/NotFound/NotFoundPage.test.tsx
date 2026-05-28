import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import NotFoundPage from './NotFoundPage';

vi.mock('@hooks/useRecentlyViewed', () => ({
  useRecentlyViewed: () => ({ slugs: [], clear: vi.fn() }),
}));

function withProviders(node: React.ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <MemoryRouter initialEntries={['/missing-page']}>
      <QueryClientProvider client={qc}>{node}</QueryClientProvider>
    </MemoryRouter>
  );
}

describe('NotFoundPage', () => {
  it('renders the 이 페이지는 heading', () => {
    render(withProviders(<NotFoundPage />));
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading.textContent?.includes('이 페이지는')).toBeTruthy();
  });

  it('has a 홈으로 link', () => {
    render(withProviders(<NotFoundPage />));
    expect(screen.getByRole('link', { name: /홈으로/ })).toBeTruthy();
  });

  it('shows 카탈로그 둘러보기 suggestion link', () => {
    render(withProviders(<NotFoundPage />));
    expect(screen.getByRole('link', { name: /카탈로그 둘러보기/ })).toBeTruthy();
  });

  it('검색 팔레트 열기 button dispatches a keydown event', () => {
    render(withProviders(<NotFoundPage />));
    const spy = vi.spyOn(window, 'dispatchEvent');
    fireEvent.click(screen.getByRole('button', { name: /검색 팔레트 열기/ }));
    expect(spy).toHaveBeenCalled();
  });
});
