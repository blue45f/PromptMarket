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

/**
 * Site-wide share-card fallback. Mirrors the static og:image in index.html so
 * routes that don't supply their own image still emit a large summary card on
 * Slack / Kakao / Twitter / Facebook. Absolute URL because crawlers require it.
 */
const DEFAULT_OG_IMAGE = 'https://promptmarket-web.vercel.app/og.png'

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

    // Fallback title/description follow the active UI language so an EN-locale
    // page that passes no description doesn't emit Korean social metadata. The
    // home:meta.* keys hold the canonical default copy in both locales.
    const defaultTitle = i18n.t('home:meta.title')
    const defaultDescription = i18n.t('home:meta.description')

    // Share image: per-route override, else the site-wide card. There's always
    // an image, so the card stays summary_large_image across every route.
    const ogImage = meta.ogImage ?? DEFAULT_OG_IMAGE

    // og:url: prefer the page's canonical, else the live location (sans hash /
    // query) so shares of any route resolve to a clean absolute URL.
    const ogUrl =
      meta.canonical ??
      (typeof window !== 'undefined'
        ? `${window.location.origin}${window.location.pathname}`
        : undefined)

    // og:locale follows the active UI language (ko_KR / en_US) so social
    // crawlers and shares declare the right locale.
    setMeta('meta[property="og:locale"]', 'content', activeIntlLocale().replace('-', '_'))
    setMeta('meta[name="description"]', 'content', meta.description ?? defaultDescription)
    setMeta('meta[property="og:title"]', 'content', meta.ogTitle ?? meta.title ?? defaultTitle)
    setMeta(
      'meta[property="og:description"]',
      'content',
      meta.ogDescription ?? meta.description ?? defaultDescription
    )
    setMeta('meta[property="og:type"]', 'content', meta.ogType ?? 'website')
    setMeta('meta[property="og:url"]', 'content', ogUrl)
    setMeta('meta[property="og:image"]', 'content', ogImage)
    setMeta('meta[name="twitter:card"]', 'content', 'summary_large_image')
    setMeta('meta[name="twitter:title"]', 'content', meta.ogTitle ?? meta.title ?? defaultTitle)
    setMeta(
      'meta[name="twitter:description"]',
      'content',
      meta.ogDescription ?? meta.description ?? defaultDescription
    )
    setMeta('meta[name="twitter:image"]', 'content', ogImage)
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
