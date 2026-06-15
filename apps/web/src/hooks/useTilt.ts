import { useCallback, useEffect, useRef } from 'react'

interface UseTiltOptions {
  /** Maximum tilt in degrees on each axis. */
  max?: number
  /** Translation depth for inner layers (px). */
  depth?: number
}

/**
 * 3D tilt-on-hover. Sets CSS custom properties --rx, --ry, --tx, --ty on the
 * ref'd element so consumers can apply them via rotateX/rotateY/translate3d.
 * Smooth easing handled by the consumer's transition; this hook just emits
 * the values. Disabled on coarse pointers and reduced-motion.
 */
export function useTilt<T extends HTMLElement = HTMLDivElement>({
  max = 7,
  depth = 12,
}: UseTiltOptions = {}) {
  const ref = useRef<T | null>(null)
  const rafRef = useRef<number | null>(null)

  const onMove = useCallback(
    (e: PointerEvent) => {
      const node = ref.current
      if (!node) return
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(() => {
        const rect = node.getBoundingClientRect()
        const cx = rect.width / 2
        const cy = rect.height / 2
        const dx = (e.clientX - rect.left - cx) / cx
        const dy = (e.clientY - rect.top - cy) / cy
        node.style.setProperty('--rx', `${-dy * max}deg`)
        node.style.setProperty('--ry', `${dx * max}deg`)
        node.style.setProperty('--tx', `${dx * depth}px`)
        node.style.setProperty('--ty', `${dy * depth}px`)
        node.style.setProperty('--mxp', `${((e.clientX - rect.left) / rect.width) * 100}%`)
        node.style.setProperty('--myp', `${((e.clientY - rect.top) / rect.height) * 100}%`)
      })
    },
    [max, depth]
  )

  const onLeave = useCallback(() => {
    const node = ref.current
    if (!node) return
    node.style.setProperty('--rx', '0deg')
    node.style.setProperty('--ry', '0deg')
    node.style.setProperty('--tx', '0px')
    node.style.setProperty('--ty', '0px')
  }, [])

  useEffect(() => {
    const node = ref.current
    if (!node) return
    if (typeof window === 'undefined') return
    const reduced = globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches
    const coarse = globalThis.matchMedia('(pointer: coarse)').matches
    if (reduced || coarse) return
    node.addEventListener('pointermove', onMove)
    node.addEventListener('pointerleave', onLeave)
    return () => {
      node.removeEventListener('pointermove', onMove)
      node.removeEventListener('pointerleave', onLeave)
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    }
  }, [onMove, onLeave])

  return ref
}
