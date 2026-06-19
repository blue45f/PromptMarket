import { afterEach, describe, expect, it, vi } from 'vitest'

import { APP_ID, INQUIRY_ENDPOINT, listInquiries, submitInquiry } from './api'
import { inquiryFormSchema } from './schema'

describe('inquiryFormSchema', () => {
  const valid = {
    category: 'bug' as const,
    title: '결제 버튼이 동작하지 않아요',
    body: '구매 버튼을 누르면 아무 일도 일어나지 않습니다. 콘솔에 오류가 보여요.',
    authorName: '',
    contactEmail: '',
    website: '',
  }

  it('accepts a valid submission and drops the empty optional fields', () => {
    const parsed = inquiryFormSchema.parse(valid)
    expect(parsed.contactEmail).toBeUndefined()
    expect(parsed.authorName).toBeUndefined()
    expect(parsed.website).toBe('')
  })

  it('keeps a provided contact email and name', () => {
    const parsed = inquiryFormSchema.parse({
      ...valid,
      contactEmail: 'me@example.com',
      authorName: '홍길동',
    })
    expect(parsed.contactEmail).toBe('me@example.com')
    expect(parsed.authorName).toBe('홍길동')
  })

  it.each([
    ['title too long', { title: 'x'.repeat(121) }],
    ['body too long', { body: 'x'.repeat(4001) }],
    ['name too long', { authorName: 'x'.repeat(81) }],
    ['bad email', { contactEmail: 'not-an-email' }],
    ['unknown category', { category: 'spam' }],
  ])('rejects %s', (_label, patch) => {
    expect(inquiryFormSchema.safeParse({ ...valid, ...patch }).success).toBe(false)
  })

  it('rejects a filled honeypot (bot traffic never reaches the API)', () => {
    expect(inquiryFormSchema.safeParse({ ...valid, website: 'https://spam.example' }).success).toBe(
      false
    )
  })
})

describe('submitInquiry', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('POSTs to the desk-platform endpoint with originUrl and the empty honeypot', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: 'inq_42' }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      })
    )
    vi.stubGlobal('fetch', fetchMock)

    const receipt = await submitInquiry({
      category: 'usage',
      title: '판매 정산 주기 문의',
      body: '정산은 며칠 주기로 이루어지는지 알고 싶습니다. 문서에서 찾지 못했어요.',
      authorName: undefined,
      contactEmail: undefined,
      website: '',
    })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe(INQUIRY_ENDPOINT)
    expect(url).toContain(`/api/v1/apps/${APP_ID}/inquiries`)
    const sent = JSON.parse((init as RequestInit).body as string)
    expect(sent).toMatchObject({ category: 'usage', website: '' })
    expect(sent.contactEmail).toBeUndefined()
    expect(sent.authorName).toBeUndefined()
    expect(typeof sent.originUrl).toBe('string')
    expect(receipt.referenceId).toBe('inq_42')
    expect(receipt.title).toBe('판매 정산 주기 문의')
  })

  it('includes authorName and contactEmail when provided', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ id: 'x' }), { status: 201 }))
    vi.stubGlobal('fetch', fetchMock)

    await submitInquiry({
      category: 'partnership',
      title: '제휴 제안',
      body: '프롬프트 번들 제휴를 제안하고 싶습니다. 연락 부탁드립니다.',
      authorName: '담당자',
      contactEmail: 'partner@example.com',
      website: '',
    })

    const sent = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string)
    expect(sent.authorName).toBe('담당자')
    expect(sent.contactEmail).toBe('partner@example.com')
  })

  it('surfaces the joined message[] from a 400 validation error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ message: ['title too long', 'body required'] }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        })
      )
    )
    await expect(
      submitInquiry({
        category: 'feedback',
        title: '의견',
        body: '내용입니다.',
        authorName: undefined,
        contactEmail: undefined,
        website: '',
      })
    ).rejects.toThrow('title too long, body required')
  })

  it('still succeeds when the success body is not JSON', async () => {
    // 204 is a null-body status — the Response constructor rejects '' here.
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 204 })))
    const receipt = await submitInquiry({
      category: 'partnership',
      title: '제휴 제안',
      body: '프롬프트 번들 제휴를 제안하고 싶습니다. 연락 부탁드립니다.',
      authorName: undefined,
      contactEmail: 'partner@example.com',
      website: '',
    })
    expect(receipt.referenceId).toBeNull()
    expect(receipt.contactEmail).toBe('partner@example.com')
  })
})

describe('listInquiries', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('GETs the board with clamped limit/offset and parses the envelope', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          appId: APP_ID,
          items: [
            {
              id: 'i1',
              appId: APP_ID,
              category: 'feedback',
              status: 'new',
              title: '좋아요',
              body: '정말 유용합니다.',
              authorName: null,
              createdAt: '2026-06-19T00:00:00.000Z',
              updatedAt: '2026-06-19T00:00:00.000Z',
            },
          ],
          limit: 20,
          offset: 0,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    )
    vi.stubGlobal('fetch', fetchMock)

    const list = await listInquiries(999, -5)
    const [url] = fetchMock.mock.calls[0]
    expect(url).toBe(`${INQUIRY_ENDPOINT}?limit=50&offset=0`)
    expect(list.items).toHaveLength(1)
    expect(list.items[0].title).toBe('좋아요')
  })

  it('throws a readable error on a non-2xx response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('nope', { status: 500 })))
    await expect(listInquiries()).rejects.toThrow('문의 목록을 불러오지 못했습니다.')
  })
})
