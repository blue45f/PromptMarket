import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useStructuredData } from './useStructuredData';

const TAG = 'script[type="application/ld+json"][data-source="promptmarket-structured"]';

function injected(): HTMLScriptElement[] {
  return Array.from(document.head.querySelectorAll<HTMLScriptElement>(TAG));
}

afterEach(() => {
  injected().forEach((tag) => tag.remove());
});

describe('useStructuredData', () => {
  it('injects exactly one ld+json script with the serialised payload', () => {
    const payload = { '@type': 'Product', name: 'A' };
    renderHook(() => useStructuredData(payload));
    const tags = injected();
    expect(tags.length).toBe(1);
    expect(JSON.parse(tags[0]?.textContent ?? '{}')).toEqual(payload);
  });

  it('removes the script on unmount', () => {
    const { unmount } = renderHook(() =>
      useStructuredData({ '@type': 'Product', name: 'B' }),
    );
    expect(injected().length).toBe(1);
    unmount();
    expect(injected().length).toBe(0);
  });

  it('is a no-op when data is null', () => {
    renderHook(() => useStructuredData(null));
    expect(injected().length).toBe(0);
  });

  it('replaces the script (no duplicates) when the payload changes', () => {
    const { rerender } = renderHook(({ d }: { d: object | null }) => useStructuredData(d), {
      initialProps: { d: { '@type': 'Product', name: 'first' } as object | null },
    });
    expect(injected().length).toBe(1);
    rerender({ d: { '@type': 'Product', name: 'second' } });
    const tags = injected();
    expect(tags.length).toBe(1);
    expect(JSON.parse(tags[0]?.textContent ?? '{}')).toEqual({
      '@type': 'Product',
      name: 'second',
    });
  });
});
