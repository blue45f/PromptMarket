// Centralised React Query keys. Keep these as readonly tuples so consumers can
// pass either the prefix (for broad invalidation) or the fully-formed key.

export type ListingsParams = {
  type?: string;
  category?: string;
  sort?: string;
  q?: string;
  page?: number;
  pageSize?: number;
};

export const queryKeys = {
  listings: (params?: ListingsParams) =>
    ['listings', params ?? {}] as const,
  listing: (slug: string) => ['listing', slug] as const,
  me: ['me'] as const,
  mePurchases: ['me', 'purchases'] as const,
  meListings: ['me', 'listings'] as const,
  user: (username: string) => ['user', username] as const,
  reviews: (listingId: string) => ['reviews', listingId] as const,
};

// Convenience aliases for sites that prefer the function-style API.
export const listingsKey = queryKeys.listings;
export const listingKey = queryKeys.listing;
export const meKey = queryKeys.me;
export const mePurchasesKey = queryKeys.mePurchases;
export const meListingsKey = queryKeys.meListings;
export const userKey = queryKeys.user;
export const reviewsKey = queryKeys.reviews;
