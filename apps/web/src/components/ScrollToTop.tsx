import { cn } from '@utils/cn'
import { ArrowUp } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

const THRESHOLD = 600

/**
 * Bottom-right pill that surfaces after the page has scrolled past
 * THRESHOLD pixels, mounting once in Layout so every route gets it.
 * Respects iOS safe-area-inset-bottom and falls back to an instant
 * jump when prefers-reduced-motion is set.
 */
export default function ScrollToTop() {
  const [visible, setVisible] = useState(false)
  const { t } = useTranslation('errors')

  useEffect(() => {
    if (typeof window === 'undefined') return
    let raf = 0
    const tick = () => setVisible(globalThis.scrollY > THRESHOLD)
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(tick)
    }
    globalThis.addEventListener('scroll', onScroll, { passive: true })
    tick()
    return () => {
      globalThis.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [])

  function jump() {
    if (typeof window === 'undefined') return
    const reduced = globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches
    globalThis.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' })
  }

  return (
    <button
      type="button"
      onClick={jump}
      aria-label={t('scrollTop.label')}
      tabIndex={visible ? 0 : -1}
      aria-hidden={!visible}
      className={cn(
        'fixed z-40 right-[clamp(0.75rem,3vw,1.5rem)]',
        'inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full',
        'bg-ink/85 text-bone dark:bg-bone/90 dark:text-ink',
        'backdrop-blur-md border border-bone/15 dark:border-ink/10',
        'shadow-[0_14px_36px_-18px_oklch(0.16_0.03_290/0.5)]',
        'text-[0.78rem] font-medium tracking-tight',
        'motion-safe:transition-all ease-expo motion-safe:duration-300',
        'focus-volt',
        visible
          ? 'opacity-100 translate-y-0 pointer-events-auto'
          : 'opacity-0 translate-y-3 pointer-events-none'
      )}
      style={{
        bottom: 'max(env(safe-area-inset-bottom, 0px), 1rem)',
      }}
    >
      <ArrowUp className="w-3.5 h-3.5" aria-hidden />
      {t('scrollTop.label')}
    </button>
  )
}
