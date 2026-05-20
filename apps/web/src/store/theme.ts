import { create } from 'zustand';

const STORAGE_KEY = 'pm_theme';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  /** Re-apply the resolved class to <html>. Used by the system-pref listener. */
  apply: () => void;
}

function readMode(): ThemeMode {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === 'light' || v === 'dark' || v === 'system') return v;
  } catch {
    /* ignore */
  }
  return 'system';
}

function prefersDark(): boolean {
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  } catch {
    return false;
  }
}

function resolve(mode: ThemeMode): 'light' | 'dark' {
  if (mode === 'system') return prefersDark() ? 'dark' : 'light';
  return mode;
}

function paint(mode: ThemeMode) {
  const resolved = resolve(mode);
  const root = document.documentElement;
  if (resolved === 'dark') root.classList.add('dark');
  else root.classList.remove('dark');
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: readMode(),
  setMode: (mode) => {
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      /* ignore */
    }
    paint(mode);
    set({ mode });
  },
  apply: () => paint(get().mode),
}));

/** Run once at app bootstrap (in main.tsx) so <html> has the right class before
 *  React paints, and re-paints whenever the OS preference flips while in
 *  "system" mode. Safe to call multiple times — idempotent. */
export function initTheme() {
  paint(readMode());
  try {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const cb = () => {
      if (useThemeStore.getState().mode === 'system') paint('system');
    };
    if (mq.addEventListener) mq.addEventListener('change', cb);
    else mq.addListener(cb);
  } catch {
    /* ignore */
  }
}
