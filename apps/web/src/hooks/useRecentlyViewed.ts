import { useCallback, useEffect, useState } from 'react'

/**
 * Tracks the most recently visited listings in localStorage. Each entry is a
 * slug + a timestamp; the list is capped and ordered most-recent-first.
 *
 * `track(slug)` records a visit and moves the slug to the head. `slugs` is the
 * reactive list (most-recent-first) consumers can hydrate from the API.
 */

const KEY = 'pm.recentlyViewed'
const MAX = 16

type Entry = { slug: string; at: number }

function read(): Entry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (e): e is Entry =>
        e != null && typeof e === 'object' && typeof e.slug === 'string' && typeof e.at === 'number'
    )
  } catch {
    return []
  }
}

function write(entries: Entry[]) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(KEY, JSON.stringify(entries))
    window.dispatchEvent(new CustomEvent('pm:recentlyViewed'))
  } catch {
    /* storage full or denied — silently drop */
  }
}

export function useRecentlyViewed() {
  const [entries, setEntries] = useState<Entry[]>(() => read())

  useEffect(() => {
    function refresh() {
      setEntries(read())
    }
    window.addEventListener('storage', refresh)
    window.addEventListener('pm:recentlyViewed', refresh)
    return () => {
      window.removeEventListener('storage', refresh)
      window.removeEventListener('pm:recentlyViewed', refresh)
    }
  }, [])

  const track = useCallback((slug: string) => {
    if (!slug) return
    const now = Date.now()
    const next: Entry[] = [{ slug, at: now }]
    for (const e of read()) {
      if (e.slug === slug) continue
      next.push(e)
      if (next.length >= MAX) break
    }
    write(next)
  }, [])

  const clear = useCallback(() => write([]), [])

  return { entries, slugs: entries.map((e) => e.slug), track, clear }
}
