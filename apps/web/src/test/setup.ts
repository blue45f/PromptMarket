import '@testing-library/jest-dom/vitest';

// jsdom doesn't ship matchMedia. Provide a default-false implementation so
// hooks that probe prefers-reduced-motion / prefers-contrast etc. don't
// throw on mount. Individual tests can monkey-patch this when they need
// to assert against a specific media-query value.
if (typeof window !== 'undefined' && typeof window.matchMedia === 'undefined') {
  (window as unknown as { matchMedia: typeof window.matchMedia }).matchMedia = ((
    query: string,
  ) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
    } as unknown as MediaQueryList)) as typeof window.matchMedia;
}
