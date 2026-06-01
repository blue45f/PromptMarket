// Centralised React Query keys. Keep these as readonly tuples so consumers can
// pass either the prefix (for broad invalidation) or the fully-formed key.

export type ListingsParams = {
  type?: string
  category?: string
  sort?: string
  q?: string
  model?: string
  vendor?: string
  technique?: string
  difficulty?: string
  signal?: string
  free?: 'true' | 'false'
  page?: number
  pageSize?: number
}

export const queryKeys = {
  listings: (params?: ListingsParams) => ['listings', params ?? {}] as const,
  listing: (slug: string) => ['listing', slug] as const,
  related: (id: string) => ['related', id] as const,
  stats: ['stats'] as const,
  adminRevenueSettings: ['admin', 'revenue', 'settings'] as const,
  adminRevenueSettingsHistory: ['admin', 'revenue', 'settings', 'history'] as const,
  adminRevenueSummary: (limit = 10) => ['admin', 'revenue', 'summary', { limit }] as const,
  me: ['me'] as const,
  mePurchases: ['me', 'purchases'] as const,
  meListings: ['me', 'listings'] as const,
  user: (username: string) => ['user', username] as const,
  reviews: (listingId: string) => ['reviews', listingId] as const,
}

// Convenience aliases for sites that prefer the function-style API.
export const listingsKey = queryKeys.listings
export const listingKey = queryKeys.listing
export const relatedKey = queryKeys.related
export const statsKey = queryKeys.stats
export const adminRevenueSettingsKey = queryKeys.adminRevenueSettings
export const adminRevenueSettingsHistoryKey = queryKeys.adminRevenueSettingsHistory
export const adminRevenueSummaryKey = queryKeys.adminRevenueSummary
export const meKey = queryKeys.me
export const mePurchasesKey = queryKeys.mePurchases
export const meListingsKey = queryKeys.meListings
export const userKey = queryKeys.user
export const reviewsKey = queryKeys.reviews
