import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
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

  it('shows notification bell when authenticated', () => {
    ;(useAuthStore as unknown as Mock).mockReturnValue({
      token: 'tok',
      user: { id: 'u1', username: 'alice', balanceCents: 5000 },
      logout: vi.fn(),
    })
    render(withProviders(<Navbar />))
    expect(screen.getAllByRole('button', { name: /알림|notifications/i }).length).toBeGreaterThan(0)
  })

  it('does not show notification bell when unauthenticated', () => {
    ;(useAuthStore as unknown as Mock).mockReturnValue({
      token: null,
      user: null,
      logout: vi.fn(),
    })
    render(withProviders(<Navbar />))
    expect(screen.queryByRole('button', { name: /알림|notifications/i })).toBeNull()
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

  it('keeps the drawer panel in the DOM so aria-controls stays valid while closed', () => {
    render(withProviders(<Navbar />))
    const toggle = screen.getByRole('button', { name: /메뉴 열기|open menu/i })
    const panel = document.getElementById('mobile-nav-panel')
    expect(toggle.getAttribute('aria-controls')).toBe('mobile-nav-panel')
    expect(panel).toBeTruthy()
    expect(panel?.hidden).toBe(true)
    expect(screen.queryByRole('navigation', { name: /모바일|mobile/i })).toBeNull()
  })

  it('opens the drawer from the toggle and closes it on Escape with focus restored', () => {
    render(withProviders(<Navbar />))
    const toggle = screen.getByRole('button', { name: /메뉴 열기|open menu/i })
    fireEvent.click(toggle)
    expect(screen.getByRole('navigation', { name: /모바일|mobile/i })).toBeTruthy()
    expect(toggle.getAttribute('aria-expanded')).toBe('true')

    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' })
    expect(screen.queryByRole('navigation', { name: /모바일|mobile/i })).toBeNull()
    expect(toggle.getAttribute('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(toggle)
  })
})
