import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useWishlist } from './useWishlist';

afterEach(() => {
  window.localStorage.clear();
});

describe('useWishlist', () => {
  it('starts empty and toggles a slug in and out', () => {
    const { result } = renderHook(() => useWishlist());
    expect(result.current.slugs).toEqual([]);
    expect(result.current.has('a')).toBe(false);

    act(() => result.current.toggle('a'));
    expect(result.current.slugs).toEqual(['a']);
    expect(result.current.has('a')).toBe(true);

    act(() => result.current.toggle('a'));
    expect(result.current.slugs).toEqual([]);
  });

  it('keeps most-recent first when toggling multiple slugs', () => {
    const { result } = renderHook(() => useWishlist());
    act(() => {
      result.current.toggle('a');
      result.current.toggle('b');
      result.current.toggle('c');
    });
    expect(result.current.slugs).toEqual(['c', 'b', 'a']);
  });

  it('clear() empties the store and persists it', () => {
    const { result } = renderHook(() => useWishlist());
    act(() => result.current.toggle('a'));
    act(() => result.current.clear());
    expect(result.current.slugs).toEqual([]);
    expect(window.localStorage.getItem('pm.wishlist')).toBe('[]');
  });
});
