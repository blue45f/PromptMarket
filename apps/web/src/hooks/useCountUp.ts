import { useEffect, useRef, useState, type RefObject } from 'react'

/**
 * Smoothly counts up to `target` once the host element scrolls into view.
 * Uses an exponential ease-out curve. Skips animation under reduced-motion.
 */
export function useCountUp(
  target: number,
  duration = 1200,
  replayToken?: unknown
): { ref: RefObject<HTMLElement | null>; value: number } {
  const ref = useRef<HTMLElement | null>(null)
  const [value, setValue] = useState(0)
  const startedRef = useRef(false)
  const valueRef = useRef(0)

  useEffect(() => {
    startedRef.current = false
    const node = ref.current
    if (!node || typeof window === 'undefined') return

    const reduced = globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      valueRef.current = target
      const frame = requestAnimationFrame(() => setValue(target))
      return () => cancelAnimationFrame(frame)
    }

    let frame: number | undefined
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || startedRef.current) return
        startedRef.current = true
        const from = valueRef.current
        const delta = target - from
        const start = performance.now()
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / duration)
          // ease-out-quint
          const eased = 1 - Math.pow(1 - t, 5)
          const next = Math.round(from + delta * eased)
          setValue(next)
          valueRef.current = next
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
  }, [target, duration, replayToken])

  return { ref, value }
}
