import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useCountUp } from './useCountUp'

class MockIntersectionObserver {
  static instances: MockIntersectionObserver[] = []

  static reset() {
    MockIntersectionObserver.instances = []
  }

  static callbackFor(target: Element | null, isIntersecting = true) {
    const instance = MockIntersectionObserver.instances.at(-1)
    if (!instance) return

    instance.callback(
      [
        {
          isIntersecting,
          intersectionRatio: isIntersecting ? 1 : 0,
          intersectionRect: {} as DOMRectReadOnly,
          boundingClientRect: {} as DOMRectReadOnly,
          rootBounds: null,
          target,
          time: 1,
        } as IntersectionObserverEntry,
      ],
      instance as unknown as IntersectionObserver
    )
  }

  callback: IntersectionObserverCallback

  constructor(callback: IntersectionObserverCallback, _options?: IntersectionObserverInit) {
    this.callback = callback
    MockIntersectionObserver.instances.push(this)
  }

  observe(target: Element) {
    // Trigger a single "in view" event once the element is observed.
    MockIntersectionObserver.callbackFor(target, true)
  }

  unobserve() {}

  disconnect() {}

  takeRecords() {
    return []
  }

  root = null
  rootMargin = ''
  thresholds: ReadonlyArray<number> = []
}

describe('useCountUp', () => {
  const originalIntersectionObserver = globalThis.IntersectionObserver

  afterEach(() => {
    vi.restoreAllMocks()
    MockIntersectionObserver.reset()
    globalThis.IntersectionObserver = originalIntersectionObserver
  })

  it('exposes a ref and starts at 0', () => {
    const { result } = renderHook(() => useCountUp(100))
    expect(result.current.value).toBe(0)
    // Ref starts unattached; consumers wire it up in JSX.
    expect((result.current.ref as React.MutableRefObject<unknown>).current).toBeNull()
  })

  it('updates the ref identity stably across rerenders', () => {
    const { result, rerender } = renderHook(({ t }) => useCountUp(t), {
      initialProps: { t: 10 },
    })
    const refA = result.current.ref
    rerender({ t: 20 })
    const refB = result.current.ref
    expect(refA).toBe(refB)
  })

  it('accepts a custom duration without throwing', () => {
    expect(() => renderHook(() => useCountUp(50, 250))).not.toThrow()
  })

  it('accepts a replay token and re-runs the animation when it changes', () => {
    globalThis.IntersectionObserver = MockIntersectionObserver as never
    const rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((tick) => {
      tick(100_000)
      return 1
    })
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined)

    const { result, rerender } = renderHook(
      ({ target, replay }) => useCountUp(target, 900, replay),
      {
        initialProps: { target: 0, replay: undefined as number | undefined },
      }
    )

    const node = document.createElement('div')
    result.current.ref.current = node
    rerender({ target: 10, replay: undefined })

    expect(result.current.value).toBe(10)
    expect(rafSpy).toHaveBeenCalledTimes(1)

    rerender({ target: 10, replay: 1 })
    expect(result.current.value).toBe(10)
    expect(rafSpy).toHaveBeenCalledTimes(2)
  })

  it('replays from the current value instead of resetting to zero', () => {
    globalThis.IntersectionObserver = MockIntersectionObserver as never
    const callbacks: Parameters<typeof window.requestAnimationFrame>[0][] = []
    const rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((tick) => {
      callbacks.push(tick)
      return callbacks.length
    })
    vi.spyOn(window.performance, 'now').mockReturnValue(0)
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined)

    const { result, rerender } = renderHook(
      ({ target, replay }) => useCountUp(target, 1_000, replay),
      {
        initialProps: { target: 0, replay: 'init' as string },
      }
    )

    const node = document.createElement('div')
    result.current.ref.current = node
    rerender({ target: 100, replay: 'init' as string })

    expect(callbacks).toHaveLength(1)

    act(() => {
      callbacks.at(0)?.(10_000)
    })
    expect(result.current.value).toBe(100)

    callbacks.length = 0
    rerender({ target: 100, replay: 'next' as string })

    act(() => {
      callbacks.at(0)?.(500)
    })
    expect(result.current.value).toBe(100)
    expect(rafSpy).toHaveBeenCalledTimes(3)
  })
})
