import { useThemeStore } from '@store/theme'
import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import ThemeToggle from './ThemeToggle'

beforeEach(() => {
  localStorage.clear()
  document.documentElement.classList.remove('dark')
  document.documentElement.style.transition = ''
  useThemeStore.setState({ mode: 'system' })
})

afterEach(() => {
  document.documentElement.classList.remove('dark')
  document.documentElement.style.transition = ''
})

describe('<ThemeToggle />', () => {
  it('renders an accessible trigger button', () => {
    render(<ThemeToggle />)
    const btn = screen.getByRole('button', { name: '테마 전환' })
    expect(btn).toBeTruthy()
  })

  it('reflects the current theme mode in the trigger icon (system → Monitor)', () => {
    useThemeStore.setState({ mode: 'system' })
    const { container } = render(<ThemeToggle />)
    // lucide-react renders the icon as an svg with `lucide-monitor`-style class.
    const svg = container.querySelector('svg')
    expect(svg).not.toBeNull()
    expect(svg?.getAttribute('class') ?? '').toMatch(/monitor/i)
  })

  it('switches the trigger icon to Moon for dark mode', () => {
    useThemeStore.setState({ mode: 'dark' })
    const { container } = render(<ThemeToggle />)
    const svg = container.querySelector('svg')
    expect(svg?.getAttribute('class') ?? '').toMatch(/moon/i)
  })

  it('switches the trigger icon to Sun for light mode', () => {
    useThemeStore.setState({ mode: 'light' })
    const { container } = render(<ThemeToggle />)
    const svg = container.querySelector('svg')
    expect(svg?.getAttribute('class') ?? '').toMatch(/sun/i)
  })
})
