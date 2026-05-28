import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Persist scroll position per route in sessionStorage and restore it on
 * back-navigation. React Router's default behavior scrolls to top, which
 * is correct for "new" page loads but feels wrong when a visitor pages
 * back from a listing detail to the catalog row they were reading.
 *
 * The key is the full path + search so /browse?category=Coding and
 * /browse?category=Design keep separate positions.
 */
export function useScrollRestore() {
  const { key, pathname, search } = useLocation();
  const storageKey = `pm.scroll:${pathname}${search}`;
  const restoredKey = useRef<string | null>(null);

  // Restore on mount / key change (back navigation reuses the same location
  // key, so we trigger restore exactly once per key).
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (restoredKey.current === key) return;
    restoredKey.current = key;
    const raw = sessionStorage.getItem(storageKey);
    if (!raw) {
      // Fresh navigation — scroll to top.
      window.scrollTo({ top: 0 });
      return;
    }
    const y = parseInt(raw, 10);
    if (!Number.isFinite(y)) return;
    // Wait one frame so the page has had a chance to layout its content.
    requestAnimationFrame(() => window.scrollTo({ top: y }));
  }, [key, storageKey]);

  // Persist on scroll (throttled by rAF).
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let raf = 0;
    function onScroll() {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        try {
          sessionStorage.setItem(storageKey, String(window.scrollY));
        } catch {
          /* quota full — silently drop */
        }
      });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, [storageKey]);
}
