import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useThemeStore } from './theme';

const STORAGE_KEY = 'pm_theme';

beforeEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove('dark');
  document.documentElement.style.transition = '';
  vi.restoreAllMocks();
});

afterEach(() => {
  document.documentElement.classList.remove('dark');
  document.documentElement.style.transition = '';
});

describe('useThemeStore', () => {
  it('persists the mode to localStorage when set', () => {
    useThemeStore.getState().setMode('dark');
    expect(localStorage.getItem(STORAGE_KEY)).toBe('dark');
    expect(useThemeStore.getState().mode).toBe('dark');
  });

  it('applies the dark class on the html element for dark mode', () => {
    useThemeStore.getState().setMode('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('removes the dark class for light mode', () => {
    document.documentElement.classList.add('dark');
    useThemeStore.getState().setMode('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('apply() repaints from the current store mode', () => {
    useThemeStore.setState({ mode: 'dark' });
    useThemeStore.getState().apply();
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('respects prefers-reduced-motion and short-circuits to instant paint', () => {
    vi.spyOn(window, 'matchMedia').mockImplementation((q: string) => {
      // Match reduced-motion + dark-scheme so the store thinks the OS
      // both wants dark mode and reduced motion.
      const matches = q.includes('reduce') || q.includes('dark');
      return {
        matches,
        media: q,
        onchange: null,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        addListener: () => undefined,
        removeListener: () => undefined,
        dispatchEvent: () => false,
      } as MediaQueryList;
    });
    useThemeStore.getState().setMode('dark');
    // The reduced-motion path bypasses startViewTransition and the
    // opacity fallback. Dark class still applied; no transition style
    // left on the root.
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.style.transition).toBe('');
  });
});
