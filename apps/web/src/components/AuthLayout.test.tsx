import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect } from 'vitest'

import AuthLayout from './AuthLayout'

function renderAuthLayout(overrides: Partial<React.ComponentProps<typeof AuthLayout>> = {}) {
  const props = {
    kicker: '테스트 킥커',
    title: <span>테스트 타이틀</span>,
    highlight: <span>테스트 하이라이트</span>,
    description: '테스트 설명입니다.',
    children: <div>테스트 자식</div>,
    altPrompt: <span>테스트 얼터</span>,
    ...overrides,
  }
  return render(
    <MemoryRouter>
      <AuthLayout {...props} />
    </MemoryRouter>
  )
}

describe('AuthLayout', () => {
  it('renders kicker text', () => {
    renderAuthLayout()
    expect(screen.getByText('테스트 킥커')).toBeTruthy()
  })

  it('renders title content', () => {
    renderAuthLayout()
    expect(screen.getByText('테스트 타이틀')).toBeTruthy()
  })

  it('renders description text', () => {
    renderAuthLayout()
    expect(screen.getByText('테스트 설명입니다.')).toBeTruthy()
  })

  it('renders children slot content', () => {
    renderAuthLayout()
    expect(screen.getByText('테스트 자식')).toBeTruthy()
  })

  it('renders altPrompt slot content', () => {
    renderAuthLayout()
    expect(screen.getByText('테스트 얼터')).toBeTruthy()
  })

  it('renders highlight text in the right brand column', () => {
    renderAuthLayout()
    expect(screen.getByText('테스트 하이라이트')).toBeTruthy()
  })

  it('has a link back to "/" with 카탈로그로 text', () => {
    renderAuthLayout()
    expect(screen.getByRole('link', { name: /카탈로그로/i })).toBeTruthy()
  })
})
