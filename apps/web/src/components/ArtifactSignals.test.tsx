import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import ArtifactSignals from './ArtifactSignals'

const listing = {
  type: 'SKILL' as const,
  models: ['claude-code', 'cursor'],
  reviewCount: 4,
  downloads: 120,
  version: '1.2.3',
  createdAt: '2026-05-01T00:00:00Z',
  updatedAt: '2026-05-20T00:00:00Z',
}

describe('<ArtifactSignals />', () => {
  it('renders a buyer decision checklist with review, install, model, and version signals', () => {
    render(<ArtifactSignals listing={listing} variant="panel" now={new Date('2026-06-01')} />)

    expect(screen.getByRole('heading', { name: '구매 전 체크' })).toBeTruthy()
    expect(screen.getByText('검증 리뷰')).toBeTruthy()
    expect(screen.getByText('리뷰 4개')).toBeTruthy()
    expect(screen.getByText('설치 준비')).toBeTruthy()
    expect(screen.getByText('2개 모델')).toBeTruthy()
    expect(screen.getByText('v1.2.3')).toBeTruthy()
  })

  it('omits the verified-review signal when no buyers have reviewed yet', () => {
    render(
      <ArtifactSignals
        listing={{ ...listing, reviewCount: 0, downloads: 0 }}
        variant="compact"
        now={new Date('2026-06-01')}
      />
    )

    expect(screen.queryByText('검증 리뷰')).toBeNull()
    expect(screen.getByText('설치 준비')).toBeTruthy()
  })
})
