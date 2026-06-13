import { TERMSDESK_BASE_URL, POLICY_ORG_SLUG } from '@features/policies/api'

import { extractReferenceId, type InquiryFormValues, type InquiryReceipt } from './schema'

/**
 * In-app inquiry intake. Like the policy documents, inquiries live on
 * TermsDesk's public API — plain fetch on purpose so the marketplace bearer
 * token never leaves our own origin (the axios client would attach it).
 */
export const INQUIRY_ENDPOINT = `${TERMSDESK_BASE_URL}/api/public/${POLICY_ORG_SLUG}/inquiries`

interface SubmitInquiryOptions {
  signal?: AbortSignal
}

export async function submitInquiry(
  values: InquiryFormValues,
  { signal }: SubmitInquiryOptions = {}
): Promise<InquiryReceipt> {
  const originUrl = typeof window !== 'undefined' ? window.location.href : ''

  const response = await fetch(INQUIRY_ENDPOINT, {
    method: 'POST',
    signal,
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      category: values.category,
      title: values.title,
      body: values.body,
      ...(values.contactEmail ? { contactEmail: values.contactEmail } : {}),
      originUrl,
      website: values.website, // honeypot — always the empty string for humans
    }),
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  // A 2xx means the inquiry landed; the body shape is best-effort metadata.
  let referenceId: string | null = null
  try {
    referenceId = extractReferenceId(await response.json())
  } catch {
    /* empty/non-JSON body — receipt falls back to local data */
  }

  return {
    referenceId,
    category: values.category,
    title: values.title,
    contactEmail: values.contactEmail,
    submittedAt: new Date().toISOString(),
  }
}
