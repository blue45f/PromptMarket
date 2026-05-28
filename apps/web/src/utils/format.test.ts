import { describe, expect, it } from 'vitest';
import { formatCompact, formatDate, formatDollars } from './format';

describe('formatDollars', () => {
  it.each([
    [0, '$0.00'],
    [100, '$1.00'],
    [199, '$1.99'],
    [12345, '$123.45'],
  ])('formats %d cents as %s', (cents, expected) => {
    expect(formatDollars(cents)).toBe(expected);
  });

  it('treats null-ish input as zero', () => {
    expect(formatDollars(undefined as unknown as number)).toBe('$0.00');
    expect(formatDollars(null as unknown as number)).toBe('$0.00');
  });
});

describe('formatDate', () => {
  it('returns an empty string for unparseable input', () => {
    expect(formatDate('not-a-date')).toBe('');
  });

  it('renders a real date as a non-empty locale string', () => {
    const out = formatDate(new Date('2026-05-01T00:00:00Z'));
    expect(out.length).toBeGreaterThan(0);
    expect(out).toMatch(/2026/);
  });

  it('accepts a string ISO timestamp', () => {
    const out = formatDate('2026-05-01T00:00:00Z');
    expect(out).toMatch(/2026/);
  });
});

describe('formatCompact', () => {
  it.each([
    [null, '0'],
    [undefined, '0'],
    [Number.NaN, '0'],
    [Number.POSITIVE_INFINITY, '0'],
  ])('falls back to "0" for %s', (input, expected) => {
    expect(formatCompact(input as unknown as number)).toBe(expected);
  });

  it('formats large numbers compactly', () => {
    expect(formatCompact(1234)).toMatch(/1\.2K/i);
    expect(formatCompact(2_500_000)).toMatch(/2\.5M/i);
  });
});
