import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import WishlistButton from './WishlistButton';

const WISHLIST_KEY = 'pm.wishlist';

beforeEach(() => {
  localStorage.clear();
});

describe('<WishlistButton />', () => {
  it('renders inactive state by default with the "card" variant', () => {
    render(<WishlistButton slug="l1" />);
    const btn = screen.getByRole('button');
    expect(btn.getAttribute('aria-pressed')).toBe('false');
    expect(btn.getAttribute('aria-label')).toBe('위시리스트에 담기');
  });

  it('reflects active state when the slug is already in wishlist', () => {
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(['l1']));
    render(<WishlistButton slug="l1" />);
    const btn = screen.getByRole('button');
    expect(btn.getAttribute('aria-pressed')).toBe('true');
    expect(btn.getAttribute('aria-label')).toBe('위시리스트에서 빼기');
  });

  it('writes the slug into localStorage on click and prevents the parent link', () => {
    const linkClick = vi.fn();
    render(
      <a href="/should-not-trigger" onClick={linkClick}>
        <WishlistButton slug="l1" />
      </a>,
    );
    fireEvent.click(screen.getByRole('button'));
    expect(JSON.parse(localStorage.getItem(WISHLIST_KEY) ?? '[]')).toContain(
      'l1',
    );
    // stopPropagation should have kept the parent link's click handler from
    // firing the navigation.
    expect(linkClick).not.toHaveBeenCalled();
  });

  it('removes the slug from localStorage on a second click', () => {
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(['l1']));
    render(<WishlistButton slug="l1" />);
    fireEvent.click(screen.getByRole('button'));
    expect(JSON.parse(localStorage.getItem(WISHLIST_KEY) ?? '[]')).toEqual([]);
  });

  it('renders the inline variant with text label', () => {
    render(<WishlistButton slug="l1" variant="inline" />);
    expect(screen.getByText('위시리스트')).toBeTruthy();
  });

  it('inline variant flips text to "저장됨" when active', () => {
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(['l1']));
    render(<WishlistButton slug="l1" variant="inline" />);
    expect(screen.getByText('저장됨')).toBeTruthy();
  });
});
