import { LISTING_TYPE_META, MODELS } from '@promptmarket/shared'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import Hero from './Hero'

vi.mock('@domains/marketplace/queries', () => ({
  useListings: vi.fn(() => ({ data: { items: [] }, isPending: false })),
  useStats: vi.fn(() => ({ data: undefined, isPending: false })),
}))

vi.mock('@hooks/useSpotlight', () => ({
  useSpotlight: vi.fn(() => ({ current: null })),
}))

function withProviders(node: React.ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return (
    <MemoryRouter>
      <QueryClientProvider client={qc}>{node}</QueryClientProvider>
    </MemoryRouter>
  )
}

describe('<Hero />', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders "검증된" in the h1 heading', () => {
    render(withProviders(<Hero />))
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading.textContent).toContain('검증된')
  })

  it('renders "에이전트." in the h1 heading', () => {
    render(withProviders(<Hero />))
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading.textContent).toContain('에이전트.')
  })

  it('has a "카탈로그 둘러보기" link to /browse', () => {
    render(withProviders(<Hero />))
    const link = screen.getByRole('link', { name: /카탈로그 둘러보기/i })
    expect(link.getAttribute('href')).toBe('/browse')
  })

  it('has a "프롬프트 판매하기" link to /sell', () => {
    render(withProviders(<Hero />))
    const link = screen.getByRole('link', { name: /프롬프트 판매하기/i })
    expect(link.getAttribute('href')).toBe('/sell')
  })

  it('derives the model/artifact counts in the hero copy from the shared catalog', () => {
    render(withProviders(<Hero />))
    const expected = `프론티어 모델 ${MODELS.length}종 · 아티팩트 ${Object.keys(LISTING_TYPE_META).length}종`
    expect(screen.getByText(expected)).toBeTruthy()
  })

  it('shows a detail affordance inside the pauseable drops marquee', () => {
    const { container } = render(withProviders(<Hero />))
    expect(container.querySelector('.v-marquee-track')).toBeTruthy()
    expect(screen.getAllByText('자세히 보기').length).toBeGreaterThan(0)
  })
})
