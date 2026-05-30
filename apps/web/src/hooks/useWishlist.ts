import { useCallback } from 'react'
import { useWishlistStore } from '@store/wishlist'

/**
 * Wishlist state backed by the Zustand wishlist store (persisted to
 * localStorage under 'pm.wishlist'). Returns the same API shape as the old
 * localStorage+CustomEvent implementation so existing callers are unaffected.
 */
export function useWishlist() {
  const slugs = useWishlistStore((s) => s.slugs)
  const toggle = useWishlistStore((s) => s.toggle)
  const clear = useWishlistStore((s) => s.clear)

  const has = useCallback((slug: string) => slugs.includes(slug), [slugs])

  return { slugs, has, toggle, clear }
}
