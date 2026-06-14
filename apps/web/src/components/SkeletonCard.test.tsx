import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import SkeletonCard, { SkeletonGrid } from './SkeletonCard'

describe('<SkeletonCard />', () => {
  it('renders without errors with default seed', () => {
    const { container } = render(<SkeletonCard />)
    expect(container.firstChild).toBeTruthy()
  })

  it('applies extra className to the outer wrapper', () => {
    const { container } = render(<SkeletonCard className="surface-card extra-class" />)
    expect((container.firstChild as HTMLElement).classList.contains('extra-class')).toBe(true)
  })
})

describe('<SkeletonGrid />', () => {
  it('renders the default count of 8 skeleton cards', () => {
    const { container } = render(<SkeletonGrid />)
    expect(container.querySelectorAll('.surface-card').length).toBe(8)
  })

  it('renders the specified count of skeleton cards', () => {
    const { container } = render(<SkeletonGrid count={3} />)
    expect(container.querySelectorAll('.surface-card').length).toBe(3)
  })
})
