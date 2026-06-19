import {
  inquiryListSchema,
  inquirySchema,
  type InquiryFormValues,
  type InquiryList,
  type InquiryReceipt,
} from './schema'

/**
 * Inquiry intake + public board, served by desk-platform's public REST API
 * (no auth, CORS open). We call it with plain fetch on purpose so the
 * marketplace bearer token never leaves our own origin (the axios client
 * would attach it). Contract: desk-platform/docs/INQUIRY_INTEGRATION.md.
 *
 * Backend is LIVE — apps call the default base (desk-platform.vercel.app) with
 * no extra config; `VITE_DESK_PLATFORM_URL` only overrides it for local dev.
 */
export const DESK_PLATFORM_BASE_URL =
  import.meta.env.VITE_DESK_PLATFORM_URL ?? 'https://desk-platform.vercel.app'

/** This app's slug — desk-platform keys each app's board on it. */
export const APP_ID = 'PromptMarket'

export const INQUIRY_ENDPOINT = `${DESK_PLATFORM_BASE_URL}/api/v1/apps/${APP_ID}/inquiries`

/**
 * Pull a human-readable message out of an error response body. desk-platform
 * returns `{ message: string[] }` on validation failure (guide §4); fall back
 * to a single string or the provided default for any other shape.
 */
async function readErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const data = (await response.json()) as { message?: string | string[] }
    if (Array.isArray(data.message) && data.message.length > 0) return data.message.join(', ')
    if (typeof data.message === 'string' && data.message.trim()) return data.message
  } catch {
    // Empty / non-JSON body — fall through to the fallback message.
  }
  return fallback
}

interface SubmitInquiryOptions {
  signal?: AbortSignal
}

/**
 * Register an inquiry (`POST …/inquiries`, 10/min/IP).
 * - The honeypot `website` is always sent empty so naive bots out themselves.
 * - `originUrl` is attached automatically (masked from the public board).
 * - Validation failures (400) surface the joined `message[]` as the Error.
 */
export async function submitInquiry(
  values: InquiryFormValues,
  { signal }: SubmitInquiryOptions = {}
): Promise<InquiryReceipt> {
  const originUrl = typeof window !== 'undefined' ? globalThis.location.href : undefined

  const response = await fetch(INQUIRY_ENDPOINT, {
    method: 'POST',
    signal,
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      category: values.category,
      title: values.title,
      body: values.body,
      ...(values.authorName ? { authorName: values.authorName } : {}),
      ...(values.contactEmail ? { contactEmail: values.contactEmail } : {}),
      ...(originUrl ? { originUrl } : {}),
      website: values.website, // honeypot — always the empty string for humans
    }),
  })

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, '문의 등록에 실패했습니다.'))
  }

  // A 2xx means the inquiry landed; the body is the created InquiryDto. Parse
  // best-effort so the success path never fails on an unexpected shape.
  let referenceId: string | null = null
  try {
    const parsed = inquirySchema.partial().safeParse(await response.json())
    if (parsed.success && typeof parsed.data.id === 'string') referenceId = parsed.data.id
  } catch {
    /* empty / non-JSON body — receipt falls back to local data */
  }

  return {
    referenceId,
    category: values.category,
    title: values.title,
    contactEmail: values.contactEmail,
    submittedAt: new Date().toISOString(),
  }
}

interface ListInquiriesOptions {
  signal?: AbortSignal
}

/**
 * Load the public board, newest-first (`GET …/inquiries?limit&offset`,
 * 60/min/IP). `limit` is clamped to 1–50 (default 20) to match the backend.
 */
export async function listInquiries(
  limit = 20,
  offset = 0,
  { signal }: ListInquiriesOptions = {}
): Promise<InquiryList> {
  const safeLimit = Math.min(Math.max(Math.trunc(limit), 1), 50)
  const safeOffset = Math.max(Math.trunc(offset), 0)

  const response = await fetch(`${INQUIRY_ENDPOINT}?limit=${safeLimit}&offset=${safeOffset}`, {
    signal,
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, '문의 목록을 불러오지 못했습니다.'))
  }

  const parsed = inquiryListSchema.safeParse(await response.json())
  if (!parsed.success) {
    throw new Error('문의 목록을 불러오지 못했습니다.')
  }
  return parsed.data
}
