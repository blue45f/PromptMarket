import { api, getErrorMessage } from '@services/api'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

import type {
  AttachmentDto,
  CreateDiscussionCommentInput,
  CreateDiscussionThreadInput,
  DiscussionThreadListResponse,
} from '@promptmarket/shared'

import i18n from '@/i18n'

// --- Query keys --------------------------------------------------------------

export interface ThreadListParams {
  category?: string
  page?: number
}

export const communityKeys = {
  all: ['community'] as const,
  threads: (params: ThreadListParams = {}) => ['community', 'threads', params] as const,
  thread: (id: string) => ['community', 'thread', id] as const,
}

// --- Response shapes ---------------------------------------------------------

export interface DiscussionCommentView {
  id: string
  body: string | null
  deleted: boolean
  author: { id: string; username: string } | null
  parentId: string | null
  createdAt: string
  attachments: AttachmentDto[]
  isOwn: boolean
}

export interface DiscussionThreadDetail {
  id: string
  title: string
  body: string
  category: string
  author: { id: string; username: string } | null
  hidden: boolean
  isOwner: boolean
  createdAt: string
  updatedAt: string
  attachments: AttachmentDto[]
  comments: DiscussionCommentView[]
}

// --- Queries -----------------------------------------------------------------

export function useThreads(params: ThreadListParams = {}) {
  return useQuery({
    queryKey: communityKeys.threads(params),
    queryFn: () =>
      api.get<DiscussionThreadListResponse, DiscussionThreadListResponse>('/community/threads', {
        params: {
          category: params.category || undefined,
          page: params.page,
        },
      }),
  })
}

export function useThread(id: string | undefined) {
  return useQuery({
    queryKey: id ? communityKeys.thread(id) : ['community', 'thread', '__none__'],
    enabled: !!id,
    queryFn: () =>
      api.get<DiscussionThreadDetail, DiscussionThreadDetail>(`/community/threads/${id}`),
  })
}

// --- Mutations ---------------------------------------------------------------

export function useCreateThread() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateDiscussionThreadInput) =>
      api.post<{ id: string }, { id: string }>('/community/threads', input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: communityKeys.all })
      toast.success(i18n.t('common:toasts.threadCreated'))
    },
    onError: (err) => {
      toast.error(getErrorMessage(err))
    },
  })
}

export function useCreateComment(threadId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateDiscussionCommentInput) => {
      if (!threadId) throw new Error('Thread ID is missing')
      return api.post<DiscussionCommentView, DiscussionCommentView>(
        `/community/threads/${threadId}/comments`,
        input
      )
    },
    onSuccess: () => {
      if (threadId) void qc.invalidateQueries({ queryKey: communityKeys.thread(threadId) })
      void qc.invalidateQueries({ queryKey: communityKeys.threads() })
      toast.success(i18n.t('common:toasts.commentPosted'))
    },
    onError: (err) => {
      toast.error(getErrorMessage(err))
    },
  })
}

export function useDeleteComment(threadId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (commentId: string) => api.delete(`/community/comments/${commentId}`),
    onSuccess: () => {
      if (threadId) void qc.invalidateQueries({ queryKey: communityKeys.thread(threadId) })
      toast.success(i18n.t('common:toasts.commentDeleted'))
    },
    onError: (err) => {
      toast.error(getErrorMessage(err))
    },
  })
}

export function useDeleteThread() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (threadId: string) => api.delete(`/community/threads/${threadId}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: communityKeys.all })
      toast.success(i18n.t('common:toasts.threadDeleted'))
    },
    onError: (err) => {
      toast.error(getErrorMessage(err))
    },
  })
}
