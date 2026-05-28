import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useCountUp } from './useCountUp';

describe('useCountUp', () => {
  it('exposes a ref and starts at 0', () => {
    const { result } = renderHook(() => useCountUp(100));
    expect(result.current.value).toBe(0);
    // Ref starts unattached; consumers wire it up in JSX.
    expect((result.current.ref as React.MutableRefObject<unknown>).current).toBeNull();
  });

  it('updates the ref identity stably across rerenders', () => {
    const { result, rerender } = renderHook(({ t }) => useCountUp(t), {
      initialProps: { t: 10 },
    });
    const refA = result.current.ref;
    rerender({ t: 20 });
    const refB = result.current.ref;
    expect(refA).toBe(refB);
  });

  it('accepts a custom duration without throwing', () => {
    expect(() => renderHook(() => useCountUp(50, 250))).not.toThrow();
  });
});
