import { useMutation, useQuery } from '@tanstack/react-query'

import { listInquiries, submitInquiry } from './api'

import type { InquiryFormValues } from './schema'

export const inquiryKeys = {
  all: ['inquiries'] as const,
  list: (limit: number, offset: number) => [...inquiryKeys.all, 'list', limit, offset] as const,
}

export function useSubmitInquiry() {
  return useMutation({
    // Wrapped so TanStack's mutation context never collides with
    // submitInquiry's fetch options parameter.
    mutationFn: (values: InquiryFormValues) => submitInquiry(values),
  })
}

/**
 * Public inquiry board (newest-first). Reads through desk-platform's public
 * list endpoint — no auth. Kept fresh-ish but not real-time; a successful
 * submission invalidates this key to pull the new entry in.
 */
export function useInquiries(limit = 20, offset = 0) {
  return useQuery({
    queryKey: inquiryKeys.list(limit, offset),
    queryFn: ({ signal }) => listInquiries(limit, offset, { signal }),
    staleTime: 30_000,
  })
}
