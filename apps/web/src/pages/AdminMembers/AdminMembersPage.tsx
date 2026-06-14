import AdminNav from '@components/AdminNav'
import ConfirmActionButton from '@components/ConfirmActionButton'
import EmptyState from '@components/EmptyState'
import { useAdminMembers, useSetMemberSuspension } from '@domains/admin'
import { useDebounce } from '@hooks/useDebounce'
import { usePageMeta } from '@hooks/usePageMeta'
import { getErrorMessage } from '@infrastructure/api'
import { useAuthStore } from '@store/auth'
import { cn } from '@utils/cn'
import { formatDate } from '@utils/format'
import { Search, ShieldBan, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

/** Member directory with suspension controls. */
export default function AdminMembersPage() {
  const { t } = useTranslation('admin')
  const { user: me } = useAuthStore()
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query, 300)
  const membersQ = useAdminMembers(debouncedQuery)
  const suspensionMut = useSetMemberSuspension()

  usePageMeta({ title: t('members.meta.title'), description: t('members.meta.description') })

  const members = membersQ.data ?? []

  return (
    <div className="mx-auto max-w-[1280px] px-[clamp(1.25rem,4vw,3rem)] py-[clamp(2rem,4vw,3.5rem)] pb-20 animate-fade-in">
      <header className="mb-6 space-y-2">
        <h1
          className="font-display font-bold text-ink dark:text-bone leading-[0.95] tracking-[-0.035em] display-tight"
          style={{ fontSize: 'var(--text-display-md)' }}
        >
          {t('members.title')}
        </h1>
        <p className="max-w-[58ch] text-ink-soft dark:text-bone-soft">{t('members.subtitle')}</p>
      </header>

      <AdminNav />

      <div className="mb-5 max-w-sm">
        <label htmlFor="member-search" className="sr-only">
          {t('members.searchLabel')}
        </label>
        <div className="relative">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-mute dark:text-bone-mute"
          />
          <input
            id="member-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('members.searchPlaceholder')}
            className="w-full rounded-full border border-line bg-canvas py-2.5 pl-9 pr-4 text-sm text-ink placeholder:text-ink-mute focus:border-volt-500 focus:outline-none focus:ring-2 focus:ring-volt-500/60 dark:border-night-line dark:bg-night dark:text-bone dark:placeholder:text-bone-mute"
          />
        </div>
      </div>

      {membersQ.error && (
        <p role="status" className="mb-6 font-mono text-sm text-coral-deep dark:text-coral">
          {getErrorMessage(membersQ.error)}
        </p>
      )}

      {membersQ.isPending ? (
        <div className="h-64 rounded-2xl bg-canvas-sub dark:bg-night-sub motion-safe:animate-pulse" />
      ) : members.length === 0 ? (
        <EmptyState
          emoji="🪪"
          variant="discover"
          title={t('members.emptyTitle')}
          description={t('members.emptyDescription')}
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line dark:border-night-line">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-canvas dark:bg-night">
                <tr className="text-left text-[0.66rem] uppercase tracking-[0.16em] text-ink-mute dark:text-bone-mute">
                  <th className="px-4 py-3 font-normal">{t('members.table.member')}</th>
                  <th className="px-4 py-3 font-normal">{t('members.table.joined')}</th>
                  <th className="px-4 py-3 font-normal">{t('members.table.activity')}</th>
                  <th className="px-4 py-3 font-normal">{t('members.table.status')}</th>
                  <th className="px-4 py-3 font-normal">{t('members.table.actions')}</th>
                </tr>
              </thead>
              <tbody className="bg-canvas-sub dark:bg-night-sub">
                {members.map((member) => {
                  const suspended = !!member.suspendedAt
                  const isSelf = member.id === me?.id
                  return (
                    <tr
                      key={member.id}
                      className={cn(
                        'border-t border-line text-ink dark:border-night-line dark:text-bone',
                        suspended && 'opacity-75'
                      )}
                    >
                      <td className="px-4 py-3">
                        <Link
                          to={`/users/${member.username}`}
                          className="font-medium text-volt-700 hover:underline dark:text-volt-300 focus-volt"
                        >
                          @{member.username}
                        </Link>
                        {member.isAdmin && (
                          <span className="ml-2 inline-flex items-center rounded-full bg-canvas-deep px-2 py-0.5 text-[0.64rem] font-semibold text-ink-soft dark:bg-night-deep dark:text-bone-soft">
                            {t('members.adminBadge')}
                          </span>
                        )}
                        <p className="mt-0.5 truncate text-xs text-ink-mute dark:text-bone-mute">
                          {member.email}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-xs tabular-nums text-ink-soft dark:text-bone-soft">
                        {formatDate(member.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-xs tabular-nums">
                        {t('members.table.activityValue', {
                          listings: member.listingCount,
                          reviews: member.reviewCount,
                          threads: member.threadCount,
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.68rem] font-semibold',
                            suspended
                              ? 'bg-coral/15 text-coral-deep dark:text-coral'
                              : 'bg-volt-100 text-volt-900 dark:bg-volt-900/40 dark:text-volt-200'
                          )}
                        >
                          {suspended ? t('members.status.suspended') : t('members.status.active')}
                        </span>
                        {suspended && member.suspendedAt && (
                          <p className="mt-0.5 text-[0.66rem] text-ink-mute dark:text-bone-mute">
                            {formatDate(member.suspendedAt)}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {suspended ? (
                          <button
                            type="button"
                            onClick={() =>
                              suspensionMut.mutate({ id: member.id, suspended: false })
                            }
                            disabled={suspensionMut.isPending}
                            className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-line px-3 py-1 text-xs font-medium text-ink-soft hover:border-volt-400 hover:text-ink disabled:opacity-50 dark:border-night-line dark:text-bone-soft dark:hover:border-volt-500/60 dark:hover:text-bone motion-safe:transition ease-expo focus-volt"
                          >
                            <ShieldCheck aria-hidden="true" className="h-3 w-3" />
                            {t('members.actions.reinstate')}
                          </button>
                        ) : (
                          <ConfirmActionButton
                            label={t('members.actions.suspend')}
                            confirmLabel={t('members.actions.suspendConfirm')}
                            pending={suspensionMut.isPending}
                            disabled={member.isAdmin || isSelf}
                            onConfirm={() =>
                              suspensionMut
                                .mutateAsync({ id: member.id, suspended: true })
                                .catch(() => undefined)
                            }
                            icon={<ShieldBan aria-hidden="true" className="h-3 w-3" />}
                          />
                        )}
                      </td>
                    </tr>
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
