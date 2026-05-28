import { act, render } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useNavShortcuts } from './useNavShortcuts';
import { useAuthStore } from '@store/auth';

function LocationReader({ to }: { to: { value: string } }) {
  const loc = useLocation();
  to.value = loc.pathname;
  return null;
}

function Harness({ to }: { to: { value: string } }) {
  useNavShortcuts();
  return <LocationReader to={to} />;
}

function press(key: string) {
  act(() => {
    document.body.dispatchEvent(
      new KeyboardEvent('keydown', { key, bubbles: true }),
    );
  });
}

beforeEach(() => {
  useAuthStore.setState({ token: null, user: null });
  window.localStorage.clear();
});

afterEach(() => {
  useAuthStore.setState({ token: null, user: null });
});

describe('useNavShortcuts', () => {
  it('routes "g b" to /browse', () => {
    const to = { value: '' };
    render(
      <MemoryRouter initialEntries={['/']}>
        <Harness to={to} />
      </MemoryRouter>,
    );
    press('g');
    press('b');
    expect(to.value).toBe('/browse');
  });

  it('routes "g h" back to /', () => {
    const to = { value: '' };
    render(
      <MemoryRouter initialEntries={['/browse']}>
        <Harness to={to} />
      </MemoryRouter>,
    );
    press('g');
    press('h');
    expect(to.value).toBe('/');
  });

  it('routes single "c" to /sell when authed', () => {
    useAuthStore.setState({ token: 'jwt', user: null });
    const to = { value: '' };
    render(
      <MemoryRouter initialEntries={['/browse']}>
        <Harness to={to} />
      </MemoryRouter>,
    );
    press('c');
    expect(to.value).toBe('/sell');
  });

  it('ignores single "c" when signed out', () => {
    const to = { value: '' };
    render(
      <MemoryRouter initialEntries={['/browse']}>
        <Harness to={to} />
      </MemoryRouter>,
    );
    press('c');
    expect(to.value).toBe('/browse');
  });

  it('does not arm "g" when the event target is an input', () => {
    const to = { value: '' };
    render(
      <MemoryRouter initialEntries={['/']}>
        <Harness to={to} />
      </MemoryRouter>,
    );
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();
    act(() => {
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'g', bubbles: true }));
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'b', bubbles: true }));
    });
    expect(to.value).toBe('/');
    input.remove();
  });
});
