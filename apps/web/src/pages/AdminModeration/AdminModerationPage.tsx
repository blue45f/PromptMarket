import AdminAttachmentsPanel from '@components/AdminAttachmentsPanel'
import AdminNav from '@components/AdminNav'
import ConfirmActionButton from '@components/ConfirmActionButton'
import EmptyState from '@components/EmptyState'
import {
  useAdminDeleteThread,
  useAdminForbiddenWords,
  useAdminThreads,
  useCreateForbiddenWord,
  useDeleteForbiddenWord,
  useSetThreadVisibility,
  useUpdateForbiddenWord,
} from '@features/admin'
import { usePageMeta } from '@hooks/usePageMeta'
import { getErrorMessage } from '@services/api'
import { cn } from '@utils/cn'
import { formatDate } from '@utils/format'
import { Edit3, Eye, EyeOff, ImageIcon, Plus, Save, Search, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import type {
  CreateForbiddenWordInput,
  ForbiddenWordAction,
  ForbiddenWordMatchType,
  ForbiddenWordRow,
  UpdateForbiddenWordInput,
} from '@promptmarket/shared'

const ruleActions: ForbiddenWordAction[] = ['BLOCK', 'REVIEW']
const ruleMatchTypes: ForbiddenWordMatchType[] = ['WHOLE_WORD', 'CONTAINS']

interface RuleDraft {
  phrase: string
  action: ForbiddenWordAction
  matchType: ForbiddenWordMatchType
  enabled: boolean
  note: string
}

const emptyRuleDraft: RuleDraft = {
  phrase: '',
  action: 'BLOCK',
  matchType: 'WHOLE_WORD',
  enabled: true,
  note: '',
}

function toCreateInput(draft: RuleDraft): CreateForbiddenWordInput {
  return {
    phrase: draft.phrase.trim(),
    action: draft.action,
    matchType: draft.matchType,
    enabled: draft.enabled,
    note: draft.note.trim() || null,
  }
}

function toUpdateInput(draft: RuleDraft): UpdateForbiddenWordInput {
  return toCreateInput(draft)
}

/** Community board moderation: hide, restore, delete, strip attachments. */
export default function AdminModerationPage() {
  const { t } = useTranslation('admin')
  const threadsQ = useAdminThreads()
  const [ruleSearch, setRuleSearch] = useState('')
  const rulesQ = useAdminForbiddenWords(ruleSearch)
  const createRuleMut = useCreateForbiddenWord()
  const updateRuleMut = useUpdateForbiddenWord()
  const deleteRuleMut = useDeleteForbiddenWord()
  const visibilityMut = useSetThreadVisibility()
  const deleteMut = useAdminDeleteThread()
  const [expandedId, setExpandedId] = useState<string | null>(null)

  usePageMeta({ title: t('moderation.meta.title'), description: t('moderation.meta.description') })

  const threads = threadsQ.data ?? []
  const rules = rulesQ.data ?? []

  return (
    <div className="mx-auto max-w-[1280px] px-[clamp(1.25rem,4vw,3rem)] py-[clamp(2rem,4vw,3.5rem)] pb-20 animate-fade-in">
      <header className="mb-6 space-y-2">
        <h1
          className="font-display font-bold text-ink dark:text-bone leading-[0.95] tracking-[-0.035em] display-tight"
          style={{ fontSize: 'var(--text-display-md)' }}
        >
          {t('moderation.title')}
        </h1>
        <p className="max-w-[58ch] text-ink-soft dark:text-bone-soft">{t('moderation.subtitle')}</p>
      </header>

      <AdminNav />

      <ForbiddenWordsPanel
        rules={rules}
        loading={rulesQ.isPending}
        error={rulesQ.error}
        search={ruleSearch}
        onSearch={setRuleSearch}
        createRule={async (draft) => {
          await createRuleMut.mutateAsync(toCreateInput(draft))
        }}
        updateRule={async (id, draft) => {
          await updateRuleMut.mutateAsync({ id, input: toUpdateInput(draft) })
        }}
        toggleRule={async (rule) => {
          await updateRuleMut.mutateAsync({ id: rule.id, input: { enabled: !rule.enabled } })
        }}
        deleteRule={async (id) => {
          await deleteRuleMut.mutateAsync(id)
        }}
        pending={createRuleMut.isPending || updateRuleMut.isPending || deleteRuleMut.isPending}
      />

      {threadsQ.error && (
        <p role="status" className="mb-6 font-mono text-sm text-coral-deep dark:text-coral">
          {getErrorMessage(threadsQ.error)}
        </p>
      )}

      {threadsQ.isPending ? (
        <div className="h-64 rounded-2xl bg-canvas-sub dark:bg-night-sub motion-safe:animate-pulse" />
      ) : threads.length === 0 ? (
        <EmptyState
          emoji="🧹"
          title={t('moderation.emptyTitle')}
          description={t('moderation.emptyDescription')}
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line dark:border-night-line">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-canvas dark:bg-night">
                <tr className="text-left text-[0.66rem] uppercase tracking-[0.16em] text-ink-mute dark:text-bone-mute">
                  <th className="px-4 py-3 font-normal">{t('moderation.table.thread')}</th>
                  <th className="px-4 py-3 font-normal">{t('moderation.table.author')}</th>
                  <th className="px-4 py-3 font-normal">{t('moderation.table.activity')}</th>
                  <th className="px-4 py-3 font-normal">{t('moderation.table.status')}</th>
                  <th className="px-4 py-3 font-normal">{t('moderation.table.actions')}</th>
                </tr>
              </thead>
              <tbody className="bg-canvas-sub dark:bg-night-sub">
                {threads.map((thread) => {
                  const hidden = !!thread.hiddenAt
                  const needsReview = !!thread.needsReviewAt && !hidden
                  const expanded = expandedId === thread.id
                  return (
                    <ThreadRowGroup key={thread.id} expanded={expanded}>
                      <tr
                        className={cn(
                          'border-t border-line dark:border-night-line text-ink dark:text-bone',
                          hidden && 'opacity-70'
                        )}
                      >
                        <td className="max-w-[22rem] px-4 py-3">
                          <Link
                            to={`/community/${thread.id}`}
                            className="block truncate font-medium text-volt-700 hover:underline dark:text-volt-300 focus-volt"
                          >
                            {thread.title}
                          </Link>
                          <p className="mt-0.5 text-xs text-ink-mute dark:text-bone-mute">
                            {t(`home:categories.labels.${thread.category}`, {
                              defaultValue: thread.category,
                            })}{' '}
                            · {formatDate(thread.createdAt)}
                          </p>
                        </td>
                        <td className="px-4 py-3">@{thread.author.username}</td>
                        <td className="px-4 py-3 tabular-nums">
                          {t('moderation.table.activityValue', {
                            comments: thread.commentCount,
                            attachments: thread.attachmentCount,
                          })}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.68rem] font-semibold',
                              hidden
                                ? 'bg-coral/15 text-coral-deep dark:text-coral'
                                : needsReview
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-200'
                                  : 'bg-volt-100 text-volt-900 dark:bg-volt-900/40 dark:text-volt-200'
                            )}
                          >
                            {hidden
                              ? t('moderation.status.hidden')
                              : needsReview
                                ? t('moderation.status.needsReview')
                                : t('moderation.status.visible')}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() =>
                                visibilityMut.mutate({ id: thread.id, hidden: !hidden })
                              }
                              disabled={visibilityMut.isPending}
                              className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-line px-3 py-1 text-xs font-medium text-ink-soft hover:border-volt-400 hover:text-ink disabled:opacity-50 dark:border-night-line dark:text-bone-soft dark:hover:border-volt-500/60 dark:hover:text-bone motion-safe:transition ease-expo focus-volt"
                            >
                              {hidden ? (
                                <Eye aria-hidden="true" className="h-3 w-3" />
                              ) : (
                                <EyeOff aria-hidden="true" className="h-3 w-3" />
                              )}
                              {hidden ? t('moderation.actions.show') : t('moderation.actions.hide')}
                            </button>
                            <button
                              type="button"
                              onClick={() => setExpandedId(expanded ? null : thread.id)}
                              disabled={thread.attachmentCount === 0}
                              aria-expanded={expanded}
                              className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-line px-3 py-1 text-xs font-medium text-ink-soft hover:border-volt-400 hover:text-ink disabled:cursor-not-allowed disabled:opacity-50 dark:border-night-line dark:text-bone-soft dark:hover:border-volt-500/60 dark:hover:text-bone motion-safe:transition ease-expo focus-volt"
                            >
                              <ImageIcon aria-hidden="true" className="h-3 w-3" />
                              {t('moderation.actions.attachments', {
                                count: thread.attachmentCount,
                              })}
                            </button>
                            <ConfirmActionButton
                              label={t('moderation.actions.delete')}
                              confirmLabel={t('moderation.actions.deleteConfirm')}
                              pending={deleteMut.isPending}
                              onConfirm={() =>
                                deleteMut.mutateAsync(thread.id).catch(() => undefined)
                              }
                              icon={<Trash2 aria-hidden="true" className="h-3 w-3" />}
                            />
                          </div>
                        </td>
                      </tr>
                      {expanded && (
                        <tr className="border-t border-line/60 dark:border-night-line/60">
                          <td colSpan={5} className="bg-canvas px-4 dark:bg-night">
                            <AdminAttachmentsPanel target={{ threadId: thread.id }} />
                          </td>
                        </tr>
                      )}
                    </ThreadRowGroup>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

/** Fragment helper — keeps the expandable row adjacent to its parent row. */
function ThreadRowGroup({ children }: { expanded: boolean; children: React.ReactNode }) {
  return <>{children}</>
}

interface ForbiddenWordsPanelProps {
  rules: ForbiddenWordRow[]
  loading: boolean
  error: unknown
  search: string
  onSearch: (value: string) => void
  createRule: (draft: RuleDraft) => Promise<void>
  updateRule: (id: string, draft: RuleDraft) => Promise<void>
  toggleRule: (rule: ForbiddenWordRow) => Promise<void>
  deleteRule: (id: string) => Promise<void>
  pending: boolean
}

function ForbiddenWordsPanel({
  rules,
  loading,
  error,
  search,
  onSearch,
  createRule,
  updateRule,
  toggleRule,
  deleteRule,
  pending,
}: ForbiddenWordsPanelProps) {
  const { t } = useTranslation('admin')
  const [draft, setDraft] = useState<RuleDraft>(emptyRuleDraft)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingDraft, setEditingDraft] = useState<RuleDraft>(emptyRuleDraft)

  function beginEdit(rule: ForbiddenWordRow) {
    setEditingId(rule.id)
    setEditingDraft({
      phrase: rule.phrase,
      action: rule.action,
      matchType: rule.matchType,
      enabled: rule.enabled,
      note: rule.note ?? '',
    })
  }

  function saveEdit(id: string) {
    void updateRule(id, editingDraft)
      .then(() => setEditingId(null))
      .catch(() => undefined)
  }

  function submitCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!draft.phrase.trim()) return
    void createRule(draft)
      .then(() => setDraft(emptyRuleDraft))
      .catch(() => undefined)
  }

  return (
    <section className="mb-8 overflow-hidden rounded-2xl border border-line dark:border-night-line">
      <div className="flex flex-col gap-4 border-b border-line bg-canvas px-4 py-4 dark:border-night-line dark:bg-night sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-display text-xl font-semibold tracking-tight text-ink dark:text-bone">
            {t('moderation.forbiddenWords.title')}
          </h2>
          <p className="mt-1 max-w-[60ch] text-sm text-ink-soft dark:text-bone-soft">
            {t('moderation.forbiddenWords.subtitle')}
          </p>
        </div>
        <label className="relative block min-w-0 sm:w-72">
          <span className="sr-only">{t('moderation.forbiddenWords.searchLabel')}</span>
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-mute dark:text-bone-mute"
          />
          <input
            value={search}
            onChange={(event) => onSearch(event.currentTarget.value)}
            placeholder={t('moderation.forbiddenWords.searchPlaceholder')}
            className="h-10 w-full rounded-full border border-line bg-canvas-sub pl-9 pr-3 text-sm text-ink outline-none placeholder:text-ink-mute focus:border-volt-500 dark:border-night-line dark:bg-night-sub dark:text-bone dark:placeholder:text-bone-mute"
          />
        </label>
      </div>

      {error ? (
        <p role="status" className="px-4 pt-4 font-mono text-sm text-coral-deep dark:text-coral">
          {getErrorMessage(error)}
        </p>
      ) : null}

      <form
        onSubmit={submitCreate}
        className="grid gap-3 border-b border-line bg-canvas-sub px-4 py-4 dark:border-night-line dark:bg-night-sub md:grid-cols-[minmax(10rem,1fr)_9rem_10rem_8rem_minmax(10rem,1fr)_auto]"
      >
        <RuleTextInput
          label={t('moderation.forbiddenWords.fields.phrase')}
          value={draft.phrase}
          onChange={(phrase) => setDraft((current) => ({ ...current, phrase }))}
        />
        <RuleSelect
          label={t('moderation.forbiddenWords.fields.action')}
          value={draft.action}
          values={ruleActions}
          onChange={(action) => setDraft((current) => ({ ...current, action }))}
        />
        <RuleSelect
          label={t('moderation.forbiddenWords.fields.matchType')}
          value={draft.matchType}
          values={ruleMatchTypes}
          onChange={(matchType) => setDraft((current) => ({ ...current, matchType }))}
        />
        <RuleEnabledToggle
          checked={draft.enabled}
          onChange={(enabled) => setDraft((current) => ({ ...current, enabled }))}
        />
        <RuleTextInput
          label={t('moderation.forbiddenWords.fields.note')}
          value={draft.note}
          onChange={(note) => setDraft((current) => ({ ...current, note }))}
        />
        <button
          type="submit"
          disabled={pending || !draft.phrase.trim()}
          className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-bone disabled:cursor-not-allowed disabled:opacity-50 dark:bg-bone dark:text-ink focus-volt"
        >
          <Plus aria-hidden="true" className="h-4 w-4" />
          {t('moderation.forbiddenWords.actions.create')}
        </button>
      </form>

      {loading ? (
        <div className="h-28 bg-canvas-sub dark:bg-night-sub motion-safe:animate-pulse" />
      ) : rules.length === 0 ? (
        <p className="bg-canvas-sub px-4 py-8 text-sm text-ink-soft dark:bg-night-sub dark:text-bone-soft">
          {t('moderation.forbiddenWords.empty')}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-canvas dark:bg-night">
              <tr className="text-left text-[0.66rem] uppercase tracking-[0.16em] text-ink-mute dark:text-bone-mute">
                <th className="px-4 py-3 font-normal">
                  {t('moderation.forbiddenWords.fields.phrase')}
                </th>
                <th className="px-4 py-3 font-normal">
                  {t('moderation.forbiddenWords.fields.action')}
                </th>
                <th className="px-4 py-3 font-normal">
                  {t('moderation.forbiddenWords.fields.matchType')}
                </th>
                <th className="px-4 py-3 font-normal">
                  {t('moderation.forbiddenWords.fields.status')}
                </th>
                <th className="px-4 py-3 font-normal">
                  {t('moderation.forbiddenWords.fields.updated')}
                </th>
                <th className="px-4 py-3 font-normal">{t('moderation.table.actions')}</th>
              </tr>
            </thead>
            <tbody className="bg-canvas-sub dark:bg-night-sub">
              {rules.map((rule) => {
                const editing = editingId === rule.id
                return (
                  <tr
                    key={rule.id}
                    className={cn(
                      'border-t border-line text-ink dark:border-night-line dark:text-bone',
                      !rule.enabled && 'opacity-70'
                    )}
                  >
                    <td className="min-w-64 px-4 py-3">
                      {editing ? (
                        <div className="space-y-2">
                          <RuleTextInput
                            label={t('moderation.forbiddenWords.fields.phrase')}
                            value={editingDraft.phrase}
                            onChange={(phrase) =>
                              setEditingDraft((current) => ({ ...current, phrase }))
                            }
                          />
                          <RuleTextInput
                            label={t('moderation.forbiddenWords.fields.note')}
                            value={editingDraft.note}
                            onChange={(note) =>
                              setEditingDraft((current) => ({ ...current, note }))
                            }
                          />
                        </div>
                      ) : (
                        <>
                          <p className="font-medium">{rule.phrase}</p>
                          {rule.note && (
                            <p className="mt-1 max-w-[34ch] truncate text-xs text-ink-mute dark:text-bone-mute">
                              {rule.note}
                            </p>
                          )}
                        </>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {editing ? (
                        <RuleSelect
                          label={t('moderation.forbiddenWords.fields.action')}
                          value={editingDraft.action}
                          values={ruleActions}
                          onChange={(action) =>
                            setEditingDraft((current) => ({ ...current, action }))
                          }
                        />
                      ) : (
                        <RulePill tone={rule.action === 'BLOCK' ? 'danger' : 'warn'}>
                          {t(`moderation.forbiddenWords.actions.${rule.action}`)}
                        </RulePill>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {editing ? (
                        <RuleSelect
                          label={t('moderation.forbiddenWords.fields.matchType')}
                          value={editingDraft.matchType}
                          values={ruleMatchTypes}
                          onChange={(matchType) =>
                            setEditingDraft((current) => ({ ...current, matchType }))
                          }
                        />
                      ) : (
                        t(`moderation.forbiddenWords.matchTypes.${rule.matchType}`)
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {editing ? (
                        <RuleEnabledToggle
                          checked={editingDraft.enabled}
                          onChange={(enabled) =>
                            setEditingDraft((current) => ({ ...current, enabled }))
                          }
                        />
                      ) : (
                        <RulePill tone={rule.enabled ? 'ok' : 'muted'}>
                          {rule.enabled
                            ? t('moderation.forbiddenWords.status.enabled')
                            : t('moderation.forbiddenWords.status.disabled')}
                        </RulePill>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-ink-mute dark:text-bone-mute">
                      {formatDate(rule.updatedAt)}
                    </td>
                    <td className="px-4 py-3">
                      {editing ? (
                        <div className="flex flex-wrap items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => saveEdit(rule.id)}
                            disabled={pending || !editingDraft.phrase.trim()}
                            className="inline-flex min-h-8 items-center gap-1.5 rounded-full bg-ink px-3 py-1 text-xs font-semibold text-bone disabled:opacity-50 dark:bg-bone dark:text-ink focus-volt"
                          >
                            <Save aria-hidden="true" className="h-3 w-3" />
                            {t('moderation.forbiddenWords.actions.save')}
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-line px-3 py-1 text-xs font-medium text-ink-soft hover:text-ink dark:border-night-line dark:text-bone-soft dark:hover:text-bone focus-volt"
                          >
                            <X aria-hidden="true" className="h-3 w-3" />
                            {t('moderation.forbiddenWords.actions.cancel')}
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-wrap items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => beginEdit(rule)}
                            className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-line px-3 py-1 text-xs font-medium text-ink-soft hover:border-volt-400 hover:text-ink dark:border-night-line dark:text-bone-soft dark:hover:border-volt-500/60 dark:hover:text-bone focus-volt"
                          >
                            <Edit3 aria-hidden="true" className="h-3 w-3" />
                            {t('moderation.forbiddenWords.actions.edit')}
                          </button>
                          <button
                            type="button"
                            onClick={() => void toggleRule(rule).catch(() => undefined)}
                            disabled={pending}
                            className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-line px-3 py-1 text-xs font-medium text-ink-soft hover:border-volt-400 hover:text-ink disabled:opacity-50 dark:border-night-line dark:text-bone-soft dark:hover:border-volt-500/60 dark:hover:text-bone focus-volt"
                          >
                            {rule.enabled ? (
                              <EyeOff aria-hidden="true" className="h-3 w-3" />
                            ) : (
                              <Eye aria-hidden="true" className="h-3 w-3" />
                            )}
                            {rule.enabled
                              ? t('moderation.forbiddenWords.actions.disable')
                              : t('moderation.forbiddenWords.actions.enable')}
                          </button>
                          <ConfirmActionButton
                            label={t('moderation.forbiddenWords.actions.delete')}
                            confirmLabel={t('moderation.forbiddenWords.actions.deleteConfirm')}
                            pending={pending}
                            onConfirm={() => deleteRule(rule.id).catch(() => undefined)}
                            icon={<Trash2 aria-hidden="true" className="h-3 w-3" />}
                          />
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

function RuleTextInput({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 block text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-ink-mute dark:text-bone-mute">
        {label}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
        className="h-10 w-full rounded-xl border border-line bg-white px-3 text-sm text-ink outline-none placeholder:text-ink-mute focus:border-volt-500 dark:border-night-line dark:bg-night dark:text-bone"
      />
    </label>
  )
}

function RuleSelect<TValue extends string>({
  label,
  value,
  values,
  onChange,
}: {
  label: string
  value: TValue
  values: readonly TValue[]
  onChange: (value: TValue) => void
}) {
  const { t } = useTranslation('admin')
  return (
    <label className="block min-w-0">
      <span className="mb-1 block text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-ink-mute dark:text-bone-mute">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.currentTarget.value as TValue)}
        className="h-10 w-full rounded-xl border border-line bg-white px-3 text-sm text-ink outline-none focus:border-volt-500 dark:border-night-line dark:bg-night dark:text-bone"
      >
        {values.map((item) => (
          <option key={item} value={item}>
            {t(`moderation.forbiddenWords.options.${item}`)}
          </option>
        ))}
      </select>
    </label>
  )
}

function RuleEnabledToggle({
  checked,
  onChange,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  const { t } = useTranslation('admin')
  return (
    <label className="flex h-full min-h-10 items-end gap-2 pb-2 text-sm text-ink-soft dark:text-bone-soft">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.currentTarget.checked)}
        className="h-4 w-4 rounded border-line text-volt-600 focus:ring-volt-500 dark:border-night-line"
      />
      <span>{t('moderation.forbiddenWords.fields.enabled')}</span>
    </label>
  )
}

function RulePill({
  tone,
  children,
}: {
  tone: 'danger' | 'warn' | 'ok' | 'muted'
  children: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-[0.68rem] font-semibold',
        tone === 'danger' && 'bg-coral/15 text-coral-deep dark:text-coral',
        tone === 'warn' && 'bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-200',
        tone === 'ok' && 'bg-volt-100 text-volt-900 dark:bg-volt-900/40 dark:text-volt-200',
        tone === 'muted' && 'bg-ink/5 text-ink-mute dark:bg-bone/10 dark:text-bone-mute'
      )}
    >
      {children}
    </span>
  )
}
