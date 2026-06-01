import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import CompareTray from './CompareTray'

const baseListing = {
  id: 'l1',
  slug: 'alpha-prompt',
  title: 'Alpha Prompt',
  type: 'PROMPT' as const,
  description: 'First option',
  category: 'Coding',
  tags: [],
  models: ['claude-opus-4-7', 'gpt-5'],
  author: { id: 'a1', username: 'author' },
  technique: null,
  difficulty: 'intermediate' as const,
  license: 'MIT' as const,
  version: '1.0.0',
  priceCents: 199,
  coverEmoji: '✨',
  downloads: 12,
  avgRating: 4.5,
  reviewCount: 3,
  createdAt: '2026-05-01T00:00:00Z',
}

describe('<CompareTray />', () => {
  it('renders selected listings in a buyer comparison table', () => {
    render(
      <MemoryRouter>
        <CompareTray
          items={[
            baseListing,
            {
              ...baseListing,
              id: 'l2',
              slug: 'beta-mcp',
              title: 'Beta MCP Server',
              type: 'MCP_SERVER',
              models: ['any'],
              priceCents: 0,
              downloads: 0,
              reviewCount: 0,
            },
          ]}
          onRemove={vi.fn()}
          onClear={vi.fn()}
          now={new Date('2026-06-01')}
        />
      </MemoryRouter>
    )

    expect(screen.getByRole('heading', { name: '비교 후보' })).toBeTruthy()
    expect(screen.getAllByText('Alpha Prompt').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Beta MCP Server').length).toBeGreaterThan(0)
    expect(screen.getByText('$1.99')).toBeTruthy()
    expect(screen.getByText('무료')).toBeTruthy()
    expect(screen.getByText(/멀티 모델/)).toBeTruthy()
    expect(screen.getByText(/검증 리뷰/)).toBeTruthy()
  })

  it('calls remove and clear actions without requiring navigation', () => {
    const onRemove = vi.fn()
    const onClear = vi.fn()
    render(
      <MemoryRouter>
        <CompareTray
          items={[baseListing]}
          onRemove={onRemove}
          onClear={onClear}
          now={new Date('2026-06-01')}
        />
      </MemoryRouter>
    )

    fireEvent.click(screen.getByRole('button', { name: '비교에서 제거: Alpha Prompt' }))
    expect(onRemove).toHaveBeenCalledWith('l1')

    fireEvent.click(screen.getByRole('button', { name: '비교 비우기' }))
    expect(onClear).toHaveBeenCalled()
  })
})
