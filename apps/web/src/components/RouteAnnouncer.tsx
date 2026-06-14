import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'

/**
 * Route-change announcer + focus manager for the SPA.
 *
 * Single-page apps swap content without a full document load, so two things
 * that come "for free" with multi-page sites silently break:
 *   1. Screen readers never learn the page changed — there's no <title>
 *      announcement, so the user is stranded on stale context.
 *   2. Keyboard focus stays on whatever link was clicked, often deep in a
 *      nav, instead of moving to the new page's content.
 *
 * This component fixes both, additively, without touching any page:
 *   • A visually-hidden aria-live="polite" region announces the new
 *     document.title after each route settles. usePageMeta() (run in every
 *     page's effect) sets the title, so we read it one frame later to catch
 *     the freshly-applied value rather than the previous page's.
 *   • Keyboard focus is moved to the existing <main id="main" tabIndex={-1}>
 *     landmark in Layout — the same target the skip link uses — so the next
 *     Tab lands inside page content. The initial page load is skipped so we
 *     never yank focus away from the document on first paint, and in-page
 *     hash links (#section) are honored instead of being overridden.
 *
 * Mount once, inside the router, alongside the <main> landmark (Layout).
 */
export default function RouteAnnouncer() {
  const { pathname } = useLocation()
  const { t } = useTranslation('nav')
  const [message, setMessage] = useState('')
  const isInitialRender = useRef(true)

  useEffect(() => {
    // Don't announce or steal focus on the very first paint — the page is
    // already where the user expects to be.
    if (isInitialRender.current) {
      isInitialRender.current = false
      return
    }

    if (typeof window === 'undefined') return

    // Wait one frame so the destination page's usePageMeta() effect has had
    // a chance to update document.title before we read it.
    const rafId = window.requestAnimationFrame(() => {
      const title = document.title?.trim()
      setMessage(title ? t('routeChange.announce', { title }) : t('routeChange.announceGeneric'))

      // Skip focus management when the navigation targets an in-page anchor;
      // the browser/router will scroll there and the user expects to stay in
      // flow rather than be sent to the top of <main>.
      if (window.location.hash) return

      const main = document.getElementById('main')
      if (main) {
        // <main> already carries tabIndex={-1} in Layout, so it's a valid
        // programmatic focus target without becoming a Tab stop.
        main.focus({ preventScroll: true })
      }
    })

    return () => window.cancelAnimationFrame(rafId)
    // Re-run only when the path changes; search/hash-only changes keep the
    // same page and shouldn't re-announce or refocus.
  }, [pathname, t])

  return (
    <div aria-live="polite" aria-atomic="true" className="sr-only" data-route-announcer>
      {message}
    </div>
  )
}
