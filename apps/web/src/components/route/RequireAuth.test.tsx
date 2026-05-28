import { describe, expect, it, vi, type Mock } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import RequireAuth from './RequireAuth';

vi.mock('@store/auth', () => ({ useAuthStore: vi.fn() }));
import { useAuthStore } from '@store/auth';

function TestApp({ token }: { token: string | null }) {
  (useAuthStore as unknown as Mock).mockReturnValue(token);
  return (
    <MemoryRouter initialEntries={['/protected']}>
      <Routes>
        <Route path="/login" element={<div>login page</div>} />
        <Route
          path="/protected"
          element={
            <RequireAuth>
              <div>protected content</div>
            </RequireAuth>
          }
        />
      </Routes>
    </MemoryRouter>
  );
}

describe('<RequireAuth />', () => {
  it('renders children when a token is present', () => {
    render(<TestApp token="test-token" />);
    expect(screen.getByText('protected content')).toBeTruthy();
  });

  it('redirects to /login when token is null', () => {
    render(<TestApp token={null} />);
    expect(screen.getByText('login page')).toBeTruthy();
    expect(screen.queryByText('protected content')).toBeFalsy();
  });
});
