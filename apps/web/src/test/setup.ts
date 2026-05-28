import '@testing-library/jest-dom/vitest'

// jsdom doesn't ship matchMedia. Provide a default-false implementation so
// hooks that probe prefers-reduced-motion / prefers-contrast etc. don't
// throw on mount. Individual tests can monkey-patch this when they need
// to assert against a specific media-query value.
if (typeof window !== 'undefined' && typeof window.matchMedia === 'undefined') {
  ;(window as unknown as { matchMedia: typeof window.matchMedia }).matchMedia = ((query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList) as typeof window.matchMedia
}

// jsdom defines scrollTo but reports it as "not implemented" when invoked.
// Use a quiet no-op default; individual tests can still spy or replace it.
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'scrollTo', {
    configurable: true,
    value: () => undefined,
    writable: true,
  })
}

// jsdom also doesn't ship IntersectionObserver. useCountUp and useReveal both
// gate animation start on entering the viewport; provide a no-op that never
// fires so the hooks don't crash on mount.
if (
  typeof globalThis !== 'undefined' &&
  typeof (globalThis as { IntersectionObserver?: unknown }).IntersectionObserver === 'undefined'
) {
  class IntersectionObserverShim {
    constructor(_callback: IntersectionObserverCallback, _options: IntersectionObserverInit = {}) {
      void _callback
      void _options
    }

    observe(_target: Element) {}
    unobserve(_target: Element) {}
    disconnect() {}
    takeRecords() {
      return [] as IntersectionObserverEntry[]
    }

    root = null
    rootMargin = ''
    thresholds: ReadonlyArray<number> = []
  }

  ;(
    globalThis as unknown as { IntersectionObserver: typeof IntersectionObserverShim }
  ).IntersectionObserver = IntersectionObserverShim as never
}
