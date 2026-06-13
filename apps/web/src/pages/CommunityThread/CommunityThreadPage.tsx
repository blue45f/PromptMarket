import AttachmentGallery from '@components/AttachmentGallery'
import AttachmentInput from '@components/AttachmentInput'
import {
  useCreateComment,
  useDeleteComment,
  useDeleteThread,
  useThread,
  type DiscussionCommentView,
} from '@features/community'
import { usePageMeta } from '@hooks/usePageMeta'
import { getErrorMessage } from '@services/api'
import { useAuthStore } from '@store/auth'
import { cn } from '@utils/cn'
import { formatDate, formatRelative } from '@utils/format'
import { ArrowLeft, CornerDownRight, EyeOff, Loader2, MessageCircle, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'

import type { AttachmentInput as AttachmentDraft } from '@promptmarket/shared'

export default function CommunityThreadPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation('community')
  const { token, user } = useAuthStore()

  const { data: thread, isPending, error } = useThread(id)
  const commentMut = useCreateComment(id)
  const deleteCommentMut = useDeleteComment(id)
  const deleteThreadMut = useDeleteThread()

  const [draft, setDraft] = useState('')
  const [draftAttachments, setDraftAttachments] = useState<AttachmentDraft[]>([])
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [replyDraft, setReplyDraft] = useState('')
  const [confirmingThreadDelete, setConfirmingThreadDelete] = useState(false)
  const [confirmingCommentId, setConfirmingCommentId] = useState<string | null>(null)

  usePageMeta({
    title: thread ? t('meta.threadTitle', { title: thread.title }) : t('meta.title'),
    description: thread?.body.slice(0, 160),
  })

  const { topLevel, repliesByParent } = useMemo(() => {
    const comments = thread?.comments ?? []
    const top: DiscussionCommentView[] = []
    const byParent = new Map<string, DiscussionCommentView[]>()
    for (const comment of comments) {
      if (comment.parentId) {
        const bucket = byParent.get(comment.parentId) ?? []
        bucket.push(comment)
        byParent.set(comment.parentId, bucket)
      } else {
        top.push(comment)
      }
    }
    return { topLevel: top, repliesByParent: byParent }
  }, [thread?.comments])

  async function submitComment(parentId: string | null) {
    const body = (parentId ? replyDraft : draft).trim()
    if (!body) return
    try {
      await commentMut.mutateAsync({
        body,
        parentId: parentId ?? undefined,
        attachments: parentId ? [] : draftAttachments,
      })
      if (parentId) {
        setReplyTo(null)
        setReplyDraft('')
      } else {
        setDraft('')
        setDraftAttachments([])
      }
    } catch {
      /* toast handled in hook */
    }
  }

  async function handleDeleteThread() {
    if (!thread) return
    try {
      await deleteThreadMut.mutateAsync(thread.id)
      navigate('/community')
    } catch {
      setConfirmingThreadDelete(false)
    }
  }

  async function handleDeleteComment(commentId: string) {
    try {
      await deleteCommentMut.mutateAsync(commentId)
    } finally {
      setConfirmingCommentId(null)
    }
  }

  if (isPending) {
    return (
      <div
        className="mx-auto max-w-4xl px-[clamp(1.25rem,4vw,3rem)] py-12 space-y-4"
        aria-busy="true"
      >
        <div className="h-8 w-2/3 rounded-lg bg-canvas-sub dark:bg-night-sub motion-safe:animate-pulse" />
        <div className="h-40 rounded-2xl bg-canvas-sub dark:bg-night-sub motion-safe:animate-pulse" />
        <div className="h-24 rounded-2xl bg-canvas-sub dark:bg-night-sub motion-safe:animate-pulse" />
      </div>
    )
  }

  if (error || !thread) {
    return (
      <div className="mx-auto max-w-4xl px-[clamp(1.25rem,4vw,3rem)] py-16 text-center">
        <p className="text-coral-deep dark:text-coral">
          {error ? getErrorMessage(error) : t('detail.notFound')}
        </p>
        <Link
          to="/community"
          className="mt-4 inline-block text-volt-700 underline dark:text-volt-300 focus-volt"
        >
          {t('detail.backToBoard')}
        </Link>
      </div>
    )
  }

  const categoryLabel = t(`home:categories.labels.${thread.category}`, {
    defaultValue: thread.category,
  })
  const canModerate = thread.isOwner || !!user?.isAdmin

  return (
    <div className="mx-auto max-w-4xl px-[clamp(1.25rem,4vw,3rem)] py-[clamp(2rem,4vw,3.5rem)] animate-fade-in">
      <Link
        to={`/community?category=${encodeURIComponent(thread.category)}`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-ink dark:text-bone-soft dark:hover:text-bone motion-safe:transition ease-expo focus-volt"
      >
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        {t('detail.backToCategory', { category: categoryLabel })}
      </Link>

      <article className="mt-5 rounded-2xl border border-line bg-canvas-sub p-6 dark:border-night-line dark:bg-night-sub sm:p-8">
        {thread.hidden && (
          <p
            role="status"
            className="mb-4 inline-flex items-center gap-2 rounded-full border border-coral/40 bg-coral/10 px-3 py-1.5 text-xs font-medium text-coral-deep dark:text-coral"
          >
            <EyeOff aria-hidden="true" className="h-3.5 w-3.5" />
            {t('detail.hiddenNotice')}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center rounded-full bg-canvas-deep px-2.5 py-1 font-medium text-ink-soft dark:bg-night-deep dark:text-bone-soft">
            {categoryLabel}
          </span>
          <span className="text-ink-mute dark:text-bone-mute" title={formatDate(thread.createdAt)}>
            {formatRelative(thread.createdAt)}
          </span>
        </div>
        <h1 className="mt-3 break-words font-display text-[1.7rem] font-bold leading-tight tracking-tight text-ink dark:text-bone sm:text-[2rem]">
          {thread.title}
        </h1>
        <p className="mt-2 text-sm text-ink-mute dark:text-bone-mute">
          {thread.author ? (
            <Link
              to={`/users/${thread.author.username}`}
              className="font-medium text-volt-700 hover:underline dark:text-volt-300 focus-volt"
            >
              @{thread.author.username}
            </Link>
          ) : (
            t('list.unknownAuthor')
          )}
        </p>
        <p className="mt-5 max-w-[72ch] whitespace-pre-wrap break-words text-[0.95rem] leading-relaxed text-ink-soft dark:text-bone-soft">
          {thread.body}
        </p>
        <AttachmentGallery attachments={thread.attachments} className="mt-5" />

        {canModerate && (
          <div className="mt-6 flex items-center gap-2 border-t border-line/70 pt-4 dark:border-night-line/70">
            {confirmingThreadDelete ? (
              <>
                <span className="text-xs text-coral-deep dark:text-coral">
                  {t('detail.deleteConfirm')}
                </span>
                <button
                  type="button"
                  onClick={() => void handleDeleteThread()}
                  disabled={deleteThreadMut.isPending}
                  className="inline-flex min-h-8 items-center gap-1 rounded-full bg-coral-deep px-3 py-1 text-xs font-semibold text-white disabled:opacity-60 motion-safe:transition ease-expo focus-volt"
                >
                  {deleteThreadMut.isPending && (
                    <Loader2 aria-hidden="true" className="h-3 w-3 motion-safe:animate-spin" />
                  )}
                  {t('detail.deleteYes')}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingThreadDelete(false)}
                  className="inline-flex min-h-8 items-center rounded-full px-3 py-1 text-xs font-medium text-ink-soft hover:text-ink dark:text-bone-soft dark:hover:text-bone focus-volt"
                >
                  {t('detail.deleteNo')}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmingThreadDelete(true)}
                className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-line px-3 py-1 text-xs font-medium text-ink-soft hover:border-coral/60 hover:text-coral-deep dark:border-night-line dark:text-bone-soft dark:hover:text-coral motion-safe:transition ease-expo focus-volt"
              >
                <Trash2 aria-hidden="true" className="h-3 w-3" />
                {t('detail.deleteThread')}
              </button>
            )}
          </div>
        )}
      </article>

      <section aria-label={t('comments.label')} className="mt-8">
        <h2 className="text-base font-bold tracking-tight text-ink dark:text-bone">
          {t('comments.heading', { count: thread.comments.filter((c) => !c.deleted).length })}
        </h2>

        {token ? (
          <form
            className="mt-4 rounded-2xl border border-line bg-canvas-sub p-4 dark:border-night-line dark:bg-night-sub"
            onSubmit={(event) => {
              event.preventDefault()
              void submitComment(null)
            }}
            noValidate
          >
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              maxLength={2000}
              rows={3}
              aria-label={t('comments.composerLabel')}
              placeholder={t('comments.composerPlaceholder')}
              className="w-full resize-y rounded-xl border border-line bg-canvas px-3 py-2 text-sm leading-relaxed text-ink placeholder:text-ink-mute focus:border-volt-500 focus:outline-none focus:ring-2 focus:ring-volt-500/60 dark:border-night-line dark:bg-night dark:text-bone dark:placeholder:text-bone-mute"
            />
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <AttachmentInput
                value={draftAttachments}
                onChange={setDraftAttachments}
                disabled={commentMut.isPending}
                className="min-w-0 flex-1"
              />
              <button
                type="submit"
                disabled={commentMut.isPending || draft.trim().length === 0}
                className="inline-flex min-h-9 shrink-0 items-center gap-2 self-end rounded-full bg-ink px-4 py-1.5 text-sm font-semibold text-bone disabled:cursor-not-allowed disabled:opacity-60 dark:bg-bone dark:text-ink motion-safe:transition ease-expo focus-volt"
              >
                {commentMut.isPending && (
                  <Loader2 aria-hidden="true" className="h-4 w-4 motion-safe:animate-spin" />
                )}
                {commentMut.isPending ? t('comments.posting') : t('comments.post')}
              </button>
            </div>
          </form>
        ) : (
          <p className="mt-4 rounded-2xl border border-dashed border-line px-4 py-3 text-sm text-ink-mute dark:border-night-line dark:text-bone-mute">
            <Link
              to="/login"
              state={{ from: `/community/${thread.id}` }}
              className="font-medium text-volt-700 underline dark:text-volt-300 focus-volt"
            >
              {t('comments.loginLink')}
            </Link>{' '}
            {t('comments.loginSuffix')}
          </p>
        )}

        {topLevel.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-line bg-canvas-sub px-6 py-10 text-center dark:border-night-line dark:bg-night-sub">
            <span
              aria-hidden="true"
              className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-canvas-deep text-ink-soft ring-1 ring-line dark:bg-night-deep dark:text-bone-soft dark:ring-night-line"
            >
              <MessageCircle className="h-4 w-4" />
            </span>
            <h3 className="mt-3 text-base font-semibold text-ink dark:text-bone">
              {t('comments.emptyTitle')}
            </h3>
            <p className="mx-auto mt-1 max-w-[36ch] text-sm leading-relaxed text-ink-mute dark:text-bone-mute">
              {t('comments.emptyDescription')}
            </p>
          </div>
        ) : (
          <ul className="mt-6 space-y-5">
            {topLevel.map((comment) => (
              <li
                key={comment.id}
                className="rounded-2xl border border-line bg-canvas-sub p-4 dark:border-night-line dark:bg-night-sub sm:p-5"
              >
                <CommentBlock
                  comment={comment}
                  confirming={confirmingCommentId === comment.id}
                  deleting={deleteCommentMut.isPending}
                  onConfirmChange={(next) => setConfirmingCommentId(next ? comment.id : null)}
                  onDelete={() => void handleDeleteComment(comment.id)}
                  onReply={
                    token && !comment.deleted
                      ? () => {
                          setReplyTo((current) => (current === comment.id ? null : comment.id))
                          setReplyDraft('')
                        }
                      : undefined
                  }
                />

                {(repliesByParent.get(comment.id) ?? []).length > 0 && (
                  <ol className="mt-4 space-y-4 border-l border-line/80 pl-4 dark:border-night-line/80 sm:ml-6">
                    {(repliesByParent.get(comment.id) ?? []).map((reply) => (
                      <li key={reply.id}>
                        <CommentBlock
                          comment={reply}
                          compact
                          confirming={confirmingCommentId === reply.id}
                          deleting={deleteCommentMut.isPending}
                          onConfirmChange={(next) => setConfirmingCommentId(next ? reply.id : null)}
                          onDelete={() => void handleDeleteComment(reply.id)}
                        />
                      </li>
                    ))}
                  </ol>
                )}

                {replyTo === comment.id && (
                  <form
                    className="mt-4 border-t border-line/70 pt-4 dark:border-night-line/70 sm:ml-6"
                    onSubmit={(event) => {
                      event.preventDefault()
                      void submitComment(comment.id)
                    }}
                    noValidate
                  >
                    <textarea
                      value={replyDraft}
                      onChange={(event) => setReplyDraft(event.target.value)}
                      maxLength={2000}
                      rows={2}
                      // Reply box is a disclosure revealed only on an explicit
                      // "reply" click; focusing the freshly shown input is the
                      // expected UX, not an unsolicited page-load focus steal.
                      // eslint-disable-next-line jsx-a11y/no-autofocus -- focus on user-triggered reply disclosure
                      autoFocus
                      aria-label={t('comments.replyLabel')}
                      placeholder={t('comments.replyPlaceholder')}
                      className="w-full resize-y rounded-xl border border-line bg-canvas px-3 py-2 text-sm leading-relaxed text-ink placeholder:text-ink-mute focus:border-volt-500 focus:outline-none focus:ring-2 focus:ring-volt-500/60 dark:border-night-line dark:bg-night dark:text-bone dark:placeholder:text-bone-mute"
                    />
                    <div className="mt-2 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setReplyTo(null)
                          setReplyDraft('')
                        }}
                        className="inline-flex min-h-8 items-center rounded-full px-3 py-1 text-xs font-medium text-ink-soft hover:text-ink dark:text-bone-soft dark:hover:text-bone focus-volt"
                      >
                        {t('comments.replyCancel')}
                      </button>
                      <button
                        type="submit"
                        disabled={commentMut.isPending || replyDraft.trim().length === 0}
                        className="inline-flex min-h-8 items-center gap-1.5 rounded-full bg-ink px-3.5 py-1 text-xs font-semibold text-bone disabled:cursor-not-allowed disabled:opacity-60 dark:bg-bone dark:text-ink motion-safe:transition ease-expo focus-volt"
                      >
                        {commentMut.isPending && (
                          <Loader2
                            aria-hidden="true"
                            className="h-3 w-3 motion-safe:animate-spin"
                          />
                        )}
                        {t('comments.replyPost')}
                      </button>
                    </div>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function CommentBlock({
  comment,
  compact,
  confirming,
  deleting,
  onConfirmChange,
  onDelete,
  onReply,
}: {
  comment: DiscussionCommentView
  compact?: boolean
  confirming: boolean
  deleting: boolean
  onConfirmChange: (confirming: boolean) => void
  onDelete: () => void
  onReply?: () => void
}) {
  const { t } = useTranslation('community')

  if (comment.deleted) {
    return (
      <p
        className={cn('italic text-ink-mute dark:text-bone-mute', compact ? 'text-xs' : 'text-sm')}
      >
        {t('comments.deletedPlaceholder')}
      </p>
    )
  }

  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={cn('font-semibold text-ink dark:text-bone', compact ? 'text-xs' : 'text-sm')}
        >
          @{comment.author?.username ?? t('list.unknownAuthor')}
        </span>
        <span
          className="text-[0.7rem] text-ink-mute dark:text-bone-mute"
          title={formatDate(comment.createdAt)}
        >
          {formatRelative(comment.createdAt)}
        </span>
      </div>
      <p
        className={cn(
          'mt-1 max-w-[70ch] whitespace-pre-wrap break-words leading-relaxed text-ink-soft dark:text-bone-soft',
          compact ? 'text-xs' : 'text-sm'
        )}
      >
        {comment.body}
      </p>
      {comment.attachments.length > 0 && (
        <AttachmentGallery attachments={comment.attachments} size="sm" className="mt-2" />
      )}
      <div className="mt-2 flex items-center gap-2">
        {onReply && (
          <button
            type="button"
            onClick={onReply}
            className="inline-flex min-h-7 items-center gap-1 rounded-full border border-line px-2.5 py-0.5 text-[0.7rem] font-medium text-ink-soft hover:border-volt-400 hover:text-ink dark:border-night-line dark:text-bone-soft dark:hover:border-volt-500/60 dark:hover:text-bone motion-safe:transition ease-expo focus-volt"
          >
            <CornerDownRight aria-hidden="true" className="h-3 w-3" />
            {t('comments.replyButton')}
          </button>
        )}
        {comment.isOwn &&
          (confirming ? (
            <span className="inline-flex items-center gap-2">
              <span className="text-[0.7rem] text-coral-deep dark:text-coral">
                {t('comments.deleteConfirm')}
              </span>
              <button
                type="button"
                onClick={onDelete}
                disabled={deleting}
                className="inline-flex min-h-7 items-center rounded-full bg-coral-deep px-2.5 py-0.5 text-[0.7rem] font-semibold text-white disabled:opacity-60 focus-volt"
              >
                {t('detail.deleteYes')}
              </button>
              <button
                type="button"
                onClick={() => onConfirmChange(false)}
                className="inline-flex min-h-7 items-center rounded-full px-2 py-0.5 text-[0.7rem] font-medium text-ink-soft hover:text-ink dark:text-bone-soft dark:hover:text-bone focus-volt"
              >
                {t('detail.deleteNo')}
              </button>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => onConfirmChange(true)}
              className="inline-flex min-h-7 items-center gap-1 rounded-full px-2 py-0.5 text-[0.7rem] font-medium text-ink-mute hover:text-coral-deep dark:text-bone-mute dark:hover:text-coral motion-safe:transition ease-expo focus-volt"
            >
              <Trash2 aria-hidden="true" className="h-3 w-3" />
              {t('comments.delete')}
            </button>
          ))}
      </div>
    </div>
  )
}
