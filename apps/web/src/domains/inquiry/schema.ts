import { z } from 'zod'

/**
 * Inquiry categories — mirror desk-platform's `@desk/shared` INQUIRY_CATEGORIES
 * (partnership / bug / feedback / usage). See
 * desk-platform/docs/INQUIRY_INTEGRATION.md §3.
 */
export const INQUIRY_CATEGORIES = ['partnership', 'bug', 'feedback', 'usage'] as const

export const inquiryCategorySchema = z.enum(INQUIRY_CATEGORIES)
export type InquiryCategory = z.infer<typeof inquiryCategorySchema>

/** Processing status — mirrors desk-platform's INQUIRY_STATUSES. */
export const INQUIRY_STATUSES = ['new', 'in_progress', 'resolved', 'closed'] as const
export const inquiryStatusSchema = z.enum(INQUIRY_STATUSES)
export type InquiryStatus = z.infer<typeof inquiryStatusSchema>

export const INQUIRY_TITLE_MIN = 1
export const INQUIRY_TITLE_MAX = 120
export const INQUIRY_BODY_MIN = 1
export const INQUIRY_BODY_MAX = 4000
export const INQUIRY_NAME_MAX = 80

/**
 * Payload contract for desk-platform's public inquiry intake
 * (POST /api/v1/apps/PromptMarket/inquiries). Limits track the backend:
 * title 1–120, body 1–4000, optional name 1–80, optional email.
 *
 * `website` is a honeypot — humans never see the field, so any non-empty
 * value marks the submission as bot traffic. It must be present AND empty.
 */
export const inquiryFormSchema = z.object({
  category: inquiryCategorySchema,
  title: z.string().trim().min(INQUIRY_TITLE_MIN).max(INQUIRY_TITLE_MAX),
  body: z.string().trim().min(INQUIRY_BODY_MIN).max(INQUIRY_BODY_MAX),
  authorName: z
    .union([z.literal(''), z.string().trim().max(INQUIRY_NAME_MAX)])
    .optional()
    .transform((v) => (v ? v : undefined)),
  contactEmail: z
    .union([z.literal(''), z.string().trim().email()])
    .optional()
    .transform((v) => (v ? v : undefined)),
  website: z.literal(''),
})
export type InquiryFormInput = z.input<typeof inquiryFormSchema>
export type InquiryFormValues = z.output<typeof inquiryFormSchema>

/**
 * A public board entry returned by desk-platform's list endpoint (guide §4).
 * `contactEmail` / `originUrl` are masked out of the public list, so they are
 * deliberately absent here.
 */
export const inquirySchema = z.object({
  id: z.string(),
  appId: z.string(),
  category: inquiryCategorySchema.catch('usage'),
  status: inquiryStatusSchema.catch('new'),
  title: z.string(),
  body: z.string(),
  authorName: z.string().nullable().catch(null),
  createdAt: z.string(),
  updatedAt: z.string(),
})
export type Inquiry = z.infer<typeof inquirySchema>

/** Envelope for the public board list (guide §4 InquiryListDto). */
export const inquiryListSchema = z.object({
  appId: z.string().optional(),
  items: z.array(inquirySchema).catch([]),
  limit: z.number().optional(),
  offset: z.number().optional(),
})
export type InquiryList = z.infer<typeof inquiryListSchema>

/** What we render on the receipt screen after a successful submission. */
export interface InquiryReceipt {
  /** Server-issued id from the created InquiryDto. */
  referenceId: string | null
  category: InquiryCategory
  title: string
  contactEmail?: string
  submittedAt: string
}
