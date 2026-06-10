import { renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { usePageMeta } from './usePageMeta'

function metaContent(selector: string): string | null {
  return document.head.querySelector<HTMLMetaElement>(selector)?.getAttribute('content') ?? null
}

function linkHref(selector: string): string | null {
  return document.head.querySelector<HTMLLinkElement>(selector)?.getAttribute('href') ?? null
}

let originalTitle: string

beforeEach(() => {
  originalTitle = document.title
})

afterEach(() => {
  document.title = originalTitle
  // Strip any tags the hook may have appended.
  document.head
    .querySelectorAll<HTMLElement>(
      [
        'meta[name="description"]',
        'meta[property^="og:"]',
        'meta[name^="twitter:"]',
        'link[rel="canonical"]',
      ].join(',')
    )
    .forEach((el) => el.remove())
})

describe('usePageMeta', () => {
  it('sets document.title on mount and restores it on unmount', () => {
    document.title = 'baseline'
    const { unmount } = renderHook(() => usePageMeta({ title: '리스팅 · PromptMarket' }))
    expect(document.title).toBe('리스팅 · PromptMarket')
    unmount()
    expect(document.title).toBe('baseline')
  })

  it('writes description / og:title / og:type', () => {
    renderHook(() =>
      usePageMeta({
        title: '검증된 카탈로그',
        description: '에이전트 시대의 카탈로그',
        ogType: 'product',
      })
    )
    expect(metaContent('meta[name="description"]')).toBe('에이전트 시대의 카탈로그')
    expect(metaContent('meta[property="og:title"]')).toBe('검증된 카탈로그')
    expect(metaContent('meta[property="og:type"]')).toBe('product')
  })

  it('uses the supplied og:image for og + twitter image tags', () => {
    renderHook(() =>
      usePageMeta({
        title: 't',
        ogImage: 'https://example.com/p.png',
      })
    )
    expect(metaContent('meta[name="twitter:card"]')).toBe('summary_large_image')
    expect(metaContent('meta[name="twitter:image"]')).toBe('https://example.com/p.png')
    expect(metaContent('meta[property="og:image"]')).toBe('https://example.com/p.png')
  })

  it('writes canonical link when canonical is set', () => {
    renderHook(() =>
      usePageMeta({
        title: 't',
        canonical: 'https://promptmarket.dev/listings/foo',
      })
    )
    expect(linkHref('link[rel="canonical"]')).toBe('https://promptmarket.dev/listings/foo')
  })

  it('falls back to the site-wide og:image and a large card when none is supplied', () => {
    renderHook(() => usePageMeta({ title: 't' }))
    expect(metaContent('meta[name="twitter:card"]')).toBe('summary_large_image')
    expect(metaContent('meta[property="og:image"]')).toBe(
      'https://promptmarket-web.vercel.app/og.png'
    )
    expect(metaContent('meta[name="twitter:image"]')).toBe(
      'https://promptmarket-web.vercel.app/og.png'
    )
  })
})
