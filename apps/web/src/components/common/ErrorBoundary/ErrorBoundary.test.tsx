import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'

import { ErrorBoundary } from './ErrorBoundary'

function Boom(): never {
  throw new Error('render exploded')
}

describe('ErrorBoundary', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders children when nothing throws', () => {
    render(
      <ErrorBoundary>
        <p>healthy content</p>
      </ErrorBoundary>
    )

    expect(screen.getByText('healthy content')).toBeTruthy()
  })

  it('catches a render throw and shows the localized fallback', () => {
    // React logs the caught error to console.error; silence it for a clean test run.
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>
    )

    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading.textContent).toBe('화면을 표시하지 못했어요')
    expect(screen.getByRole('button', { name: /다시 시도/ })).toBeTruthy()
    expect(screen.getByRole('button', { name: /홈으로/ })).toBeTruthy()
    spy.mockRestore()
  })

  it('exposes the fallback as an alert region for assistive tech', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>
    )

    expect(screen.getByRole('alert')).toBeTruthy()
    spy.mockRestore()
  })
})
