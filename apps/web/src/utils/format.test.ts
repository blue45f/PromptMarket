import { describe, expect, it } from 'vitest'
import { formatCompact, formatDate, formatDollars } from './format'

describe('formatDollars', () => {
  it.each([
    [0, '$0.00'],
    [100, '$1.00'],
    [199, '$1.99'],
    [12345, '$123.45'],
    [123456, '$1,234.56'],
  ])('formats %d cents as %s', (cents, expected) => {
    expect(formatDollars(cents)).toBe(expected)
  })

  it('treats null-ish input as zero', () => {
    expect(formatDollars(undefined as unknown as number)).toBe('$0.00')
    expect(formatDollars(null as unknown as number)).toBe('$0.00')
  })
})

describe('formatDate', () => {
  it('returns an empty string for unparseable input', () => {
    expect(formatDate('not-a-date')).toBe('')
  })

  it('renders a real date as a non-empty locale string', () => {
    const out = formatDate(new Date('2026-05-01T00:00:00Z'))
    expect(out.length).toBeGreaterThan(0)
    expect(out).toMatch(/2026/)
  })

  it('accepts a string ISO timestamp', () => {
    const out = formatDate('2026-05-01T00:00:00Z')
    expect(out).toMatch(/2026/)
  })
})

describe('formatCompact', () => {
  it.each([
    [null, '0'],
    [undefined, '0'],
    [Number.NaN, '0'],
    [Number.POSITIVE_INFINITY, '0'],
  ])('falls back to "0" for %s', (input, expected) => {
    expect(formatCompact(input as unknown as number)).toBe(expected)
  })

  it('formats large numbers compactly in Korean notation', () => {
    // ko-KR uses 천(thousand) and 만(10k) — the exact spelling depends on the
    // ICU table baked into the runtime, so just assert the number stays
    // present and the suffix isn't English.
    const k = formatCompact(1234)
    const m = formatCompact(2_500_000)
    expect(k).toMatch(/1\.2/)
    expect(k).not.toMatch(/K/i)
    expect(m).toMatch(/250|2\.5/)
    expect(m).not.toMatch(/M/i)
  })
})

import { formatRelative } from './format'

describe('formatRelative', () => {
  it('returns "방금" for sub-minute deltas', () => {
    expect(formatRelative(new Date())).toBe('방금')
  })

  it('renders a Korean relative string for hours', () => {
    const past = new Date(Date.now() - 3 * 60 * 60 * 1000)
    const out = formatRelative(past)
    expect(out.length).toBeGreaterThan(0)
    // Should not be English "3 hours ago".
    expect(out).not.toMatch(/ago/)
  })

  it('falls back to formatDate beyond 30 days', () => {
    const past = new Date('2024-01-01T00:00:00Z')
    const out = formatRelative(past)
    expect(out).toMatch(/2024/)
  })

  it('returns "" for unparseable input', () => {
    expect(formatRelative('not-a-date')).toBe('')
  })
})
