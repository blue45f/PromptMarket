import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import LoginPage from './LoginPage'

vi.mock('@features/marketplace/queries', () => ({
  useLogin: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
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

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the email input', () => {
    render(withProviders(<LoginPage />))
    const emailInput =
      screen.queryByRole('textbox', { name: /이메일/i }) ??
      document.querySelector('input[type="email"]')
    expect(emailInput).toBeTruthy()
  })

  it('renders the password input', () => {
    render(withProviders(<LoginPage />))
    const passwordInput = document.querySelector('input[type="password"]')
    expect(passwordInput).toBeTruthy()
  })

  it('shows the 로그인 submit button', () => {
    render(withProviders(<LoginPage />))
    expect(screen.getByRole('button', { name: /로그인/i })).toBeTruthy()
  })

  it('shows demo accounts section header', () => {
    render(withProviders(<LoginPage />))
    expect(screen.getByText(/데모 계정/i)).toBeTruthy()
    expect(document.querySelector('[title*="alice@example.com"]')).toBeTruthy()
  })

  it('surfaces accessible validation on empty submit', async () => {
    render(withProviders(<LoginPage />))
    fireEvent.click(screen.getByRole('button', { name: /로그인/i }))

    const emailError = await screen.findByText('올바른 이메일 주소를 입력해 주세요.')
    expect(emailError).toHaveAttribute('role', 'alert')
    const emailInput = document.querySelector('input[type="email"]')
    expect(emailInput).toHaveAttribute('aria-invalid', 'true')
  })
})
