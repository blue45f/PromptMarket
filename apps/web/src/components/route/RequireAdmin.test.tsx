import { useAuthStore } from '@store/auth'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi, type Mock } from 'vitest'

import RequireAdmin from './RequireAdmin'

vi.mock('@store/auth', () => ({ useAuthStore: vi.fn() }))

function mockAuthState(state: { token: string | null; user: { isAdmin: boolean } | null }) {
  ;(useAuthStore as unknown as Mock).mockImplementation((selector) => selector(state))
}

function TestApp({ token, user }: { token: string | null; user: { isAdmin: boolean } | null }) {
  mockAuthState({ token, user })

  return (
    <MemoryRouter initialEntries={['/admin']}>
      <Routes>
        <Route path="/login" element={<div>login page</div>} />
        <Route path="/" element={<div>home page</div>} />
        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <div>admin content</div>
            </RequireAdmin>
          }
        />
      </Routes>
    </MemoryRouter>
  )
}

describe('<RequireAdmin />', () => {
  it('redirects to /login when token is missing', () => {
    render(<TestApp token={null} user={null} />)
    expect(screen.getByText('login page')).toBeTruthy()
  })

  it('renders loading state when token exists but user has not hydrated yet', () => {
    render(<TestApp token="jwt-token" user={null} />)
    expect(screen.getByRole('status')).toHaveTextContent(/Loading|불러오는 중/)
    expect(screen.queryByText('admin content')).toBeFalsy()
  })

  it('redirects non-admin users to home', () => {
    render(<TestApp token="jwt-token" user={{ isAdmin: false }} />)
    expect(screen.getByText('home page')).toBeTruthy()
    expect(screen.queryByText('admin content')).toBeFalsy()
  })

  it('renders children when user is admin', () => {
    render(<TestApp token="jwt-token" user={{ isAdmin: true }} />)
    expect(screen.getByText('admin content')).toBeTruthy()
  })
})
