import { api, getErrorMessage } from '@infrastructure/api'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

import type { MessageDto, MessageThreadSummaryDto } from '@promptmarket/shared'

import i18n from '@/i18n'

// Non-realtime by design: the inbox and the open thread poll on intervals
// that match how often a buyer actually checks a storefront Q&A.
export const THREAD_POLL_MS = 5_000
export const INBOX_POLL_MS = 30_000
export const UNREAD_POLL_MS = 60_000

export const messageKeys = {
  all: ['messages'] as const,
  threads: ['messages', 'threads'] as const,
  thread: (id: string) => ['messages', 'thread', id] as const,
  unread: ['messages', 'unread'] as const,
}

export interface MessageThreadDetail {
  id: string
  listing: { id: string; slug: string; title: string; coverEmoji: string; priceCents: number }
  counterpart: { id: string; username: string }
  role: 'buyer' | 'seller'
  createdAt: string
  messages: MessageDto[]
}

export function useMessageThreads(enabled = true) {
  return useQuery({
    queryKey: messageKeys.threads,
    enabled,
    refetchInterval: INBOX_POLL_MS,
    queryFn: () =>
      api.get<MessageThreadSummaryDto[], MessageThreadSummaryDto[]>('/messages/threads'),
  })
}

export function useMessageThread(id: string | undefined) {
  return useQuery({
    queryKey: id ? messageKeys.thread(id) : ['messages', 'thread', '__none__'],
    enabled: !!id,
    refetchInterval: THREAD_POLL_MS,
    queryFn: () => api.get<MessageThreadDetail, MessageThreadDetail>(`/messages/threads/${id}`),
  })
}

/** Nav badge — total unread incoming messages. Only polls while signed in. */
export function useUnreadMessages(enabled: boolean) {
  return useQuery({
    queryKey: messageKeys.unread,
    enabled,
    refetchInterval: UNREAD_POLL_MS,
    queryFn: () => api.get<{ count: number }, { count: number }>('/messages/unread-count'),
  })
}

export function useStartMessageThread() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { listingId: string; body: string }) =>
      api.post<{ id: string }, { id: string }>('/messages/threads', input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: messageKeys.all })
      toast.success(i18n.t('common:toasts.messageSent'))
    },
    onError: (err) => {
      toast.error(getErrorMessage(err))
    },
  })
}

export function useSendMessage(threadId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: string) => {
      if (!threadId) throw new Error('Thread ID is missing')
      return api.post<MessageDto, MessageDto>(`/messages/threads/${threadId}`, { body })
    },
    onSuccess: () => {
      if (threadId) void qc.invalidateQueries({ queryKey: messageKeys.thread(threadId) })
      void qc.invalidateQueries({ queryKey: messageKeys.threads })
    },
    onError: (err) => {
      toast.error(getErrorMessage(err))
    },
  })
}
