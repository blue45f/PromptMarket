import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
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
      if (key === 'footer.anthologyVolumes') {
        return ['앤솔로지 · vol.01 · MMVI', '앤솔로지 · vol.02 · TOOLKIT']
      }
      if (key === 'footer.anthologyCycleLabel') {
        return '앤솔로지 라벨 전환'
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

  it('renders a mini sitemap in the footer with key routes', () => {
    render(<TestLayout />)
    const footer = screen.getByRole('contentinfo')
    const miniSitemap = within(footer).getByRole('navigation', {
      name: 'footer.sitemap.label',
    })
    const links = within(miniSitemap).getAllByRole('link')

    expect(links).toHaveLength(11)
    expect(links.map((link) => link.getAttribute('href'))).toEqual(
      expect.arrayContaining([
        '/browse',
        '/community',
        '/sell',
        '/dashboard',
        '/login',
        '/',
        '/robots.txt',
        '/sitemap.xml',
        '/terms',
        '/privacy',
        '/support',
      ])
    )
  })

  it('keeps terms, privacy, and support as internal routes', () => {
    render(<TestLayout />)
    const footer = screen.getByRole('contentinfo')
    const miniSitemap = within(footer).getByRole('navigation', {
      name: 'footer.sitemap.label',
    })

    const terms = within(miniSitemap).getByRole('link', { name: 'footer.sitemap.terms' })
    const privacy = within(miniSitemap).getByRole('link', { name: 'footer.sitemap.privacy' })
    const support = within(miniSitemap).getByRole('link', { name: 'footer.sitemap.support' })

    expect(terms).toHaveAttribute('href', '/terms')
    expect(privacy).toHaveAttribute('href', '/privacy')
    // The in-app inquiry form replaced the external TermsDesk board here;
    // the external link survives as a fallback inside /support itself.
    expect(support).toHaveAttribute('href', '/support')
  })

  it('gives every mini sitemap link a ≥44px hit area on coarse pointers', () => {
    render(<TestLayout />)
    const footer = screen.getByRole('contentinfo')
    const miniSitemap = within(footer).getByRole('navigation', {
      name: 'footer.sitemap.label',
    })
    const links = within(miniSitemap).getAllByRole('link')

    for (const link of links) {
      expect(link.className).toContain('pointer-coarse:min-h-11')
    }
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

  it('cycles the footer anthology volume on hover and click', () => {
    render(<TestLayout />)
    const cycle = screen.getByRole('button', { name: '앤솔로지 라벨 전환' })

    expect(cycle.textContent).toContain('vol.01')

    fireEvent.mouseEnter(cycle)
    expect(cycle.textContent).toContain('vol.02')

    fireEvent.click(cycle)
    expect(cycle.textContent).toContain('vol.01')
  })

  it('keeps the footer mega wordmark hover polish decorative and scoped', () => {
    const { container } = render(<TestLayout />)
    const wordmark = container.querySelector('[data-footer-wordmark]')

    expect(wordmark?.textContent).toContain('PromptMarket')
    expect(wordmark?.querySelector('[data-wordmark-accelerator]')).toBeTruthy()
  })
})
