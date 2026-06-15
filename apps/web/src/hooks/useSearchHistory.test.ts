import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { useSearchHistory } from './useSearchHistory'

afterEach(() => {
  globalThis.localStorage.clear()
})

describe('useSearchHistory', () => {
  it('records a non-empty trimmed query, most-recent first', () => {
    const { result } = renderHook(() => useSearchHistory())
    act(() => {
      result.current.record('claude')
      result.current.record('  agent  ')
    })
    expect(result.current.entries).toEqual(['agent', 'claude'])
  })

  it('drops empty / whitespace-only inputs', () => {
    const { result } = renderHook(() => useSearchHistory())
    act(() => {
      result.current.record('')
      result.current.record('   ')
      result.current.record('\t\n')
    })
    expect(result.current.entries).toEqual([])
  })

  it('dedupes by moving the existing entry to the head', () => {
    const { result } = renderHook(() => useSearchHistory())
    act(() => {
      result.current.record('a')
      result.current.record('b')
      result.current.record('a')
    })
    expect(result.current.entries).toEqual(['a', 'b'])
  })

  it('caps the queue at 8 entries', () => {
    const { result } = renderHook(() => useSearchHistory())
    act(() => {
      for (let i = 0; i < 12; i++) result.current.record(`q${i}`)
    })
    expect(result.current.entries.length).toBe(8)
    expect(result.current.entries[0]).toBe('q11')
  })

  it('remove() drops a single entry', () => {
    const { result } = renderHook(() => useSearchHistory())
    act(() => {
      result.current.record('a')
      result.current.record('b')
    })
    act(() => result.current.remove('a'))
    expect(result.current.entries).toEqual(['b'])
  })
})
