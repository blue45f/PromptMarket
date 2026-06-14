import { useWishlistStore } from '@store/wishlist'
import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import WishlistButton from './WishlistButton'

beforeEach(() => {
  // Reset Zustand store state and clear localStorage between tests.
  useWishlistStore.setState({ slugs: [] })
  localStorage.clear()
})

describe('<WishlistButton />', () => {
  it('renders inactive state by default with the "card" variant', () => {
    render(<WishlistButton slug="l1" />)
    const btn = screen.getByRole('button')
    expect(btn.getAttribute('aria-pressed')).toBe('false')
    expect(btn.getAttribute('aria-label')).toBe('위시리스트에 담기')
  })

  it('reflects active state when the slug is already in wishlist', () => {
    useWishlistStore.setState({ slugs: ['l1'] })
    render(<WishlistButton slug="l1" />)
    const btn = screen.getByRole('button')
    expect(btn.getAttribute('aria-pressed')).toBe('true')
    expect(btn.getAttribute('aria-label')).toBe('위시리스트에서 빼기')
  })

  it('adds the slug to the wishlist on click and prevents the parent link', () => {
    const linkClick = vi.fn()
    render(
      <a href="/should-not-trigger" onClick={linkClick}>
        <WishlistButton slug="l1" />
      </a>
    )
    fireEvent.click(screen.getByRole('button'))
    expect(useWishlistStore.getState().slugs).toContain('l1')
    // stopPropagation should have kept the parent link from firing.
    expect(linkClick).not.toHaveBeenCalled()
  })

  it('removes the slug on a second click', () => {
    useWishlistStore.setState({ slugs: ['l1'] })
    render(<WishlistButton slug="l1" />)
    fireEvent.click(screen.getByRole('button'))
    expect(useWishlistStore.getState().slugs).toEqual([])
  })

  it('renders the inline variant with text label', () => {
    render(<WishlistButton slug="l1" variant="inline" />)
    expect(screen.getByText('위시리스트')).toBeTruthy()
  })

  it('inline variant flips text to "저장됨" when active', () => {
    useWishlistStore.setState({ slugs: ['l1'] })
    render(<WishlistButton slug="l1" variant="inline" />)
    expect(screen.getByText('저장됨')).toBeTruthy()
  })
})
