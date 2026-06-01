// Re-export shared DTOs where the shape matches what the frontend already consumes.
// Local interfaces are kept for response shapes that the API returns in a form
// the shared Zod schemas don't fully describe (e.g. composite "detail" endpoints).
export type {
  ListingCard,
  ListingFull,
  AuthResponse,
  ListingListResponse as ListingsListResponse,
  ListingType,
  PurchaseResponse,
  RevenueSettings,
  RevenueSettingsHistory,
  AdminRevenueSummary,
  TopCreatorRevenue,
  PromptTechnique,
  Difficulty,
  License,
} from '@promptmarket/shared'

import type { ListingCard, ListingFull } from '@promptmarket/shared'

export interface User {
  id: string
  email?: string
  username: string
  balanceCents?: number
  isAdmin?: boolean
  bio?: string | null
  avatarUrl?: string | null
}

export interface Author {
  id: string
  username: string
}

export interface Review {
  id: string
  rating: number
  comment?: string | null
  createdAt: string
  author?: Author
  user?: Author
}

export interface Purchase {
  id: string
  listingId: string
  createdAt: string
}

// The API returns the listing fields flat (not nested under `listing`), with
// the relational extras alongside them. Model that shape so consumers reading
// the response get the real fields instead of an always-undefined `.listing`.
export interface ListingDetailResponse extends ListingFull {
  reviews: Review[]
  isOwner: boolean
  isPurchased: boolean
  canViewBody: boolean
}

export interface MyListingItem extends ListingCard {
  salesCount: number
  earningsCents: number
}

export interface StatsResponse {
  totalListings: number
  totalDownloads: number
  totalCreators: number
}
