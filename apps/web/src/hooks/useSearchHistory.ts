import { useCallback, useEffect, useState } from 'react';

/**
 * Capped local-storage queue of recent palette / browse queries. Same shape
 * as useWishlist + useSavedFilters: most-recent first, dedup, max 8 entries,
 * CustomEvent fanout so multiple subscribers within a tab stay in sync.
 */

const KEY = 'pm.searchHistory';
const MAX = 8;

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

function write(entries: string[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(entries));
    window.dispatchEvent(new CustomEvent('pm:searchHistory'));
  } catch {
    /* quota full — silently drop */
  }
}

export function useSearchHistory() {
  const [entries, setEntries] = useState<string[]>(() => read());

  useEffect(() => {
    function refresh() {
      setEntries(read());
    }
    window.addEventListener('storage', refresh);
    window.addEventListener('pm:searchHistory', refresh);
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener('pm:searchHistory', refresh);
    };
  }, []);

  const record = useCallback((raw: string) => {
    const q = raw.trim();
    if (!q) return;
    const current = read();
    const next = [q, ...current.filter((s) => s !== q)].slice(0, MAX);
    write(next);
  }, []);

  const remove = useCallback((q: string) => {
    write(read().filter((s) => s !== q));
  }, []);

  const clear = useCallback(() => write([]), []);

  return { entries, record, remove, clear };
}
