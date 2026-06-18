/**
 * DeskCloud — NATIVE integration shell (PromptMarket / apps/web).
 * ──────────────────────────────────────────────────────────────────────────
 * Mounted once in <AppProviders>, outside the routed content. Hosts the
 * app-shell-level DeskCloud surfaces that have no single page:
 *
 *   • DeskCloudPanel  — floating launcher + drawer for the content Desks
 *                       (SurveyDesk feedback / ReviewDesk reviews /
 *                        ModerationDesk report), each env-gated.
 *   • SearchDeskMount — native global-search palette (hotkey mod+/), distinct
 *                       from the app's core ⌘K command palette.
 *
 * Everything here is NATIVE: the app's own components + OKLCH tokens + Radix
 * Dialog, talking to the live Desks via the published `@heejun/deskcloud` SDK
 * (`pk_` browser clients). No widget bundles, no foreign CSS — this supersedes
 * the prior FeedbackWidget + DeskCloudDock + scoped-CSS widget embeds.
 *
 * NotifyDesk (navbar bell) and ChangelogDesk (navbar "What's new") mount in the
 * Navbar's icon cluster instead, so they read as first-class navbar features.
 * CommunityDesk is intentionally NOT wired — the app ships a first-party
 * /community route (a core feature we never replace).
 * ──────────────────────────────────────────────────────────────────────────
 */
import { type ReactElement } from 'react'

import DeskCloudPanel from './DeskCloudPanel'
import SearchDeskMount from './SearchDeskMount'

export function DeskCloudWidgets(): ReactElement {
  return (
    <>
      <DeskCloudPanel />
      <SearchDeskMount />
    </>
  )
}

export default DeskCloudWidgets
