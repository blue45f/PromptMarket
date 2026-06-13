import { useSavedFilters } from '@hooks/useSavedFilters'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi } from 'vitest'

import CommandPalette from './CommandPalette'

vi.mock('@store/auth', () => ({
  useAuthStore: vi.fn((selector: (s: { token: string | null }) => unknown) =>
    selector({ token: null })
  ),
}))

vi.mock('@features/marketplace/queries', () => ({
  useListings: vi.fn(() => ({ data: null, isPending: false })),
}))

vi.mock('@hooks/useWishlist', () => ({
  useWishlist: vi.fn(() => ({ slugs: [], has: () => false, toggle: vi.fn(), clear: vi.fn() })),
}))

vi.mock('@hooks/useSearchHistory', () => ({
  useSearchHistory: vi.fn(() => ({
    entries: [],
    record: vi.fn(),
    remove: vi.fn(),
    clear: vi.fn(),
  })),
}))

vi.mock('@hooks/useSavedFilters', () => ({
  useSavedFilters: vi.fn(() => ({ entries: [], save: vi.fn(), remove: vi.fn() })),
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

describe('<CommandPalette />', () => {
  it('does not render the dialog when closed', () => {
    render(<CommandPalette />, { wrapper: Wrapper })
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('opens on Cmd+K', () => {
    render(<CommandPalette />, { wrapper: Wrapper })
    fireEvent.keyDown(window, { key: 'k', metaKey: true })
    expect(screen.getByRole('dialog')).toBeTruthy()
  })

  it('shows "카탈로그 둘러보기" quick action when open', () => {
    render(<CommandPalette />, { wrapper: Wrapper })
    fireEvent.keyDown(window, { key: 'k', metaKey: true })
    expect(screen.getByText('카탈로그 둘러보기')).toBeTruthy()
  })

  it('closes on Escape key', () => {
    render(<CommandPalette />, { wrapper: Wrapper })
    fireEvent.keyDown(window, { key: 'k', metaKey: true })
    expect(screen.getByRole('dialog')).toBeTruthy()
    fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('shows saved filters section when saved filters exist', () => {
    vi.mocked(useSavedFilters).mockReturnValue({
      entries: [{ label: '무료 프롬프트', search: 'free=true', at: Date.now() }],
      save: vi.fn(),
      remove: vi.fn(),
    })
    render(<CommandPalette />, { wrapper: Wrapper })
    fireEvent.keyDown(window, { key: 'k', metaKey: true })
    expect(screen.getByText('저장된 필터')).toBeTruthy()
    expect(screen.getByText('무료 프롬프트')).toBeTruthy()
    expect(screen.getByText('?free=true')).toBeTruthy()
  })
})
