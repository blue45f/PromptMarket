import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useScrollRestore } from './useScrollRestore';

function Harness() {
  useScrollRestore();
  return null;
}

afterEach(() => {
  window.sessionStorage.clear();
  vi.restoreAllMocks();
});

describe('useScrollRestore', () => {
  it('scrolls to top when nothing is saved for the route', () => {
    const spy = vi.spyOn(window, 'scrollTo');
    render(
      <MemoryRouter initialEntries={['/browse']}>
        <Harness />
      </MemoryRouter>,
    );
    // First call argument is { top: 0 } since no saved value exists.
    expect(spy).toHaveBeenCalled();
    const call = spy.mock.calls[0]?.[0] as { top?: number } | number | undefined;
    if (typeof call === 'object' && call) {
      expect(call.top).toBe(0);
    }
  });

  it('restores from sessionStorage when a value exists for the path+search', () => {
    window.sessionStorage.setItem('pm.scroll:/browse?category=Coding', '742');
    let restored: number | null = null;
    const origRAF = window.requestAnimationFrame;
    // Run the rAF callback synchronously so the test doesn't need to wait.
    window.requestAnimationFrame = ((cb: FrameRequestCallback) => {
      cb(0);
      return 0;
    }) as typeof window.requestAnimationFrame;
    vi.spyOn(window, 'scrollTo').mockImplementation(((opts: ScrollToOptions | number) => {
      if (typeof opts === 'object' && opts && 'top' in opts) restored = opts.top ?? null;
    }) as typeof window.scrollTo);

    render(
      <MemoryRouter initialEntries={['/browse?category=Coding']}>
        <Harness />
      </MemoryRouter>,
    );

    window.requestAnimationFrame = origRAF;
    expect(restored).toBe(742);
  });

  it('keeps separate positions per pathname+search', () => {
    window.sessionStorage.setItem('pm.scroll:/browse?q=a', '100');
    window.sessionStorage.setItem('pm.scroll:/browse?q=b', '500');
    const calls: number[] = [];
    const origRAF = window.requestAnimationFrame;
    window.requestAnimationFrame = ((cb: FrameRequestCallback) => {
      cb(0);
      return 0;
    }) as typeof window.requestAnimationFrame;
    vi.spyOn(window, 'scrollTo').mockImplementation(((opts: ScrollToOptions | number) => {
      if (typeof opts === 'object' && opts && 'top' in opts && typeof opts.top === 'number') {
        calls.push(opts.top);
      }
    }) as typeof window.scrollTo);

    render(
      <MemoryRouter initialEntries={['/browse?q=a']}>
        <Harness />
      </MemoryRouter>,
    );
    render(
      <MemoryRouter initialEntries={['/browse?q=b']}>
        <Harness />
      </MemoryRouter>,
    );

    window.requestAnimationFrame = origRAF;
    expect(calls).toContain(100);
    expect(calls).toContain(500);
  });
});
