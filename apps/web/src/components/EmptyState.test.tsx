import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import EmptyState from './EmptyState'

describe('<EmptyState />', () => {
  it('renders the required title prop', () => {
    render(<EmptyState title="Nothing here" />)
    expect(screen.getByText('Nothing here')).toBeTruthy()
  })

  it('renders description when provided', () => {
    render(<EmptyState title="Title" description="Some description text" />)
    expect(screen.getByText('Some description text')).toBeTruthy()
  })

  it('does not render a description paragraph when description is omitted', () => {
    const { container } = render(<EmptyState title="Title" />)
    expect(container.querySelector('p')).toBeNull()
  })

  it('renders action slot children when provided', () => {
    render(<EmptyState title="Title" action={<button>Click me</button>} />)
    expect(screen.getByRole('button', { name: 'Click me' })).toBeTruthy()
  })

  it('uses the default 📭 emoji when emoji prop is omitted', () => {
    const { container } = render(<EmptyState title="Title" />)
    expect(container.textContent).toContain('📭')
  })

  it('renders a custom emoji when emoji prop is provided', () => {
    const { container } = render(<EmptyState title="Title" emoji="🎉" />)
    expect(container.textContent).toContain('🎉')
    expect(container.textContent).not.toContain('📭')
  })
})
