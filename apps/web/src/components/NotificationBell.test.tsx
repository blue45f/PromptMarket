import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import NotificationBell from './NotificationBell'

describe('NotificationBell', () => {
  it('renders the bell trigger', () => {
    render(<NotificationBell />)
    expect(screen.getByRole('button', { name: /알림|notifications/i })).toBeTruthy()
  })

  it('toggles the placeholder panel', () => {
    render(<NotificationBell />)
    const button = screen.getByRole('button', { name: /알림|notifications/i })
    fireEvent.click(button)
    expect(screen.getByText(/알림 센터|notification center/i)).toBeTruthy()
    fireEvent.click(button)
    expect(screen.queryByText(/알림 센터|notification center/i)).toBeNull()
  })
})
