import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { useSpotlight } from './useSpotlight'

describe('useSpotlight', () => {
  it('returns a stable ref object', () => {
    const { result, rerender } = renderHook(() => useSpotlight())
    const first = result.current
    rerender()
    expect(result.current).toBe(first)
  })

  it('returns a ref with no current node by default', () => {
    const { result } = renderHook(() => useSpotlight())
    expect(result.current.current).toBeNull()
  })
})
