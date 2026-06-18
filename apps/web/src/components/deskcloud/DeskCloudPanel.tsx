/**
 * DeskCloudPanel — NATIVE content-Desk drawer (PromptMarket / apps/web).
 * ──────────────────────────────────────────────────────────────────────────
 * A single floating launcher (bottom-left) + Radix Dialog drawer that hosts the
 * generic content Desks that have no dedicated page — Feedback (SurveyDesk),
 * Reviews (ReviewDesk) and Report (ModerationDesk). Each tab is env-gated by its
 * own VITE_<DESK>DESK_URL; the launcher renders only when at least one is set,
 * so the app is completely unaffected by default (reversible).
 *
 * Built entirely with THIS APP'S design system: Radix Dialog (same primitive as
 * FilterDrawer), OKLCH tokens, focus-volt rings, motion-safe animations — it
 * supersedes the prior foreign FeedbackWidget + DeskCloudDock widget embeds.
 *
 * NOT included: CommunityDesk (the app ships a first-party /community route — a
 * core feature we never replace) and MediaDesk (no matching first-party feature
 * to fold in). NotifyDesk + ChangelogDesk live in the navbar; SearchDesk binds
 * to a hotkey palette.
 * ──────────────────────────────────────────────────────────────────────────
 */
import * as Dialog from '@radix-ui/react-dialog'
import { cn } from '@utils/cn'
import { Flag, MessagesSquare, MessageSquareHeart, Star, X } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { getModerationClient, getReviewClient, getSurveyClient } from './config'
import FeedbackForm from './FeedbackForm'
import ReportForm from './ReportForm'
import ReviewWall from './ReviewWall'

type TabKey = 'feedback' | 'reviews' | 'report'

interface TabDef {
  key: TabKey
  label: string
  icon: ReactNode
  render: () => ReactNode
}

export default function DeskCloudPanel() {
  const { t } = useTranslation('common')
  const [open, setOpen] = useState(false)

  // Resolve each pk_ client once. A null client means that Desk is unset.
  const surveyClient = useMemo(() => getSurveyClient(), [])
  const reviewClient = useMemo(() => getReviewClient(), [])
  const moderationClient = useMemo(() => getModerationClient(), [])

  const tabs = useMemo<TabDef[]>(() => {
    const defs: TabDef[] = []
    if (surveyClient) {
      defs.push({
        key: 'feedback',
        label: t('deskPanel.feedback', { defaultValue: 'Feedback' }),
        icon: <MessageSquareHeart className="w-4 h-4" aria-hidden />,
        render: () => <FeedbackForm client={surveyClient} />,
      })
    }
    if (reviewClient) {
      defs.push({
        key: 'reviews',
        label: t('deskPanel.reviews', { defaultValue: 'Reviews' }),
        icon: <Star className="w-4 h-4" aria-hidden />,
        render: () => <ReviewWall client={reviewClient} />,
      })
    }
    if (moderationClient) {
      defs.push({
        key: 'report',
        label: t('deskPanel.report', { defaultValue: 'Report' }),
        icon: <Flag className="w-4 h-4" aria-hidden />,
        render: () => <ReportForm client={moderationClient} />,
      })
    }
    return defs
  }, [surveyClient, reviewClient, moderationClient, t])

  const [tab, setTab] = useState<TabKey>('feedback')

  // No content Desk configured → render nothing (app unaffected).
  if (tabs.length === 0) return null

  const current = tabs.find((d) => d.key === tab) ?? tabs[0]!

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className="fixed bottom-5 left-5 z-30 inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-[0.82rem] font-semibold text-bone shadow-lg shadow-ink/25 dark:bg-bone dark:text-ink dark:shadow-black/40 motion-safe:transition ease-expo lift-on-hover focus-volt"
          aria-label={t('deskPanel.launcher', { defaultValue: 'Feedback & reviews' })}
        >
          <MessagesSquare className="w-4 h-4" aria-hidden />
          <span className="hidden sm:inline">
            {t('deskPanel.launcherShort', { defaultValue: 'Feedback' })}
          </span>
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-ink/50 dark:bg-night/70 backdrop-blur-md data-[state=open]:motion-safe:animate-in data-[state=open]:fade-in" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed inset-y-0 left-0 z-50 flex w-[28rem] max-w-[92vw] flex-col border-r border-line bg-canvas shadow-xl shadow-ink/30 dark:border-night-line dark:bg-night"
        >
          <div className="flex items-center justify-between border-b border-line p-4 dark:border-night-line">
            <Dialog.Title className="font-display text-[1rem] font-semibold tracking-tight text-ink dark:text-bone">
              {t('deskPanel.title', { defaultValue: 'Help us improve' })}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label={t('deskPanel.close', { defaultValue: 'Close' })}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-ink-soft hover:bg-canvas-deep dark:text-bone-soft dark:hover:bg-night-sub motion-safe:transition ease-expo focus-volt"
              >
                <X aria-hidden className="w-4 h-4" />
              </button>
            </Dialog.Close>
          </div>

          {tabs.length > 1 && (
            <div
              role="tablist"
              aria-label={t('deskPanel.tabsLabel', { defaultValue: 'Feedback sections' })}
              className="flex gap-1.5 border-b border-line px-4 py-2.5 dark:border-night-line"
            >
              {tabs.map((d) => {
                const active = d.key === current.key
                return (
                  <button
                    key={d.key}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setTab(d.key)}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[0.8rem] font-medium motion-safe:transition ease-expo focus-volt',
                      active
                        ? 'bg-ink text-bone dark:bg-bone dark:text-ink'
                        : 'text-ink-soft hover:bg-canvas-sub hover:text-ink dark:text-bone-soft dark:hover:bg-night-sub dark:hover:text-bone'
                    )}
                  >
                    {d.icon}
                    {d.label}
                  </button>
                )
              })}
            </div>
          )}

          <div role="tabpanel" className="flex-1 overflow-y-auto p-5">
            {current.render()}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
