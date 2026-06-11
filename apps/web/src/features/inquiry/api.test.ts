import { afterEach, describe, expect, it, vi } from 'vitest'
import { INQUIRY_ENDPOINT, submitInquiry } from './api'
import { extractReferenceId, inquiryFormSchema } from './schema'

describe('inquiryFormSchema', () => {
  const valid = {
    category: 'bug' as const,
    title: '결제 버튼이 동작하지 않아요',
    body: '구매 버튼을 누르면 아무 일도 일어나지 않습니다. 콘솔에 오류가 보여요.',
    contactEmail: '',
    website: '',
  }

  it('accepts a valid submission and drops the empty contact email', () => {
    const parsed = inquiryFormSchema.parse(valid)
    expect(parsed.contactEmail).toBeUndefined()
    expect(parsed.website).toBe('')
  })

  it('keeps a provided contact email', () => {
    const parsed = inquiryFormSchema.parse({ ...valid, contactEmail: 'me@example.com' })
    expect(parsed.contactEmail).toBe('me@example.com')
  })

  it.each([
    ['title too short', { title: 'a' }],
    ['title too long', { title: 'x'.repeat(141) }],
    ['body too short', { body: '짧음' }],
    ['body too long', { body: 'x'.repeat(4001) }],
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

describe('extractReferenceId', () => {
  it.each([
    [{ id: 'abc' }, 'abc'],
    [{ inquiryId: 'inq_1' }, 'inq_1'],
    [{ referenceId: 'ref-9', id: 'ignored' }, 'ref-9'],
    [{ unrelated: true }, null],
    ['not an object', null],
  ])('parses %j → %j', (payload, expected) => {
    expect(extractReferenceId(payload)).toBe(expected)
  })
})

describe('submitInquiry', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('POSTs to TermsDesk with originUrl and the empty honeypot', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: 'inq_42' }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      })
    )
    vi.stubGlobal('fetch', fetchMock)

    const receipt = await submitInquiry({
      category: 'qa',
      title: '판매 정산 주기 문의',
      body: '정산은 며칠 주기로 이루어지는지 알고 싶습니다. 문서에서 찾지 못했어요.',
      contactEmail: undefined,
      website: '',
    })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe(INQUIRY_ENDPOINT)
    const sent = JSON.parse((init as RequestInit).body as string)
    expect(sent).toMatchObject({ category: 'qa', website: '' })
    expect(sent.contactEmail).toBeUndefined()
    expect(typeof sent.originUrl).toBe('string')
    expect(receipt.referenceId).toBe('inq_42')
    expect(receipt.title).toBe('판매 정산 주기 문의')
  })

  it('throws on a non-2xx response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('nope', { status: 500 })))
    await expect(
      submitInquiry({
        category: 'contact',
        title: '제목입니다',
        body: '본문은 충분히 길게 작성했습니다. 열 자 이상.',
        contactEmail: undefined,
        website: '',
      })
    ).rejects.toThrow('500')
  })

  it('still succeeds when the success body is not JSON', async () => {
    // 204 is a null-body status — the Response constructor rejects '' here.
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 204 })))
    const receipt = await submitInquiry({
      category: 'partnership',
      title: '제휴 제안',
      body: '프롬프트 번들 제휴를 제안하고 싶습니다. 연락 부탁드립니다.',
      contactEmail: 'partner@example.com',
      website: '',
    })
    expect(receipt.referenceId).toBeNull()
    expect(receipt.contactEmail).toBe('partner@example.com')
  })
})
