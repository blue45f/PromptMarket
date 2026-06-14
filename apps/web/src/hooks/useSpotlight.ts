import { useCallback, useEffect, useRef } from 'react'

/**
 * Cursor-following spotlight. Sets CSS custom properties --mx / --my on the
 * ref'd element as the pointer moves over it (clamped to its bounding rect,
 * in pixels). Consumers paint a radial gradient at (var(--mx), var(--my)).
 * Disabled when prefers-reduced-motion is set or on coarse pointers.
 */
export function useSpotlight<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T | null>(null)
  const rafRef = useRef<number | null>(null)

  const onMove = useCallback((e: PointerEvent) => {
    const node = ref.current
    if (!node) return
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => {
      const rect = node.getBoundingClientRect()
      const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left))
      const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top))
      node.style.setProperty('--mx', `${x}px`)
      node.style.setProperty('--my', `${y}px`)
      node.style.setProperty('--mxp', `${(x / rect.width) * 100}%`)
      node.style.setProperty('--myp', `${(y / rect.height) * 100}%`)
    })
  }, [])

  useEffect(() => {
    const node = ref.current
    if (!node) return
    if (typeof window === 'undefined') return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const coarse = window.matchMedia('(pointer: coarse)').matches
    if (reduced || coarse) return
    node.addEventListener('pointermove', onMove)
    return () => {
      node.removeEventListener('pointermove', onMove)
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    }
  }, [onMove])

  return ref
}
