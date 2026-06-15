import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useScrollRestore } from './useScrollRestore'

function Harness() {
  useScrollRestore()
  return null
}

afterEach(() => {
  globalThis.sessionStorage.clear()
  vi.restoreAllMocks()
})

describe('useScrollRestore', () => {
  it('scrolls to top when nothing is saved for the route', () => {
    const spy = vi.spyOn(window, 'scrollTo')
    render(
      <MemoryRouter initialEntries={['/browse']}>
        <Harness />
      </MemoryRouter>
    )
    // First call argument is { top: 0 } since no saved value exists.
    expect(spy).toHaveBeenCalled()
    const call = spy.mock.calls[0]?.[0] as { top?: number } | number | undefined
    if (typeof call === 'object' && call) {
      expect(call.top).toBe(0)
    }
  })

  it('restores from sessionStorage when a value exists for the path+search', () => {
    globalThis.sessionStorage.setItem('pm.scroll:/browse?category=Coding', '742')
    let restored: number | null = null
    const origRAF = globalThis.requestAnimationFrame
    // Run the rAF callback synchronously so the test doesn't need to wait.
    globalThis.requestAnimationFrame = ((cb: FrameRequestCallback) => {
      cb(0)
      return 0
    }) as typeof globalThis.requestAnimationFrame
    vi.spyOn(window, 'scrollTo').mockImplementation(((opts: ScrollToOptions | number) => {
      if (typeof opts === 'object' && opts && 'top' in opts) restored = opts.top ?? null
    }) as typeof globalThis.scrollTo)

    render(
      <MemoryRouter initialEntries={['/browse?category=Coding']}>
        <Harness />
      </MemoryRouter>
    )

    globalThis.requestAnimationFrame = origRAF
    expect(restored).toBe(742)
  })

  it('keeps separate positions per pathname+search', () => {
    globalThis.sessionStorage.setItem('pm.scroll:/browse?q=a', '100')
    globalThis.sessionStorage.setItem('pm.scroll:/browse?q=b', '500')
    const calls: number[] = []
    const origRAF = globalThis.requestAnimationFrame
    globalThis.requestAnimationFrame = ((cb: FrameRequestCallback) => {
      cb(0)
      return 0
    }) as typeof globalThis.requestAnimationFrame
    vi.spyOn(window, 'scrollTo').mockImplementation(((opts: ScrollToOptions | number) => {
      if (typeof opts === 'object' && opts && 'top' in opts && typeof opts.top === 'number') {
        calls.push(opts.top)
      }
    }) as typeof globalThis.scrollTo)

    render(
      <MemoryRouter initialEntries={['/browse?q=a']}>
        <Harness />
      </MemoryRouter>
    )
    render(
      <MemoryRouter initialEntries={['/browse?q=b']}>
        <Harness />
      </MemoryRouter>
    )

    globalThis.requestAnimationFrame = origRAF
    expect(calls).toContain(100)
    expect(calls).toContain(500)
  })
})
