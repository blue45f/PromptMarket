import { useQuery } from '@tanstack/react-query'

import { fetchPolicy } from './api'

import type { PolicySlug } from './schema'

export const policiesKeys = {
  all: ['policies'] as const,
  detail: (slug: PolicySlug) => [...policiesKeys.all, 'detail', slug] as const,
}

/** Policy documents change rarely; revisits within a session can stay cached. */
const POLICY_STALE_TIME_MS = 30 * 60 * 1000

export function usePolicy(slug: PolicySlug) {
  return useQuery({
    queryKey: policiesKeys.detail(slug),
    queryFn: ({ signal }) => fetchPolicy(slug, { signal }),
    staleTime: POLICY_STALE_TIME_MS,
  })
}
