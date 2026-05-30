import { useEffect, useRef, useState, type RefObject } from 'react'

/**
 * Smoothly counts up to `target` once the host element scrolls into view.
 * Uses an exponential ease-out curve. Skips animation under reduced-motion.
 */
export function useCountUp(
  target: number,
  duration = 1200
): { ref: RefObject<HTMLElement | null>; value: number } {
  const ref = useRef<HTMLElement | null>(null)
  const [value, setValue] = useState(0)
  const startedRef = useRef(false)

  useEffect(() => {
    startedRef.current = false
    const node = ref.current
    if (!node || typeof window === 'undefined') return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      setValue(target)
      return
    }

    let frame: number | undefined
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || startedRef.current) return
        startedRef.current = true
        const start = performance.now()
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / duration)
          // ease-out-quint
          const eased = 1 - Math.pow(1 - t, 5)
          setValue(Math.round(target * eased))
          if (t < 1) frame = requestAnimationFrame(tick)
        }
        frame = requestAnimationFrame(tick)
      },
      { threshold: 0.4 }
    )
    obs.observe(node)
    return () => {
      obs.disconnect()
      if (frame !== undefined) cancelAnimationFrame(frame)
    }
  }, [target, duration])

  return { ref, value }
}
