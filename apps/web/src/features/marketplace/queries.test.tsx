import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import {
  useListing,
  useListings,
  useMe,
  useRelated,
  useLogin,
  useCreateListing,
} from './queries';

const authState = { token: null as string | null, user: null, setUser: vi.fn(), login: vi.fn(), logout: vi.fn() };
vi.mock('@store/auth', () => ({
  useAuthStore: vi.fn((selector?: (s: typeof authState) => unknown) =>
    selector ? selector(authState) : authState,
  ),
}));

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <MemoryRouter>
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    </MemoryRouter>
  );
}

describe('marketplace query hooks', () => {
  it('useListing is disabled when slug is undefined', () => {
    const { result } = renderHook(() => useListing(undefined), { wrapper });
    expect(result.current.fetchStatus).toBe('idle');
  });

  it('useListing is enabled when slug is provided', () => {
    const { result } = renderHook(() => useListing('my-slug'), { wrapper });
    expect(result.current.fetchStatus).toBe('fetching');
  });

  it('useMe is disabled when no token', () => {
    const { result } = renderHook(() => useMe(), { wrapper });
    expect(result.current.fetchStatus).toBe('idle');
  });

  it('useListings starts fetching with default params', () => {
    const { result } = renderHook(() => useListings({}), { wrapper });
    expect(result.current.fetchStatus).toBe('fetching');
  });

  it('mutation hooks return mutateAsync function', () => {
    const { result: loginResult } = renderHook(() => useLogin(), { wrapper });
    expect(typeof loginResult.current.mutateAsync).toBe('function');

    const { result: createResult } = renderHook(() => useCreateListing(), { wrapper });
    expect(typeof createResult.current.mutateAsync).toBe('function');
  });

  it('useRelated is disabled when id is undefined', () => {
    const { result } = renderHook(() => useRelated(undefined), { wrapper });
    expect(result.current.fetchStatus).toBe('idle');
  });
});
