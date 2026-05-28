import { describe, expect, it } from 'vitest';
import { cn } from './cn';

describe('cn', () => {
  it('returns an empty string when called with no arguments', () => {
    expect(cn()).toBe('');
  });

  it('returns a single class unchanged', () => {
    expect(cn('foo')).toBe('foo');
  });

  it('joins multiple classes with a space', () => {
    expect(cn('foo', 'bar', 'baz')).toBe('foo bar baz');
  });

  it('ignores falsy values', () => {
    expect(cn('a', false, null, undefined, '', 'b')).toBe('a b');
  });

  it('resolves Tailwind conflicts — last wins', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });

  it('supports conditional object syntax', () => {
    expect(cn({ 'font-bold': true, italic: false })).toBe('font-bold');
  });

  it('supports array syntax', () => {
    expect(cn(['a', 'b'], 'c')).toBe('a b c');
  });
});
