import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import StatsStrip from './StatsStrip'

const mockUseStats = vi.fn()
vi.mock('@domains/marketplace/queries', () => ({
  useStats: () => mockUseStats(),
}))

describe('<StatsStrip />', () => {
  it('renders three stat cells with their Korean labels', () => {
    mockUseStats.mockReturnValue({ data: undefined, isPending: true })
    render(<StatsStrip />)
    expect(screen.getByText('리스팅')).toBeTruthy()
    expect(screen.getByText('다운로드')).toBeTruthy()
    expect(screen.getByText('메이커')).toBeTruthy()
  })

  it('shows pulse placeholders while pending', () => {
    mockUseStats.mockReturnValue({ data: undefined, isPending: true })
    const { container } = render(<StatsStrip />)
    // motion-safe:animate-pulse is the actual class name rendered (Tailwind
    // doesn't strip motion-safe: in unit tests).
    const pulses = container.querySelectorAll('[class*="animate-pulse"]')
    expect(pulses.length).toBe(3)
  })

  it('uses horizontal scroll snap on mobile while preserving the desktop grid', () => {
    mockUseStats.mockReturnValue({ data: undefined, isPending: true })
    const { container } = render(<StatsStrip />)
    const strip = container.firstElementChild as HTMLElement

    expect(strip.className).toContain('grid-flow-col')
    expect(strip.className).toContain('snap-x')
    expect(strip.className).toContain('sm:grid-cols-3')
    expect(
      Array.from(strip.children).every((child) => child.className.includes('snap-start'))
    ).toBe(true)
  })

  it('reads totalListings / totalDownloads / totalCreators from the stats response', () => {
    mockUseStats.mockReturnValue({
      data: { totalListings: 42, totalDownloads: 100, totalCreators: 5 },
      isPending: false,
    })
    render(<StatsStrip />)
    // aria-label exposes the raw integer count even when the visible text
    // uses compact notation.
    expect(screen.getByLabelText('42')).toBeTruthy()
    expect(screen.getByLabelText('100')).toBeTruthy()
    expect(screen.getByLabelText('5')).toBeTruthy()
  })

  it('defaults each metric to 0 when the response is partial', () => {
    mockUseStats.mockReturnValue({
      data: { totalListings: 7 },
      isPending: false,
    })
    render(<StatsStrip />)
    expect(screen.getByLabelText('7')).toBeTruthy()
    // The other two should still render with a 0 aria-label, not crash.
    const zeros = document.querySelectorAll('[aria-label="0"]')
    expect(zeros.length).toBe(2)
  })
})
