import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import StarRating from './StarRating'

describe('<StarRating />', () => {
  it('renders five star icons in display mode without buttons', () => {
    const { container } = render(<StarRating value={3.7} />)
    // Display mode: wrapper is role="img", stars are aria-hidden spans (no buttons)
    expect(screen.getByRole('img')).toBeTruthy()
    expect(container.querySelectorAll('svg')).toHaveLength(5)
  })

  it('rounds value to the nearest integer for fill count', () => {
    const { container } = render(<StarRating value={3.4} />)
    // Display mode uses aria-hidden spans; query SVGs directly.
    const svgs = container.querySelectorAll('svg')
    // Math.round(3.4) = 3 → first 3 filled, last 2 unfilled.
    expect(svgs[0].classList.contains('fill-volt-400')).toBe(true)
    expect(svgs[2].classList.contains('fill-volt-400')).toBe(true)
    expect(svgs[3].classList.contains('fill-volt-400')).toBe(false)
  })

  it('has no interactive buttons in read-only mode; wrapper is role="img"', () => {
    render(<StarRating value={4} />)
    expect(screen.queryAllByRole('button')).toHaveLength(0)
    expect(screen.getByRole('img')).toBeTruthy()
  })

  it('enables every button when onChange is supplied (interactive)', () => {
    render(<StarRating value={4} onChange={vi.fn()} />)
    for (const btn of screen.getAllByRole('radio')) {
      expect(btn).not.toBeDisabled()
    }
  })

  it('clicking a star fires onChange with its 1-based index', () => {
    const onChange = vi.fn()
    render(<StarRating value={0} onChange={onChange} />)
    fireEvent.click(screen.getAllByRole('radio')[3])
    expect(onChange).toHaveBeenCalledWith(4)
  })

  it('shows the label like "4.5 (12)" when showLabel + count provided', () => {
    render(<StarRating value={4.5} count={12} showLabel />)
    expect(screen.getByText('4.5 (12)')).toBeTruthy()
  })

  it('shows just "(N)" when count is provided without showLabel', () => {
    render(<StarRating value={4.5} count={7} />)
    expect(screen.getByText('(7)')).toBeTruthy()
    expect(screen.queryByText('4.5 (7)')).toBeNull()
  })

  it('hovering paints the preview fill independent of the value', () => {
    render(<StarRating value={2} onChange={vi.fn()} />)
    const buttons = screen.getAllByRole('radio')
    fireEvent.mouseEnter(buttons[4])
    // All five stars should now be filled in the preview.
    for (const btn of buttons) {
      expect(btn.querySelector('.fill-volt-400')).not.toBeNull()
    }
  })
})
