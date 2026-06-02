import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import i18n from '@/i18n'
import type {
  CreateListingInput,
  CreateReviewInput,
  CreateReviewReplyInput,
  LoginInput,
  RegisterInput,
  RevenueSettings,
  RevenueSettingsHistory,
} from '@promptmarket/shared'
import axios from 'axios'
import { api, getErrorMessage } from '@services/api'
import {
  listingKey,
  listingsKey,
  adminRevenueSettingsKey,
  adminRevenueSettingsHistoryKey,
  adminRevenueSummaryKey,
  mePurchasesKey,
  meListingsKey,
  meKey,
  relatedKey,
  reviewsKey,
  statsKey,
  userKey,
  type ListingsParams,
} from './queryKeys'
import type {
  AuthResponse,
  AdminRevenueSummary,
  ListingCard,
  ListingDetailResponse,
  ListingFull,
  ListingsListResponse,
  MyListingItem,
  Review,
  ReviewReply,
  StatsResponse,
  User,
} from '@/types'
import { useAuthStore } from '@store/auth'

// --- Queries ---------------------------------------------------------------

export function useListings(params: ListingsParams = {}) {
  return useQuery({
    queryKey: listingsKey(params),
    queryFn: () =>
      api.get<ListingsListResponse, ListingsListResponse>('/listings', {
        params: {
          type: params.type || undefined,
          category: params.category || undefined,
          sort: params.sort || undefined,
          q: params.q || undefined,
          model: params.model || undefined,
          vendor: params.vendor || undefined,
          technique: params.technique || undefined,
          difficulty: params.difficulty || undefined,
          signal: params.signal || undefined,
          free: params.free || undefined,
          page: params.page,
          pageSize: params.pageSize,
        },
      }),
  })
}

export function useListing(slug: string | undefined) {
  return useQuery({
    queryKey: slug ? listingKey(slug) : ['listing', '__none__'],
    enabled: !!slug,
    queryFn: () => api.get<ListingDetailResponse, ListingDetailResponse>(`/listings/${slug}`),
  })
}

/** Public site-wide stats — total listings, sales, users — used by the
 *  homepage hero. Tolerates partial shapes so it never blocks the hero. */
export function useStats() {
  return useQuery({
    queryKey: statsKey,
    queryFn: () => api.get<StatsResponse, StatsResponse>('/listings/stats'),
    staleTime: 5 * 60_000,
  })
}

/** "You might also like" — backend returns an array of ListingCard items. */
export function useRelated(id: string | undefined) {
  return useQuery({
    queryKey: id ? relatedKey(id) : ['related', '__none__'],
    enabled: !!id,
    queryFn: () => api.get<ListingCard[], ListingCard[]>(`/listings/related/${id}`),
  })
}

export function useAdminRevenueSettings() {
  return useQuery({
    queryKey: adminRevenueSettingsKey,
    queryFn: () => api.get<RevenueSettings, RevenueSettings>('/admin/revenue/settings'),
  })
}

export function useAdminRevenueSettingsHistory() {
  return useQuery({
    queryKey: adminRevenueSettingsHistoryKey,
    queryFn: () =>
      api.get<RevenueSettingsHistory, RevenueSettingsHistory>('/admin/revenue/settings/history'),
  })
}

export function useAdminRevenueSummary(limit = 10) {
  return useQuery({
    queryKey: adminRevenueSummaryKey(limit),
    queryFn: () =>
      api.get<AdminRevenueSummary, AdminRevenueSummary>('/admin/revenue/summary', {
        params: { limit },
      }),
  })
}

export function useMe() {
  const token = useAuthStore((s) => s.token)
  const setUser = useAuthStore((s) => s.setUser)
  const logout = useAuthStore((s) => s.logout)
  return useQuery({
    queryKey: meKey,
    enabled: !!token,
    queryFn: async () => {
      try {
        const data = (await api.get('/auth/me')) as Record<string, unknown>
        // API returns the user object flat or nested; tolerate either shape.
        const raw = (typeof data?.user === 'object' && data.user != null ? data.user : data) as User
        const u: User = raw
        setUser(u)
        return u
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 401) logout()
        throw err
      }
    },
  })
}

export function useMyListings(enabled = true) {
  return useQuery({
    queryKey: meListingsKey,
    enabled,
    queryFn: () => api.get<MyListingItem[], MyListingItem[]>('/me/listings'),
  })
}

/** `GET /me/purchases` returns the purchase wrapper, with the card nested
 *  under `.listing` — not a flat ListingCard. */
export interface MyPurchaseItem {
  id: string
  pricePaidCents: number
  createdAt: string
  listing?: ListingCard | null
}

