import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { useTilt } from './useTilt'

describe('useTilt', () => {
  it('returns a stable ref object', () => {
    const { result, rerender } = renderHook(() => useTilt())
    const first = result.current
    rerender()
    expect(result.current).toBe(first)
  })

  it('accepts max + depth options without throwing', () => {
    expect(() => renderHook(() => useTilt<HTMLDivElement>({ max: 4, depth: 8 }))).not.toThrow()
  })

  it('returns a ref with no current node by default', () => {
    const { result } = renderHook(() => useTilt())
    expect(result.current.current).toBeNull()
  })
})
