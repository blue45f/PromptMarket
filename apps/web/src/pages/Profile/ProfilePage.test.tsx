import { useUserProfile } from '@features/marketplace/queries'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { describe, expect, it, vi, beforeEach, type Mock } from 'vitest'

import ProfilePage from './ProfilePage'

vi.mock('@features/marketplace/queries', () => ({
  useUserProfile: vi.fn(),
}))
vi.mock('@hooks/usePageMeta', () => ({ usePageMeta: vi.fn() }))
vi.mock('@hooks/useSpotlight', () => ({ useSpotlight: vi.fn(() => ({ current: null })) }))

function withProviders(node: React.ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return (
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/users/testuser']}>
        <Routes>
          <Route path="/users/:username" element={node} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('<ProfilePage />', () => {
  beforeEach(() => {
    ;(useUserProfile as unknown as Mock).mockReturnValue({
      data: undefined,
      isPending: false,
      error: null,
    })
  })

  it('shows skeleton pulse when loading', () => {
    ;(useUserProfile as unknown as Mock).mockReturnValue({
      data: undefined,
      isPending: true,
      error: null,
    })
    const { container } = render(withProviders(<ProfilePage />))
    expect(container.querySelector('[class*="animate-pulse"]')).toBeTruthy()
  })

  it('shows "사용자를 찾을 수 없어요." when data is absent and no error', () => {
    ;(useUserProfile as unknown as Mock).mockReturnValue({
      data: undefined,
      isPending: false,
      error: null,
    })
    render(withProviders(<ProfilePage />))
    expect(screen.getByText('사용자를 찾을 수 없어요.')).toBeTruthy()
  })

  it('shows the username when loaded', () => {
    ;(useUserProfile as unknown as Mock).mockReturnValue({
      data: { user: { id: 'u1', username: 'testuser', bio: 'Hello' }, listings: [] },
      isPending: false,
      error: null,
    })
    render(withProviders(<ProfilePage />))
    expect(screen.getAllByText(/@testuser/i).length).toBeGreaterThan(0)
  })

  it('shows the drop section heading when loaded', () => {
    ;(useUserProfile as unknown as Mock).mockReturnValue({
      data: { user: { id: 'u1', username: 'testuser', bio: 'Hello' }, listings: [] },
      isPending: false,
      error: null,
    })
    render(withProviders(<ProfilePage />))
    expect(screen.getByText(/@testuser의 드롭/i)).toBeTruthy()
  })
})
