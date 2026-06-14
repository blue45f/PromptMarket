import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import RegisterPage from './RegisterPage'

vi.mock('@domains/marketplace/queries', () => ({
  useRegister: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
}))

vi.mock('@hooks/usePageMeta', () => ({ usePageMeta: vi.fn() }))

function withProviders(node: React.ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return (
    <MemoryRouter>
      <QueryClientProvider client={qc}>{node}</QueryClientProvider>
    </MemoryRouter>
  )
}

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the email input', () => {
    render(withProviders(<RegisterPage />))
    const emailInput =
      screen.queryByRole('textbox', { name: /이메일/i }) ??
      document.querySelector('input[type="email"]')
    expect(emailInput).toBeTruthy()
  })

  it('renders the username input', () => {
    render(withProviders(<RegisterPage />))
    const usernameInput =
      screen.queryByRole('textbox', { name: /사용자명/i }) ??
      document.querySelector('input[autocomplete="username"]')
    expect(usernameInput).toBeTruthy()
  })

  it('renders the password input', () => {
    render(withProviders(<RegisterPage />))
    const passwordInput = document.querySelector('input[type="password"]')
    expect(passwordInput).toBeTruthy()
  })

  it('shows the 계정 만들기 submit button', () => {
    render(withProviders(<RegisterPage />))
    expect(screen.getByRole('button', { name: /계정 만들기/i })).toBeTruthy()
  })

  it('links the consent fine print to the internal policy routes', () => {
    render(withProviders(<RegisterPage />))

    expect(screen.getByRole('link', { name: '셀러 약관' })).toHaveAttribute('href', '/terms')
    expect(screen.getByRole('link', { name: '개인정보 처리 방침' })).toHaveAttribute(
      'href',
      '/privacy'
    )
  })

  it('surfaces rule-specific, accessible validation on invalid submit', async () => {
    render(withProviders(<RegisterPage />))
    const username = document.querySelector('input[autocomplete="username"]') as HTMLInputElement
    // 2 chars trips the min(3) rule → the "tooShort" message, not a generic one.
    fireEvent.change(username, { target: { value: 'ab' } })
    fireEvent.click(screen.getByRole('button', { name: /계정 만들기/i }))

    const usernameError = await screen.findByText('사용자명은 3자 이상이어야 해요.')
    // Announced to screen readers and wired to the input.
    expect(usernameError).toHaveAttribute('role', 'alert')
    expect(username).toHaveAttribute('aria-invalid', 'true')
    expect(username.getAttribute('aria-describedby')).toContain('register-username-error')
  })
})
