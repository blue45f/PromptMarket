import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/react';
import ScrollToTop from './ScrollToTop';

const originalScrollTo = window.scrollTo;

function findBtn(): HTMLButtonElement {
  // aria-hidden hides it from accessible-role queries, so reach for the
  // <button> directly and trust the aria-label as the lookup key.
  const btn = document.querySelector<HTMLButtonElement>(
    'button[aria-label="맨 위로"]',
  );
  if (!btn) throw new Error('ScrollToTop button not found');
  return btn;
}

beforeEach(() => {
  Object.defineProperty(window, 'scrollY', { value: 0, configurable: true });
});

afterEach(() => {
  Object.defineProperty(window, 'scrollY', { value: 0, configurable: true });
  window.scrollTo = originalScrollTo;
  vi.restoreAllMocks();
});

describe('<ScrollToTop />', () => {
  it('renders hidden initially (aria-hidden + tabIndex -1)', () => {
    render(<ScrollToTop />);
    const btn = findBtn();
    expect(btn.getAttribute('aria-hidden')).toBe('true');
    expect(btn.getAttribute('tabindex')).toBe('-1');
  });

  it('calls window.scrollTo({top:0, behavior:smooth}) on click', () => {
    const scrollTo = vi.fn();
    window.scrollTo = scrollTo as never;
    render(<ScrollToTop />);
    fireEvent.click(findBtn());
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
  });

  it('uses behavior=auto when prefers-reduced-motion is set', () => {
    const scrollTo = vi.fn();
    window.scrollTo = scrollTo as never;
    vi.spyOn(window, 'matchMedia').mockReturnValue({
      matches: true,
      media: '(prefers-reduced-motion: reduce)',
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
    } as MediaQueryList);
    render(<ScrollToTop />);
    fireEvent.click(findBtn());
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'auto' });
  });
});
