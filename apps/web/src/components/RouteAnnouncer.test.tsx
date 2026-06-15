import { render, screen, act } from '@testing-library/react'
import { MemoryRouter, Routes, Route, useNavigate } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import RouteAnnouncer from './RouteAnnouncer'

// Run requestAnimationFrame callbacks synchronously so the announcer's
// one-frame-deferred read of document.title is observable without waiting.
function runRafSync() {
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation(((cb: FrameRequestCallback) => {
    cb(0)
    return 0
  }) as typeof globalThis.requestAnimationFrame)
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined)
}

// A button that navigates to /browse, letting us trigger a real route change
// inside one MemoryRouter (so useLocation updates without a remount).
function GoToBrowse() {
  const navigate = useNavigate()
  return (
    <button type="button" onClick={() => navigate('/browse')}>
      go
    </button>
  )
}

function Harness() {
  return (
    <>
      {/* The live <main> focus target the announcer reuses, mirroring Layout. */}
      <main id="main" tabIndex={-1}>
        <RouteAnnouncer />
        <Routes>
          <Route path="/" element={<GoToBrowse />} />
          <Route path="/browse" element={<p>browse</p>} />
        </Routes>
      </main>
    </>
  )
}

beforeEach(() => {
  runRafSync()
  document.title = 'Home — PromptMarket'
  globalThis.location.hash = ''
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('<RouteAnnouncer />', () => {
  it('renders a polite, visually-hidden live region', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/']}>
        <RouteAnnouncer />
      </MemoryRouter>
    )
    const region = container.querySelector('[data-route-announcer]')
    expect(region).not.toBeNull()
    expect(region?.getAttribute('aria-live')).toBe('polite')
    expect(region?.getAttribute('aria-atomic')).toBe('true')
    expect(region?.className).toContain('sr-only')
  })

  it('does not announce on the initial render', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/']}>
        <RouteAnnouncer />
      </MemoryRouter>
    )
    // The region exists but stays empty until a navigation happens.
    expect(container.querySelector('[data-route-announcer]')?.textContent).toBe('')
  })

  it('announces the new document.title after a route change', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Harness />
      </MemoryRouter>
    )

    // Simulate the destination page setting its title via usePageMeta.
    document.title = 'Browse — PromptMarket'
    await act(async () => {
      screen.getByRole('button', { name: 'go' }).click()
    })

    // Korean is the default test locale: "{{title}} 페이지로 이동했습니다".
    expect(screen.getByText(/Browse — PromptMarket 페이지로 이동했습니다/)).toBeTruthy()
  })

  it('moves keyboard focus to <main> on a route change', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Harness />
      </MemoryRouter>
    )

    await act(async () => {
      screen.getByRole('button', { name: 'go' }).click()
    })

    expect(document.activeElement).toBe(document.getElementById('main'))
  })
})