export function useMyPurchases(enabled = true) {
  return useQuery({
    queryKey: mePurchasesKey,
    enabled,
    queryFn: () => api.get<MyPurchaseItem[], MyPurchaseItem[]>('/me/purchases'),
  })
}

export interface ProfileResponse {
  user: User
  listings: ListingCard[]
}

export function useUserProfile(username: string | undefined) {
  return useQuery({
    queryKey: username ? userKey(username) : ['user', '__none__'],
    enabled: !!username,
    queryFn: () => api.get<ProfileResponse, ProfileResponse>(`/users/${username}`),
  })
}

// --- Mutations -------------------------------------------------------------

export function useLogin() {
  const login = useAuthStore((s) => s.login)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: LoginInput) => api.post<AuthResponse, AuthResponse>('/auth/login', input),
    onSuccess: (res) => {
      login(res.token, res.user)
      qc.setQueryData(meKey, res.user)
      toast.success(i18n.t('common:toasts.welcomeBack', { name: res.user.username }))
    },
    onError: (err) => {
      toast.error(getErrorMessage(err))
    },
  })
}

export function useRegister() {
  const login = useAuthStore((s) => s.login)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: RegisterInput) =>
      api.post<AuthResponse, AuthResponse>('/auth/register', input),
    onSuccess: (res) => {
      login(res.token, res.user)
      qc.setQueryData(meKey, res.user)
      toast.success(i18n.t('common:toasts.accountCreated'))
    },
    onError: (err) => {
      toast.error(getErrorMessage(err))
    },
  })
}

export function useCreateListing(options: { showSuccessToast?: boolean } = {}) {
  const { showSuccessToast = true } = options
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateListingInput) =>
      api.post<ListingCard, ListingCard>('/listings', input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['listings'] })
      void qc.invalidateQueries({ queryKey: meListingsKey })
      void qc.invalidateQueries({ queryKey: statsKey })
      if (showSuccessToast) toast.success(i18n.t('common:toasts.listingPublished'))
    },
    onError: (err) => {
      toast.error(getErrorMessage(err))
    },
  })
}

export function usePurchase(listingId: string | undefined, slug?: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      if (!listingId) throw new Error('Listing ID is missing')
      return api.post(`/listings/${listingId}/purchase`)
    },
    onSuccess: () => {
      if (slug) void qc.invalidateQueries({ queryKey: listingKey(slug) })
      void qc.invalidateQueries({ queryKey: mePurchasesKey })
      void qc.invalidateQueries({ queryKey: meKey })
      void qc.invalidateQueries({ queryKey: ['listings'] })
      toast.success(i18n.t('common:toasts.purchaseComplete'))
    },
    onError: (err) => {
      toast.error(getErrorMessage(err))
    },
  })
}

export function useTopup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (amountCents: number) => api.post('/me/topup', { amountCents }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: meKey })
      toast.success(i18n.t('common:toasts.balanceToppedUp'))
    },
    onError: (err) => {
      toast.error(getErrorMessage(err))
    },
  })
}

export function useCreateReview(listingId: string | undefined, slug?: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateReviewInput) => {
      if (!listingId) throw new Error('Listing ID is missing')
      return api.post<{ review: Review }, { review: Review }>(
        `/listings/${listingId}/reviews`,
        input
      )
    },
    onSuccess: () => {
      if (slug) void qc.invalidateQueries({ queryKey: listingKey(slug) })
      if (listingId) void qc.invalidateQueries({ queryKey: reviewsKey(listingId) })
      toast.success(i18n.t('common:toasts.reviewPosted'))
    },
    onError: (err) => {
      toast.error(getErrorMessage(err))
    },
  })
}

export function useCreateReviewReply(listingId: string | undefined, slug?: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateReviewReplyInput & { reviewId: string }) => {
      if (!listingId) throw new Error('Listing ID is missing')
      const { reviewId, body } = input
      return api.post<ReviewReply, ReviewReply>(
        `/listings/${listingId}/reviews/${reviewId}/replies`,
        {
          body,
        }
      )
    },
    onSuccess: () => {
      if (slug) void qc.invalidateQueries({ queryKey: listingKey(slug) })
      if (listingId) void qc.invalidateQueries({ queryKey: reviewsKey(listingId) })
      toast.success(i18n.t('common:toasts.replyPosted'))
    },
    onError: (err) => {
      toast.error(getErrorMessage(err))
    },
  })
}

export function useUpdateRevenueSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: Partial<RevenueSettings>) =>
      api.patch<RevenueSettings, RevenueSettings>('/admin/revenue/settings', {
        ...input,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminRevenueSettingsKey })
      void qc.invalidateQueries({ queryKey: ['admin'] })
      toast.success(i18n.t('admin:settings.saved'))
    },
    onError: (err) => {
      toast.error(getErrorMessage(err))
    },
  })
}
