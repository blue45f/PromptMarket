import { useCallback, useEffect, useState } from 'react';

/**
 * Tracks favorited listing slugs in localStorage. localStorage-only (no
 * server-side state) so it works for signed-out visitors and adds no API
 * surface. Updates fire a CustomEvent so multiple subscribers stay in sync
 * within the tab.
 */

const KEY = 'pm.wishlist';

function read(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((s): s is string => typeof s === 'string');
  } catch {
    return [];
  }
}

function write(slugs: string[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(slugs));
    window.dispatchEvent(new CustomEvent('pm:wishlist'));
  } catch {
    /* storage full or denied — silently drop */
  }
}

export function useWishlist() {
  const [slugs, setSlugs] = useState<string[]>(() => read());

  useEffect(() => {
    function refresh() {
      setSlugs(read());
    }
    window.addEventListener('storage', refresh);
    window.addEventListener('pm:wishlist', refresh);
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener('pm:wishlist', refresh);
    };
  }, []);

  const has = useCallback((slug: string) => slugs.includes(slug), [slugs]);

  const toggle = useCallback((slug: string) => {
    if (!slug) return;
    const current = read();
    const next = current.includes(slug)
      ? current.filter((s) => s !== slug)
      : [slug, ...current].slice(0, 200);
    write(next);
  }, []);

  const clear = useCallback(() => write([]), []);

  return { slugs, has, toggle, clear };
}
