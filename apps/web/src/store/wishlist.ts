import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const KEY = 'pm.wishlist'
const CAP = 200

interface WishlistState {
  slugs: string[]
  toggle: (slug: string) => void
  clear: () => void
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      slugs: [],
      toggle: (slug: string) => {
        if (!slug) return
        const current = get().slugs
        const next = current.includes(slug)
          ? current.filter((s) => s !== slug)
          : [slug, ...current].slice(0, CAP)
        set({ slugs: next })
      },
      clear: () => set({ slugs: [] }),
    }),
    {
      name: KEY,
      partialize: (state) => ({ slugs: state.slugs }),
    }
  )
)

export function useIsWishlisted(slug: string) {
  return useWishlistStore((s) => s.slugs.includes(slug))
}
