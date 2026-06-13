import { z } from 'zod'

export const INQUIRY_CATEGORIES = ['contact', 'partnership', 'bug', 'qa', 'question'] as const

export const inquiryCategorySchema = z.enum(INQUIRY_CATEGORIES)
export type InquiryCategory = z.infer<typeof inquiryCategorySchema>

export const INQUIRY_TITLE_MIN = 2
export const INQUIRY_TITLE_MAX = 140
export const INQUIRY_BODY_MIN = 10
export const INQUIRY_BODY_MAX = 4000

/**
 * Payload contract for TermsDesk's public inquiry intake
 * (POST /api/public/promptmarket/inquiries).
 *
 * `website` is a honeypot — humans never see the field, so any non-empty
 * value marks the submission as bot traffic. It must be present AND empty.
 */
export const inquiryFormSchema = z.object({
  category: inquiryCategorySchema,
  title: z.string().trim().min(INQUIRY_TITLE_MIN).max(INQUIRY_TITLE_MAX),
  body: z.string().trim().min(INQUIRY_BODY_MIN).max(INQUIRY_BODY_MAX),
  contactEmail: z
    .union([z.literal(''), z.string().trim().email()])
    .optional()
    .transform((v) => (v ? v : undefined)),
  website: z.literal(''),
})
export type InquiryFormInput = z.input<typeof inquiryFormSchema>
export type InquiryFormValues = z.output<typeof inquiryFormSchema>

/** What we render on the receipt screen after a successful submission. */
export interface InquiryReceipt {
  /** Server-issued id when the API returns one; otherwise locally generated. */
  referenceId: string | null
  category: InquiryCategory
  title: string
  contactEmail?: string
  submittedAt: string
}

/**
 * The TermsDesk response body is not under our control, so parse defensively:
 * accept any of the likely id fields and never fail the success path on shape.
 */
export const inquiryResponseSchema = z
  .object({
    id: z.string().optional(),
    inquiryId: z.string().optional(),
    referenceId: z.string().optional(),
  })
  .loose()

export function extractReferenceId(payload: unknown): string | null {
  const parsed = inquiryResponseSchema.safeParse(payload)
  if (!parsed.success) return null
  return parsed.data.referenceId ?? parsed.data.inquiryId ?? parsed.data.id ?? null
}
