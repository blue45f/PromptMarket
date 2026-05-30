import { useEffect, useRef, useState } from 'react'

const DEFAULT_OPTIONS: IntersectionObserverInit = { threshold: 0.15, rootMargin: '-40px 0px' }

/**
 * Scroll-triggered reveal hook. Returns a ref + a `revealed` flag that flips
 * to true the first time the element intersects the viewport, then stays true.
 * Respects prefers-reduced-motion by short-circuiting to revealed=true so the
 * content shows without any animation.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>(
  options: IntersectionObserverInit = DEFAULT_OPTIONS
) {
  const ref = useRef<T | null>(null)
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    const reduced =
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      setRevealed(true)
      return
    }
    const node = ref.current
    if (!node) return
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setRevealed(true)
        obs.disconnect()
      }
    }, options)
    obs.observe(node)
    return () => obs.disconnect()
  }, [options])

  return { ref, revealed }
}
