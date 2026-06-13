import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import { fetchPolicy, policyApiUrl, policyPublicUrl, TERMSDESK_SUPPORT_URL } from './api'

const fetchMock = vi.fn()

const validPayload = {
  // The live API ships extra metadata (orgName, versionId, …) — the schema
  // must tolerate unknown keys, so the fixture includes one.
  orgName: 'PromptMarket',
  policySlug: 'terms-of-service',
  name: '이용약관',
  type: 'terms',
  locale: 'ko',
  versionLabel: 'v1',
  contentHash: '2819c00112db7ba95129d3323c89105375e8bf181f5edd198e55ad3666db4cdd',
  body: '제1조 (목적)\n이 약관은 이용 조건을 정합니다.',
  effectiveAt: '2026-06-08T00:00:00.000Z',
  publishedAt: '2026-06-08T00:00:00.000Z',
  changeSummary: 'TermsDesk 중앙 게시본으로 이전',
}

function mockOk(payload: unknown) {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })
}

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('policy URLs', () => {
  it('builds the public API URL for the promptmarket org', () => {
    expect(policyApiUrl('terms-of-service')).toBe(
      'https://termsdesk.vercel.app/api/public/promptmarket/policies/terms-of-service'
    )
    expect(policyApiUrl('privacy-policy')).toBe(
      'https://termsdesk.vercel.app/api/public/promptmarket/policies/privacy-policy'
    )
  })

  it('builds the rendered source-page URL used as fallback', () => {
    expect(policyPublicUrl('terms-of-service')).toBe(
      'https://termsdesk.vercel.app/p/promptmarket/terms-of-service'
    )
    expect(policyPublicUrl('privacy-policy')).toBe(
      'https://termsdesk.vercel.app/p/promptmarket/privacy-policy'
    )
  })

  it('keeps the support board on the external host with the site-inquiry category', () => {
    expect(TERMSDESK_SUPPORT_URL).toBe(
      'https://termsdesk.vercel.app/support/promptmarket?category=site-inquiry'
    )
  })
})

describe('fetchPolicy', () => {
  it('fetches, validates, and returns the policy document', async () => {
    fetchMock.mockResolvedValue(mockOk(validPayload))

    const doc = await fetchPolicy('terms-of-service')

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe(
      'https://termsdesk.vercel.app/api/public/promptmarket/policies/terms-of-service'
    )
    expect((init.headers as Record<string, string>).Accept).toBe('application/json')
    expect(doc.name).toBe('이용약관')
    expect(doc.versionLabel).toBe('v1')
    expect(doc.contentHash).toHaveLength(64)
  })

  it('forwards the abort signal to fetch', async () => {
    fetchMock.mockResolvedValue(mockOk(validPayload))
    const controller = new AbortController()

    await fetchPolicy('privacy-policy', { signal: controller.signal })

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(init.signal).toBe(controller.signal)
  })

  it('throws on a non-2xx response', async () => {
    fetchMock.mockResolvedValue(new Response('{}', { status: 503 }))

    await expect(fetchPolicy('terms-of-service')).rejects.toThrow('503')
  })

  it('throws when the payload fails schema validation', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    fetchMock.mockResolvedValue(mockOk({ policySlug: 'terms-of-service' }))

    await expect(fetchPolicy('terms-of-service')).rejects.toThrow(
      'TermsDesk policy payload failed validation'
    )
    expect(consoleError).toHaveBeenCalled()
    consoleError.mockRestore()
  })
})
