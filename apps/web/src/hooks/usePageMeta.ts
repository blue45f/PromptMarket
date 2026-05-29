import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { activeIntlLocale } from '@/i18n'

interface PageMeta {
  title?: string
  description?: string
  ogTitle?: string
  ogDescription?: string
  ogType?: 'website' | 'article' | 'product'
  ogImage?: string
  canonical?: string
}

const DEFAULTS = {
  title: 'PromptMarket · 검증된 AI 프롬프트, 스킬, 에이전트',
  description:
    '에이전트 시대를 진지하게 다루는 카탈로그. 프롬프트, Claude Code 스킬, MCP 서버, 서브에이전트, .cursorrules를 사고팝니다.',
}

function setMeta(selector: string, attr: 'content' | 'href', value: string | undefined) {
  if (typeof document === 'undefined') return
  let el = document.head.querySelector<HTMLMetaElement | HTMLLinkElement>(selector)
  if (!value) {
    el?.remove()
    return
  }
  if (!el) {
    if (selector.startsWith('link[')) {
      const link = document.createElement('link')
      const m = selector.match(/rel="([^"]+)"/)
      if (m) link.rel = m[1]
      document.head.appendChild(link)
      el = link
    } else {
      const meta = document.createElement('meta')
      const propMatch = selector.match(/property="([^"]+)"/)
      const nameMatch = selector.match(/name="([^"]+)"/)
      if (propMatch) meta.setAttribute('property', propMatch[1])
      if (nameMatch) meta.setAttribute('name', nameMatch[1])
      document.head.appendChild(meta)
      el = meta
    }
  }
  el.setAttribute(attr, value)
}

/**
 * Updates document.title and a handful of meta tags on mount and whenever
 * meta changes. Reverts to the project defaults when unmounted so the next
 * page doesn't inherit a stale title. Fully client-side, no SSR needed.
 */
export function usePageMeta(meta: PageMeta) {
  const { i18n } = useTranslation()
  useEffect(() => {
    const previousTitle = document.title
    if (meta.title) document.title = meta.title

    // og:locale follows the active UI language (ko_KR / en_US) so social
    // crawlers and shares declare the right locale.
    setMeta('meta[property="og:locale"]', 'content', activeIntlLocale().replace('-', '_'))
    setMeta('meta[name="description"]', 'content', meta.description ?? DEFAULTS.description)
    setMeta('meta[property="og:title"]', 'content', meta.ogTitle ?? meta.title ?? DEFAULTS.title)
    setMeta(
      'meta[property="og:description"]',
      'content',
      meta.ogDescription ?? meta.description ?? DEFAULTS.description
    )
    setMeta('meta[property="og:type"]', 'content', meta.ogType ?? 'website')
    setMeta('meta[property="og:image"]', 'content', meta.ogImage)
    setMeta(
      'meta[name="twitter:card"]',
      'content',
      meta.ogImage ? 'summary_large_image' : 'summary'
    )
    setMeta('meta[name="twitter:title"]', 'content', meta.ogTitle ?? meta.title ?? DEFAULTS.title)
    setMeta(
      'meta[name="twitter:description"]',
      'content',
      meta.ogDescription ?? meta.description ?? DEFAULTS.description
    )
    setMeta('meta[name="twitter:image"]', 'content', meta.ogImage)
    setMeta('link[rel="canonical"]', 'href', meta.canonical)

    return () => {
      document.title = previousTitle
    }
  }, [
    meta.title,
    meta.description,
    meta.ogTitle,
    meta.ogDescription,
    meta.ogType,
    meta.ogImage,
    meta.canonical,
    i18n.language,
  ])
}
