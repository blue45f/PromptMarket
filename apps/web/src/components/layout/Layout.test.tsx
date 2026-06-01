import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Layout from './Layout'

const { mockUseCountUp } = vi.hoisted(() => ({
  mockUseCountUp: vi.fn(() => ({ ref: { current: null }, value: 0 })),
}))

vi.mock('react-i18next', () => ({
  ...vi.importActual('react-i18next'),
  useTranslation: () => ({
    t: (key: string, options?: { year?: number }) => {
      if (key === 'footer.copyright' && options?.year) {
        return `© ${options.year} PromptMarket`
      }
      return key.replace(/^[^:]*:/, '')
    },
    ready: true,
    i18n: {},
  }),
}))

vi.mock('@features/marketplace/queries', () => ({
  useMe: vi.fn(),
  useStats: vi.fn(() => ({ data: null })),
  useListings: vi.fn(() => ({ data: null })),
}))
vi.mock('@store/auth', () => ({
  useAuthStore: vi.fn(() => ({ token: null, user: null, logout: vi.fn() })),
}))
vi.mock('@components/CommandPalette', () => ({ default: () => null }))
vi.mock('@components/ShortcutsOverlay', () => ({ default: () => null }))
vi.mock('@components/ScrollToTop', () => ({ default: () => null }))
vi.mock('@components/SearchBar', () => ({ default: () => <input placeholder="검색" /> }))
vi.mock('@components/ThemeToggle', () => ({ default: () => null }))
vi.mock('@hooks/useNavShortcuts', () => ({ useNavShortcuts: vi.fn() }))
vi.mock('@hooks/useSpotlight', () => ({
  useSpotlight: vi.fn(() => ({ current: null })),
}))
vi.mock('@hooks/useReveal', () => ({
  useReveal: vi.fn(() => ({ ref: { current: null }, revealed: false })),
}))
vi.mock('@hooks/useCountUp', () => ({
  useCountUp: mockUseCountUp,
}))

function TestLayout() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return (
    <MemoryRouter>
      <QueryClientProvider client={qc}>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<div>page content</div>} />
          </Route>
        </Routes>
      </QueryClientProvider>
    </MemoryRouter>
  )
}

describe('Layout', () => {
  const thirdArg = (index: number) => (mockUseCountUp.mock.calls[index] as unknown[])[2]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the PromptMarket brand in the navbar', () => {
    render(<TestLayout />)
    const matches = screen.getAllByText('PromptMarket')
    expect(matches.length).toBeGreaterThanOrEqual(1)
    const navBrand = matches.find((el) => el.closest('header'))
    expect(navBrand).toBeTruthy()
  })

  it('renders page content via Outlet', () => {
    render(<TestLayout />)
    expect(screen.getByText('page content')).toBeTruthy()
  })

  it('renders the footer copyright', () => {
    render(<TestLayout />)
    expect(screen.getByText(`© ${new Date().getFullYear()} PromptMarket`)).toBeTruthy()
  })

  it('replays FooterLiveStats count-up when hovered', () => {
    const { container } = render(<TestLayout />)
    const footer = screen.getByRole('contentinfo')
    const stats = container.querySelector('.mb-12.grid')
    expect(footer).toBeTruthy()
    expect(stats).toBeTruthy()

    expect(mockUseCountUp).toHaveBeenCalledTimes(3)
    const firstReplayArg = thirdArg(0)
    expect(firstReplayArg).toBeUndefined()

    fireEvent.mouseEnter(stats as Element)

    expect(mockUseCountUp).toHaveBeenCalledTimes(6)
    expect(thirdArg(3)).toBe(1)
    expect(thirdArg(4)).toBe(1)
    expect(thirdArg(5)).toBe(1)

    fireEvent.mouseEnter(stats as Element)

    expect(mockUseCountUp).toHaveBeenCalledTimes(9)
    expect(thirdArg(6)).toBe(2)
    expect(thirdArg(7)).toBe(2)
    expect(thirdArg(8)).toBe(2)
  })
})
