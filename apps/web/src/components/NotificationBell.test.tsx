import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import NotificationBell from './NotificationBell'

beforeEach(() => {
  localStorage.clear()
})

function renderBell() {
  return render(
    <MemoryRouter>
      <NotificationBell />
    </MemoryRouter>
  )
}

describe('NotificationBell', () => {
  it('renders the bell trigger', () => {
    renderBell()
    expect(screen.getByRole('button', { name: /알림|notifications/i })).toBeTruthy()
  })

  it('announces unread count from the trigger', () => {
    renderBell()
    expect(screen.getByRole('button', { name: /2건 새 알림|2 unread/i })).toBeTruthy()
  })

  it('toggles the notification panel', () => {
    renderBell()
    const button = screen.getByRole('button', { name: /알림|notifications/i })
    fireEvent.click(button)
    expect(screen.getByRole('dialog', { name: /알림|notifications/i })).toBeTruthy()
    fireEvent.click(button)
    expect(screen.queryByRole('dialog', { name: /알림|notifications/i })).toBeNull()
  })

  it('closes on Escape and outside click', () => {
    renderBell()
    const button = screen.getByRole('button', { name: /알림|notifications/i })
    fireEvent.click(button)

    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' })
    expect(screen.queryByRole('dialog', { name: /알림|notifications/i })).toBeNull()

    fireEvent.click(button)
    expect(screen.getByRole('dialog', { name: /알림|notifications/i })).toBeTruthy()

    fireEvent.mouseDown(document.body)
    expect(screen.queryByRole('dialog', { name: /알림|notifications/i })).toBeNull()
  })

  it('marks all items as read', () => {
    renderBell()
    const button = screen.getByRole('button', { name: /알림|notifications/i })
    fireEvent.click(button)
    const markAll = screen.getByRole('button', { name: /mark all as read|모두 읽음 처리/i })
    fireEvent.click(markAll)
    expect(screen.queryByText(/새 알림/i)).toBeNull()
    expect(markAll).toBeDisabled()
  })

  it('persists read state across mounts', () => {
    const { unmount } = renderBell()
    fireEvent.click(screen.getByRole('button', { name: /알림|notifications/i }))
    fireEvent.click(screen.getByRole('button', { name: /mark all as read|모두 읽음 처리/i }))
    expect(localStorage.getItem('pm.notificationReadIds')).toContain('wishlist-watchers')

    unmount()
    renderBell()
    fireEvent.click(screen.getByRole('button', { name: /알림|notifications/i }))
    expect(screen.getByText(/모든 알림을 확인|all clear/i)).toBeTruthy()
    expect(screen.queryByText(/새 알림/i)).toBeNull()
  })

  it('renders notification actions as navigable links', () => {
    renderBell()
    fireEvent.click(screen.getByRole('button', { name: /알림|notifications/i }))
    expect(screen.getByRole('link', { name: /위시리스트 열기|open wishlist/i })).toBeTruthy()
    expect(screen.getByRole('link', { name: /변경 내용 보기|see what/i })).toBeTruthy()
  })
})
