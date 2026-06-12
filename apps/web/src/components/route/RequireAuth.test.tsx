import { describe, expect, it, vi, type Mock } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import RequireAuth from './RequireAuth'

vi.mock('@store/auth', () => ({ useAuthStore: vi.fn() }))
import { useAuthStore } from '@store/auth'

// Mock setup stays outside any component body: referencing a hook as a plain
// value during render is a react-compiler error (hooks may only be called).
function mockToken(token: string | null) {
  ;(useAuthStore as unknown as Mock).mockReturnValue(token)
}

function TestApp() {
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
  )
}

describe('<RequireAuth />', () => {
  it('renders children when a token is present', () => {
    mockToken('test-token')
    render(<TestApp />)
    expect(screen.getByText('protected content')).toBeTruthy()
  })

  it('redirects to /login when token is null', () => {
    mockToken(null)
    render(<TestApp />)
    expect(screen.getByText('login page')).toBeTruthy()
    expect(screen.queryByText('protected content')).toBeFalsy()
  })
})
