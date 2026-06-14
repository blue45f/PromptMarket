import { useAuthStore } from '@store/auth'
import { act, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { useNavShortcuts } from './useNavShortcuts'

// Report the current pathname through the DOM instead of mutating a prop —
// writing to props during render is a react-compiler error.
function LocationProbe() {
  const loc = useLocation()
  return <span data-testid="pathname">{loc.pathname}</span>
}

function Harness() {
  useNavShortcuts()
  return <LocationProbe />
}

function pathname() {
  return screen.getByTestId('pathname').textContent
}

async function press(key: string) {
  await act(async () => {
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }))
  })
}

beforeEach(() => {
  act(() => {
    useAuthStore.setState({ token: null, user: null })
  })
  window.localStorage.clear()
})

afterEach(() => {
  act(() => {
    useAuthStore.setState({ token: null, user: null })
  })
})

describe('useNavShortcuts', () => {
  it('routes "g b" to /browse', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Harness />
      </MemoryRouter>
    )
    await press('g')
    await press('b')
    await waitFor(() => expect(pathname()).toBe('/browse'))
  })

  it('routes "g h" back to /', async () => {
    render(
      <MemoryRouter initialEntries={['/browse']}>
        <Harness />
      </MemoryRouter>
    )
    await press('g')
    await press('h')
    await waitFor(() => expect(pathname()).toBe('/'))
  })

  it('routes single "c" to /sell when authed', async () => {
    act(() => {
      useAuthStore.setState({ token: 'jwt', user: null })
    })
    render(
      <MemoryRouter initialEntries={['/browse']}>
        <Harness />
      </MemoryRouter>
    )
    await press('c')
    await waitFor(() => expect(pathname()).toBe('/sell'))
  })

  it('ignores single "c" when signed out', async () => {
    render(
      <MemoryRouter initialEntries={['/browse']}>
        <Harness />
      </MemoryRouter>
    )
    await press('c')
    expect(pathname()).toBe('/browse')
  })

  it('does not arm "g" when the event target is an input', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Harness />
      </MemoryRouter>
    )
    const input = document.createElement('input')
    document.body.appendChild(input)
    input.focus()
    await act(async () => {
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'g', bubbles: true }))
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'b', bubbles: true }))
    })
    expect(pathname()).toBe('/')
    input.remove()
  })
})
