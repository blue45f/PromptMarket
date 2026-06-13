import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { useSavedFilters } from './useSavedFilters'

afterEach(() => {
  window.localStorage.clear()
})

describe('useSavedFilters', () => {
  it('persists the latest entry first', () => {
    const { result } = renderHook(() => useSavedFilters())
    act(() => result.current.save('category=A', 'A'))
    act(() => result.current.save('category=B', 'B'))
    expect(result.current.entries.map((e) => e.label)).toEqual(['B', 'A'])
  })

  it('dedupes when the same search is saved twice', () => {
    const { result } = renderHook(() => useSavedFilters())
    act(() => result.current.save('category=A', 'A'))
    act(() => result.current.save('category=A', 'A again'))
    expect(result.current.entries.length).toBe(1)
    expect(result.current.entries[0]?.label).toBe('A again')
  })

  it('caps the list at 5 entries', () => {
    const { result } = renderHook(() => useSavedFilters())
    act(() => {
      for (const i of [1, 2, 3, 4, 5, 6, 7]) {
        result.current.save(`page=${i}`, `P${i}`)
      }
    })
    expect(result.current.entries.length).toBe(5)
    expect(result.current.entries[0]?.label).toBe('P7')
    // The two oldest entries should have rotated out.
    expect(result.current.entries.map((e) => e.label)).not.toContain('P1')
    expect(result.current.entries.map((e) => e.label)).not.toContain('P2')
  })

  it('remove() drops a single entry without touching the rest', () => {
    const { result } = renderHook(() => useSavedFilters())
    act(() => {
      result.current.save('a=1', 'A')
      result.current.save('b=1', 'B')
    })
    act(() => result.current.remove('a=1'))
    expect(result.current.entries.map((e) => e.label)).toEqual(['B'])
  })
})
