import { policyDocumentSchema, type PolicyDocument, type PolicySlug } from './schema'

/**
 * Terms / privacy documents are published centrally on TermsDesk and served
 * through an unauthenticated public API. This is an external absolute URL, so
 * we use plain fetch instead of `@infrastructure/api` — the axios client is bound
 * to our own `/api` base and attaches the user's bearer token, which must
 * never be sent to a third-party host.
 */
export const TERMSDESK_BASE_URL = 'https://termsdesk.vercel.app'
export const POLICY_ORG_SLUG = 'promptmarket'

/** Central support board — intentionally stays external (no in-app inbox). */
export const TERMSDESK_SUPPORT_URL = `${TERMSDESK_BASE_URL}/support/${POLICY_ORG_SLUG}?category=site-inquiry`

export function policyApiUrl(slug: PolicySlug): string {
  return `${TERMSDESK_BASE_URL}/api/public/${POLICY_ORG_SLUG}/policies/${slug}`
}

/** Rendered public page on TermsDesk — the fallback target when the API fails. */
export function policyPublicUrl(slug: PolicySlug): string {
  return `${TERMSDESK_BASE_URL}/p/${POLICY_ORG_SLUG}/${slug}`
}

interface FetchPolicyOptions {
  signal?: AbortSignal
}

export async function fetchPolicy(
  slug: PolicySlug,
  { signal }: FetchPolicyOptions = {}
): Promise<PolicyDocument> {
  const response = await fetch(policyApiUrl(slug), {
    signal,
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  const parsed = policyDocumentSchema.safeParse(await response.json())
  if (!parsed.success) {
    console.error(`[policies] ${slug} payload failed validation:`, parsed.error)
    throw new Error('TermsDesk policy payload failed validation')
  }

  return parsed.data
}
