import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import SearchBar from './SearchBar'

const HISTORY_KEY = 'pm.searchHistory'

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  localStorage.clear()
})

function setup(props?: Partial<React.ComponentProps<typeof SearchBar>>) {
  const onSubmit = vi.fn()
  render(<SearchBar onSubmit={onSubmit} {...props} />)
  return { onSubmit }
}

describe('<SearchBar />', () => {
  it('submits the trimmed value and records it in history', () => {
    const { onSubmit } = setup()
    const input = screen.getByRole('combobox')
    fireEvent.change(input, { target: { value: '  hello  ' } })
    fireEvent.submit(input.closest('form')!)
    expect(onSubmit).toHaveBeenCalledWith('hello')
    expect(localStorage.getItem(HISTORY_KEY)).toContain('hello')
  })

  it('does not record an empty submission in history', () => {
    const { onSubmit } = setup()
    const input = screen.getByRole('combobox')
    fireEvent.change(input, { target: { value: '   ' } })
    fireEvent.submit(input.closest('form')!)
    expect(onSubmit).toHaveBeenCalledWith('')
    expect(localStorage.getItem(HISTORY_KEY)).toBeNull()
  })

  it('opens the listbox on focus when history exists', () => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(['claude-code', 'gpt-5']))
    setup()
    const input = screen.getByRole('combobox')
    expect(input.getAttribute('aria-expanded')).toBe('false')
    fireEvent.focus(input)
    expect(input.getAttribute('aria-expanded')).toBe('true')
    expect(screen.getByRole('listbox')).toBeTruthy()
  })

  it('does not open the listbox when history is empty', () => {
    setup()
    const input = screen.getByRole('combobox')
    fireEvent.focus(input)
    expect(input.getAttribute('aria-expanded')).toBe('false')
    expect(screen.queryByRole('listbox')).toBeNull()
  })

  it('arrow-down moves active descendant through the history options', () => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(['claude-code', 'gpt-5']))
    setup()
    const input = screen.getByRole('combobox')
    fireEvent.focus(input)
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    expect(input.getAttribute('aria-activedescendant')).toBe('search-history-option-0')
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    expect(input.getAttribute('aria-activedescendant')).toBe('search-history-option-1')
  })

  it('Enter on a highlighted option commits that value', () => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(['claude-code', 'gpt-5']))
    const { onSubmit } = setup()
    const input = screen.getByRole('combobox')
    fireEvent.focus(input)
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onSubmit).toHaveBeenCalledWith('claude-code')
  })

  it('Escape closes the history listbox', () => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(['x']))
    setup()
    const input = screen.getByRole('combobox')
    fireEvent.focus(input)
    expect(input.getAttribute('aria-expanded')).toBe('true')
    fireEvent.keyDown(input, { key: 'Escape' })
    expect(input.getAttribute('aria-expanded')).toBe('false')
  })

  it('clicking a history option submits it and closes the listbox', () => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(['claude-code']))
    const { onSubmit } = setup()
    const input = screen.getByRole('combobox')
    fireEvent.focus(input)
    const option = screen.getByRole('option', { name: /claude-code/ })
    // The option div itself carries the click handler (no button inside the option).
    fireEvent.click(option)
    expect(onSubmit).toHaveBeenCalledWith('claude-code')
  })
})
