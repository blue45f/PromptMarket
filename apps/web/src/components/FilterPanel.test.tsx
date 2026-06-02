import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import FilterPanel, { countActive, emptyFilters, type FilterState } from './FilterPanel'

describe('emptyFilters', () => {
  it('returns the zero state', () => {
    expect(emptyFilters()).toEqual({
      types: [],
      models: [],
      technique: '',
      difficulty: '',
      category: '',
      price: 'all',
    })
  })
})

describe('countActive', () => {
  it('counts zero on the empty state', () => {
    expect(countActive(emptyFilters())).toBe(0)
  })

  it('counts every dimension once, ignoring price=all', () => {
    const f: FilterState = {
      types: ['PROMPT', 'SKILL'],
      models: ['gpt-5'],
      technique: 'chain-of-thought',
      difficulty: 'beginner',
      category: 'Coding',
      price: 'all',
    }
    expect(countActive(f)).toBe(2 + 1 + 1 + 1 + 1)
  })

  it('counts price when it is free or paid', () => {
    expect(countActive({ ...emptyFilters(), price: 'free' })).toBe(1)
    expect(countActive({ ...emptyFilters(), price: 'paid' })).toBe(1)
  })
})

describe('<FilterPanel />', () => {
  it('toggles a type chip on click', () => {
    const onChange = vi.fn()
    render(<FilterPanel value={emptyFilters()} onChange={onChange} onReset={vi.fn()} />)
    // TypeBadge + FilterPanel localize PROMPT → '프롬프트' under ko default.
    fireEvent.click(screen.getByRole('button', { name: /프롬프트/ }))
    expect(onChange).toHaveBeenCalledTimes(1)
    const next = onChange.mock.calls[0][0] as FilterState
    expect(next.types).toEqual(['PROMPT'])
  })

  it('removes the technique section when the active types exclude PROMPT', () => {
    const onChange = vi.fn()
    const { rerender } = render(
      <FilterPanel value={emptyFilters()} onChange={onChange} onReset={vi.fn()} />
    )
    // Technique header is visible on the empty state (PROMPT is "default-on").
    expect(screen.queryByText('프롬프트 기법')).not.toBeNull()
    rerender(
      <FilterPanel
        value={{ ...emptyFilters(), types: ['SKILL'] }}
        onChange={onChange}
        onReset={vi.fn()}
      />
    )
    expect(screen.queryByText('프롬프트 기법')).toBeNull()
  })

  it('fires onReset when the "전부 초기화" button is clicked', () => {
    const onReset = vi.fn()
    render(
      <FilterPanel
        value={{ ...emptyFilters(), category: 'Coding' }}
        onChange={vi.fn()}
        onReset={onReset}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: '전부 초기화' }))
    expect(onReset).toHaveBeenCalledTimes(1)
  })

  it('summarizes the empty filter state and disables reset until a condition is active', () => {
    const onReset = vi.fn()
    const { container } = render(
      <FilterPanel value={emptyFilters()} onChange={vi.fn()} onReset={onReset} />
    )

    expect(screen.getByText('조건 없음')).toBeTruthy()
    expect(container.querySelector('[data-filter-panel-status]')).toBeTruthy()
    const reset = screen.getByRole('button', { name: '전부 초기화' })
    expect(reset).toBeDisabled()
    fireEvent.click(reset)
    expect(onReset).not.toHaveBeenCalled()
  })

  it('shows the active condition count when filters are selected', () => {
    render(
      <FilterPanel
        value={{ ...emptyFilters(), types: ['PROMPT'], price: 'free' }}
        onChange={vi.fn()}
        onReset={vi.fn()}
      />
    )

    expect(screen.getByText('조건 2개')).toBeTruthy()
    expect(screen.getByRole('button', { name: '전부 초기화' })).toBeEnabled()
  })

  it('sets price=free via the radiogroup', () => {
    const onChange = vi.fn()
    render(<FilterPanel value={emptyFilters()} onChange={onChange} onReset={vi.fn()} />)
    fireEvent.click(screen.getByRole('radio', { name: '무료' }))
    const next = onChange.mock.calls[0][0] as FilterState
    expect(next.price).toBe('free')
  })
})
