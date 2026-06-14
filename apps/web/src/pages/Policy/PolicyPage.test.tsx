import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import PolicyPage from './PolicyPage'

const fetchMock = vi.fn()

const FULL_HASH = 'a1b2c3d4e5f6071829304152637485960718293041526374859607182930415'

const termsPayload = {
  orgName: 'PromptMarket',
  policySlug: 'terms-of-service',
  name: '이용약관',
  type: 'terms',
  locale: 'ko',
  versionLabel: 'v1',
  contentHash: FULL_HASH,
  body: '제1조 (목적)\n이 약관은 이용 조건을 정합니다.\n\n- 프롬프트 등록\n- 판매자 정산',
  effectiveAt: '2026-06-08T00:00:00.000Z',
  publishedAt: '2026-06-08T00:00:00.000Z',
  changeSummary: 'TermsDesk 중앙 게시본으로 이전',
}

const privacyPayload = {
  ...termsPayload,
  policySlug: 'privacy-policy',
  name: '개인정보처리방침',
  type: 'privacy',
}

function mockOk(payload: unknown) {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })
}

function renderPolicy(path: '/terms' | '/privacy') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <PolicyPage />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('PolicyPage', () => {
  it('shows a loading skeleton while the document is fetched', () => {
    fetchMock.mockImplementation(() => new Promise(() => {}))
    renderPolicy('/terms')

    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByText('문서를 불러오는 중…')).toBeInTheDocument()
  })

  it('renders the terms document from the TermsDesk public API', async () => {
    fetchMock.mockImplementation(() => mockOk(termsPayload))
    renderPolicy('/terms')

    // Body: statute heading promoted to h2 + paragraph + bullet list.
    expect(
      await screen.findByRole('heading', { level: 2, name: '제1조 (목적)' })
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: '이용약관' })).toBeInTheDocument()
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://termsdesk.vercel.app/api/public/promptmarket/policies/terms-of-service'
    )
    expect(screen.getByText('이 약관은 이용 조건을 정합니다.')).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
    expect(screen.getByText('프롬프트 등록')).toBeInTheDocument()
  })

  it('sets the localized document title', async () => {
    fetchMock.mockImplementation(() => mockOk(termsPayload))
    renderPolicy('/terms')

    await waitFor(() => expect(document.title).toBe('이용약관 · PromptMarket'))
  })

  it('surfaces version, truncated hash, effective date, and source link as the trust surface', async () => {
    fetchMock.mockImplementation(() => mockOk(termsPayload))
    renderPolicy('/terms')

    expect(await screen.findByText('v1')).toBeInTheDocument()
    // Hash is truncated to 12 chars in the visible text; full hash only in title attr.
    const shortHash = screen.getByText(FULL_HASH.slice(0, 12))
    expect(shortHash).toHaveAttribute('title', FULL_HASH)
    expect(screen.queryByText(FULL_HASH)).not.toBeInTheDocument()
    expect(screen.getByText(/2026/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /TermsDesk 원문/ })).toHaveAttribute(
      'href',
      'https://termsdesk.vercel.app/p/promptmarket/terms-of-service'
    )
  })

  it('fetches the privacy policy when mounted on /privacy', async () => {
    fetchMock.mockImplementation(() => mockOk(privacyPayload))
    renderPolicy('/privacy')

    expect(
      await screen.findByRole('heading', { level: 1, name: '개인정보처리방침' })
    ).toBeInTheDocument()
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://termsdesk.vercel.app/api/public/promptmarket/policies/privacy-policy'
    )
  })

  it('falls back to a TermsDesk link card on error and recovers via retry', async () => {
    fetchMock.mockImplementation(() => new Response('{}', { status: 503 }))
    renderPolicy('/terms')

    expect(await screen.findByText('문서를 불러오지 못했어요')).toBeInTheDocument()

    const fallbackLink = screen.getByRole('link', { name: /TermsDesk에서 원문 보기/ })
    expect(fallbackLink).toHaveAttribute(
      'href',
      'https://termsdesk.vercel.app/p/promptmarket/terms-of-service'
    )

    fetchMock.mockImplementation(() => mockOk(termsPayload))
    fireEvent.click(screen.getByRole('button', { name: /다시 시도/ }))

    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 2, name: '제1조 (목적)' })).toBeInTheDocument()
    )
  })

  it('cross-links the sibling policy as an internal route', async () => {
    fetchMock.mockImplementation(() => mockOk(termsPayload))
    renderPolicy('/terms')

    await screen.findByRole('heading', { level: 2, name: '제1조 (목적)' })

    expect(screen.getByRole('link', { name: /개인정보처리방침/ })).toHaveAttribute(
      'href',
      '/privacy'
    )
    expect(screen.getByRole('link', { name: /홈으로/ })).toHaveAttribute('href', '/')
  })
})
