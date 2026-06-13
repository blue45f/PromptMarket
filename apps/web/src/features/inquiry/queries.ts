import { useMutation } from '@tanstack/react-query'

import { submitInquiry } from './api'

import type { InquiryFormValues } from './schema'

export function useSubmitInquiry() {
  return useMutation({
    // Wrapped so TanStack's mutation context never collides with
    // submitInquiry's fetch options parameter.
    mutationFn: (values: InquiryFormValues) => submitInquiry(values),
  })
}
