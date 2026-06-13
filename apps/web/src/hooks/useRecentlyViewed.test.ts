import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { useRecentlyViewed } from './useRecentlyViewed'

afterEach(() => {
  window.localStorage.clear()
})

describe('useRecentlyViewed', () => {
  it('starts empty', () => {
    const { result } = renderHook(() => useRecentlyViewed())
    expect(result.current.slugs).toEqual([])
  })

  it('prepends the latest visit and dedupes prior entries', () => {
    const { result } = renderHook(() => useRecentlyViewed())
    act(() => {
      result.current.track('a')
      result.current.track('b')
      result.current.track('a')
    })
    expect(result.current.slugs).toEqual(['a', 'b'])
  })

  it('caps the queue at 16 entries (max)', () => {
    const { result } = renderHook(() => useRecentlyViewed())
    act(() => {
      for (let i = 0; i < 20; i++) result.current.track(`s${i}`)
    })
    expect(result.current.slugs.length).toBeLessThanOrEqual(16)
    // Most-recent-first; the latest must be at the head.
    expect(result.current.slugs[0]).toBe('s19')
    // Earliest pushes should have rotated out.
    expect(result.current.slugs).not.toContain('s0')
  })

  it('clear() empties the store', () => {
    const { result } = renderHook(() => useRecentlyViewed())
    act(() => result.current.track('a'))
    act(() => result.current.clear())
    expect(result.current.slugs).toEqual([])
  })

  it('responds to its CustomEvent for cross-subscriber sync', () => {
    const { result: a } = renderHook(() => useRecentlyViewed())
    const { result: b } = renderHook(() => useRecentlyViewed())
    act(() => a.current.track('x'))
    expect(b.current.slugs).toEqual(['x'])
  })
})
