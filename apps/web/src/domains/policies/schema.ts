import { z } from 'zod'

export const POLICY_SLUGS = ['terms-of-service', 'privacy-policy'] as const

export const policySlugSchema = z.enum(POLICY_SLUGS)
export type PolicySlug = z.infer<typeof policySlugSchema>

/**
 * TermsDesk public policy API response (GET /api/public/<org>/policies/<slug>).
 * Only the fields the page renders are required; the rest of the publication
 * metadata may be empty depending on publish state, so it stays optional.
 */
export const policyDocumentSchema = z.object({
  policySlug: z.string(),
  name: z.string(),
  type: z.string(),
  locale: z.string(),
  versionLabel: z.string(),
  contentHash: z.string(),
  body: z.string(),
  effectiveAt: z.string().nullable().optional(),
  publishedAt: z.string().nullable().optional(),
  changeSummary: z.string().nullable().optional(),
})
export type PolicyDocument = z.infer<typeof policyDocumentSchema>
