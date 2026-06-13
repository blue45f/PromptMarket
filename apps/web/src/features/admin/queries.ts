import { api, getErrorMessage } from '@services/api'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

import type {
  AdminMemberRow,
  CreateForbiddenWordInput,
  ForbiddenWordRow,
  UpdateForbiddenWordInput,
} from '@promptmarket/shared'

import i18n from '@/i18n'

// --- Row shapes (moderation endpoints) ---------------------------------------

export interface AdminThreadRow {
  id: string
  title: string
  category: string
  author: { id: string; username: string }
  commentCount: number
  attachmentCount: number
  hiddenAt: string | null
  needsReviewAt: string | null
  createdAt: string
}

export interface AdminReviewRow {
  id: string
  rating: number
  comment: string | null
  user: { id: string; username: string }
  listing: { id: string; slug: string; title: string }
  replyCount: number
  attachmentCount: number
  hiddenAt: string | null
  createdAt: string
}

export interface AdminAttachmentRow {
  id: string
  dataUrl: string
  byteSize: number
  width: number | null
  height: number | null
  uploader: { id: string; username: string }
  createdAt: string
}

export type AttachmentTarget = { threadId: string } | { reviewId: string }

// --- Keys ---------------------------------------------------------------------

export const adminModerationKeys = {
  threads: ['admin', 'moderation', 'threads'] as const,
  reviews: ['admin', 'moderation', 'reviews'] as const,
  attachments: (target: AttachmentTarget) =>
    ['admin', 'moderation', 'attachments', target] as const,
  forbiddenWords: (q: string) => ['admin', 'moderation', 'forbidden-words', q] as const,
  members: (q: string) => ['admin', 'members', q] as const,
}

// --- Queries -------------------------------------------------------------------

export function useAdminThreads() {
  return useQuery({
    queryKey: adminModerationKeys.threads,
    queryFn: () => api.get<AdminThreadRow[], AdminThreadRow[]>('/admin/threads'),
  })
}

export function useAdminReviews() {
  return useQuery({
    queryKey: adminModerationKeys.reviews,
    queryFn: () => api.get<AdminReviewRow[], AdminReviewRow[]>('/admin/reviews'),
  })
}

/** Lazy — only fired when a moderator expands an item's attachment panel. */
export function useAdminAttachments(target: AttachmentTarget, enabled: boolean) {
  return useQuery({
    queryKey: adminModerationKeys.attachments(target),
    enabled,
    queryFn: () =>
      api.get<AdminAttachmentRow[], AdminAttachmentRow[]>('/admin/attachments', {
        params: target,
      }),
  })
}

export function useAdminMembers(q: string) {
  return useQuery({
    queryKey: adminModerationKeys.members(q),
    queryFn: () =>
      api.get<AdminMemberRow[], AdminMemberRow[]>('/admin/members', {
        params: { q: q || undefined },
      }),
  })
}

export function useAdminForbiddenWords(q: string) {
  return useQuery({
    queryKey: adminModerationKeys.forbiddenWords(q),
    queryFn: () =>
      api.get<ForbiddenWordRow[], ForbiddenWordRow[]>('/admin/forbidden-words', {
        params: { q: q || undefined },
      }),
  })
}

// --- Mutations ------------------------------------------------------------------

function invalidateModeration(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({ queryKey: ['admin', 'moderation'] })
  // Public surfaces must reflect moderation outcomes immediately.
  void qc.invalidateQueries({ queryKey: ['community'] })
  void qc.invalidateQueries({ queryKey: ['listing'] })
  void qc.invalidateQueries({ queryKey: ['reviews'] })
}

export function useSetThreadVisibility() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, hidden }: { id: string; hidden: boolean }) =>
      api.patch(`/admin/threads/${id}/visibility`, { hidden }),
    onSuccess: (_data, variables) => {
      invalidateModeration(qc)
      toast.success(
        i18n.t(
          variables.hidden ? 'admin:moderation.toasts.hidden' : 'admin:moderation.toasts.shown'
        )
      )
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export function useAdminDeleteThread() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/admin/threads/${id}`),
    onSuccess: () => {
      invalidateModeration(qc)
      toast.success(i18n.t('admin:moderation.toasts.threadDeleted'))
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export function useSetReviewVisibility() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, hidden }: { id: string; hidden: boolean }) =>
      api.patch(`/admin/reviews/${id}/visibility`, { hidden }),
    onSuccess: (_data, variables) => {
      invalidateModeration(qc)
      toast.success(
        i18n.t(
          variables.hidden ? 'admin:moderation.toasts.hidden' : 'admin:moderation.toasts.shown'
        )
      )
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export function useAdminDeleteReview() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/admin/reviews/${id}`),
    onSuccess: () => {
      invalidateModeration(qc)
      toast.success(i18n.t('admin:moderation.toasts.reviewDeleted'))
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export function useAdminDeleteAttachment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/admin/attachments/${id}`),
    onSuccess: () => {
      invalidateModeration(qc)
      toast.success(i18n.t('admin:moderation.toasts.attachmentDeleted'))
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export function useCreateForbiddenWord() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateForbiddenWordInput) =>
      api.post<ForbiddenWordRow, ForbiddenWordRow>('/admin/forbidden-words', input),
    onSuccess: () => {
      invalidateModeration(qc)
      toast.success(i18n.t('admin:moderation.forbiddenWords.toasts.created'))
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export function useUpdateForbiddenWord() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateForbiddenWordInput }) =>
      api.patch<ForbiddenWordRow, ForbiddenWordRow>(`/admin/forbidden-words/${id}`, input),
    onSuccess: () => {
      invalidateModeration(qc)
      toast.success(i18n.t('admin:moderation.forbiddenWords.toasts.updated'))
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export function useDeleteForbiddenWord() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/admin/forbidden-words/${id}`),
    onSuccess: () => {
      invalidateModeration(qc)
      toast.success(i18n.t('admin:moderation.forbiddenWords.toasts.deleted'))
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export function useSetMemberSuspension() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, suspended }: { id: string; suspended: boolean }) =>
      api.patch(`/admin/members/${id}/suspension`, { suspended }),
    onSuccess: (_data, variables) => {
      void qc.invalidateQueries({ queryKey: ['admin', 'members'] })
      toast.success(
        i18n.t(
          variables.suspended ? 'admin:members.toasts.suspended' : 'admin:members.toasts.reinstated'
        )
      )
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}
