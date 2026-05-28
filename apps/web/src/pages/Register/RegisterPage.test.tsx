import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import RegisterPage from './RegisterPage';

vi.mock('@features/marketplace/queries', () => ({
  useRegister: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
}));

vi.mock('@hooks/usePageMeta', () => ({ usePageMeta: vi.fn() }));

function withProviders(node: React.ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <MemoryRouter>
      <QueryClientProvider client={qc}>{node}</QueryClientProvider>
    </MemoryRouter>
  );
}

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the email input', () => {
    render(withProviders(<RegisterPage />));
    const emailInput =
      screen.queryByRole('textbox', { name: /이메일/i }) ??
      document.querySelector('input[type="email"]');
    expect(emailInput).toBeTruthy();
  });

  it('renders the username input', () => {
    render(withProviders(<RegisterPage />));
    const usernameInput =
      screen.queryByRole('textbox', { name: /사용자명/i }) ??
      document.querySelector('input[autocomplete="username"]');
    expect(usernameInput).toBeTruthy();
  });

  it('renders the password input', () => {
    render(withProviders(<RegisterPage />));
    const passwordInput = document.querySelector('input[type="password"]');
    expect(passwordInput).toBeTruthy();
  });

  it('shows the 계정 만들기 submit button', () => {
    render(withProviders(<RegisterPage />));
    expect(screen.getByRole('button', { name: /계정 만들기/i })).toBeTruthy();
  });
});
