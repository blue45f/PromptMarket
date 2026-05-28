import { useCallback, useEffect, useState } from 'react';

/**
 * Persist the last N filter URLs the visitor used on /browse so they can
 * jump back to a setup without re-applying chips one by one. Stores raw
 * query strings (sans `?`) keyed by a synthesized label so the UI doesn't
 * need to know the FilterState shape.
 */

export interface SavedFilter {
  /** Compact human label, e.g. "Coding · Claude · 무료". */
  label: string;
  /** URL search string without the leading `?`. */
  search: string;
  /** Last-used timestamp for ordering. */
  at: number;
}

const KEY = 'pm.savedFilters';
const MAX = 5;

function read(): SavedFilter[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e): e is SavedFilter =>
        e != null &&
        typeof e === 'object' &&
        typeof e.label === 'string' &&
        typeof e.search === 'string' &&
        typeof e.at === 'number',
    );
  } catch {
    return [];
  }
}

function write(entries: SavedFilter[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(entries));
    window.dispatchEvent(new CustomEvent('pm:savedFilters'));
  } catch {
    /* storage full — silently drop */
  }
}

export function useSavedFilters() {
  const [entries, setEntries] = useState<SavedFilter[]>(() => read());

  useEffect(() => {
    function refresh() {
      setEntries(read());
    }
    window.addEventListener('storage', refresh);
    window.addEventListener('pm:savedFilters', refresh);
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener('pm:savedFilters', refresh);
    };
  }, []);

  const save = useCallback((search: string, label: string) => {
    if (!search || !label) return;
    const now = Date.now();
    const filtered = read().filter((e) => e.search !== search);
    const next = [{ search, label, at: now }, ...filtered].slice(0, MAX);
    write(next);
  }, []);

  const remove = useCallback((search: string) => {
    write(read().filter((e) => e.search !== search));
  }, []);

  return { entries, save, remove };
}
