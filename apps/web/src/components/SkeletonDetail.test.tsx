import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'

import SkeletonDetail from './SkeletonDetail'

describe('SkeletonDetail', () => {
  it('renders without errors', () => {
    render(<SkeletonDetail />)
  })

  it('has a max-width container as the first child', () => {
    const { container } = render(<SkeletonDetail />)
    expect(container.firstElementChild).toBeTruthy()
  })

  it('contains pulse-animated elements', () => {
    const { container } = render(<SkeletonDetail />)
    expect(container.querySelectorAll('[class*="animate-pulse"]').length > 0).toBeTruthy()
  })
})
