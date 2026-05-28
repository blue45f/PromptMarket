import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useReveal } from './useReveal';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useReveal', () => {
  it('starts not revealed and exposes a ref', () => {
    const { result } = renderHook(() => useReveal());
    expect(result.current.revealed).toBe(false);
    expect((result.current.ref as React.MutableRefObject<unknown>).current).toBeNull();
  });

  it('short-circuits to revealed=true under prefers-reduced-motion', () => {
    const original = (window as unknown as { matchMedia?: typeof window.matchMedia })
      .matchMedia;
    (window as unknown as { matchMedia: typeof window.matchMedia }).matchMedia = ((
      q: string,
    ) =>
      ({
        matches: q.includes('reduce'),
        media: q,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      } as unknown as MediaQueryList)) as typeof window.matchMedia;

    try {
      const { result } = renderHook(() => useReveal());
      expect(result.current.revealed).toBe(true);
    } finally {
      if (original) {
        (window as unknown as { matchMedia: typeof window.matchMedia }).matchMedia = original;
      } else {
        delete (window as unknown as { matchMedia?: typeof window.matchMedia }).matchMedia;
      }
    }
  });
});
