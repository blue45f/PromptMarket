import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from '@store/auth'
import { type Mock } from 'vitest'
import Navbar from './Navbar'

vi.mock('@store/auth', () => ({ useAuthStore: vi.fn() }))
vi.mock('@components/SearchBar', () => ({ default: () => <div data-testid="search-bar" /> }))
vi.mock('@components/ThemeToggle', () => ({ default: () => <div data-testid="theme-toggle" /> }))

function withProviders(node: React.ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return (
    <MemoryRouter>
      <QueryClientProvider client={qc}>{node}</QueryClientProvider>
    </MemoryRouter>
  )
}

describe('Navbar', () => {
  beforeEach(() => {
    ;(useAuthStore as unknown as Mock).mockReturnValue({ token: null, user: null, logout: vi.fn() })
  })

  it('renders PromptMarket brand text', () => {
    ;(useAuthStore as unknown as Mock).mockReturnValue({ token: null, user: null, logout: vi.fn() })
    render(withProviders(<Navbar />))
    expect(screen.getByText('PromptMarket')).toBeTruthy()
  })

  it('renders 둘러보기 nav link', () => {
    render(withProviders(<Navbar />))
    expect(screen.getByRole('link', { name: /둘러보기/i })).toBeTruthy()
  })

  it('shows 로그인 and 회원가입 links when no token', () => {
    render(withProviders(<Navbar />))
    expect(screen.getByRole('link', { name: /로그인/i })).toBeTruthy()
    expect(screen.getByRole('link', { name: /회원가입/i })).toBeTruthy()
  })

  it('shows 로그아웃 button when authenticated', () => {
    ;(useAuthStore as unknown as Mock).mockReturnValue({
      token: 'tok',
      user: { id: 'u1', username: 'alice', balanceCents: 5000 },
      logout: vi.fn(),
    })
    render(withProviders(<Navbar />))
    expect(screen.getByRole('button', { name: /로그아웃/i })).toBeTruthy()
  })

  it('shows user balance formatted as currency when authenticated', () => {
    ;(useAuthStore as unknown as Mock).mockReturnValue({
      token: 'tok',
      user: { id: 'u1', username: 'alice', balanceCents: 5000 },
      logout: vi.fn(),
    })
    render(withProviders(<Navbar />))
    expect(screen.getByText('$50.00')).toBeTruthy()
  })

  it('shows the admin link when user is admin', () => {
    ;(useAuthStore as unknown as Mock).mockReturnValue({
      token: 'tok',
      user: { id: 'u1', username: 'alice', isAdmin: true, balanceCents: 5000 },
      logout: vi.fn(),
    })
    render(withProviders(<Navbar />))
    expect(screen.getByRole('link', { name: /관리자|admin/i })).toBeTruthy()
  })

  it('does not show admin link for non-admin users', () => {
    ;(useAuthStore as unknown as Mock).mockReturnValue({
      token: 'tok',
      user: { id: 'u1', username: 'alice', isAdmin: false, balanceCents: 5000 },
      logout: vi.fn(),
    })
    render(withProviders(<Navbar />))
    expect(screen.queryByRole('link', { name: /관리자|admin/i })).toBeFalsy()
  })
})
