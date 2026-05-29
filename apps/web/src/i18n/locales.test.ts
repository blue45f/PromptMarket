import { describe, it, expect } from 'vitest'
import i18n, { resources, NS } from './index'

// i18next plural suffixes — Korean has no plural distinction, so a key may
// legitimately exist as `key_other` in en but a single form in ko. Normalize
// these away so parity is measured on the base key, not the plural variant.
const PLURAL = /_(zero|one|two|few|many|other)$/

function flattenKeys(value: unknown, prefix = ''): string[] {
  if (value === null || typeof value !== 'object') return [prefix]
  return Object.entries(value as Record<string, unknown>).flatMap(([k, v]) =>
    flattenKeys(v, prefix ? `${prefix}.${k}` : k)
  )
}

function baseKeys(value: unknown): Set<string> {
  return new Set(flattenKeys(value).map((k) => k.replace(PLURAL, '')))
}

/**
 * Guards against the classic i18n regression: a key added to one locale but
 * not the other, which silently falls back to the key name or the default
 * language. Every namespace must expose the same set of keys in ko and en.
 */
describe('i18n locale parity', () => {
  it.each(NS)('ko and en expose the same keys for "%s"', (ns) => {
    const ko = baseKeys(resources.ko[ns])
    const en = baseKeys(resources.en[ns])
    const missingInEn = [...ko].filter((k) => !en.has(k)).sort()
    const missingInKo = [...en].filter((k) => !ko.has(k)).sort()
    expect({ missingInEn, missingInKo }).toEqual({ missingInEn: [], missingInKo: [] })
  })
})

// Korean is the default operating language; the switcher flips to en. The
// <html lang> attribute must follow so screen readers and CJK line-breaking
// pick the right rules.
describe('i18n <html lang> sync', () => {
  it('updates document.documentElement.lang on language change', async () => {
    await i18n.changeLanguage('en')
    expect(document.documentElement.lang).toBe('en')
    await i18n.changeLanguage('ko')
    expect(document.documentElement.lang).toBe('ko')
  })
})
