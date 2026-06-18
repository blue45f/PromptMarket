/**
 * DeskCloud — NATIVE integration config (PromptMarket / apps/web).
 * ──────────────────────────────────────────────────────────────────────────
 * Single source of truth for the env-gated, browser-safe DeskCloud clients.
 * We use the PUBLISHED SDK `@heejun/deskcloud` (the `pk_` browser entry only)
 * and render every Desk with THIS APP'S OWN components + OKLCH tokens — there
 * are no foreign widget bundles or scoped widget CSS.
 *
 * Each Desk is active only when its `VITE_<DESK>DESK_URL` is set; the
 * publishable key comes from `VITE_<DESK>DESK_PK` and defaults to `pk_demo`.
 * When a URL is unset the integration falls back to the app's own first-party
 * feature (fully reversible — just clear the env var).
 *
 * SECURITY: this module imports ONLY from '@heejun/deskcloud' (publishable
 * `pk_` clients, browser-safe). It NEVER imports '@heejun/deskcloud/server'
 * and never references a secret `sk_` key — none ship in client code.
 * ──────────────────────────────────────────────────────────────────────────
 */
import {
  createAdClient,
  createChangelogClient,
  createModerationClient,
  createNotifyClient,
  createReviewClient,
  createSearchClient,
  createSurveyClient,
  type AdClient,
  type ChangelogClient,
  type ModerationClient,
  type NotifyClient,
  type ReviewClient,
  type SearchClient,
  type SurveyClient,
} from '@heejun/deskcloud'

const env = import.meta.env

/** Resolve the publishable key for a Desk; falls back to the public demo key. */
function pk(specific: string | undefined): string {
  return specific ?? 'pk_demo'
}

/**
 * The stable host-app identifier used as the SurveyDesk `appId` and as the
 * subject id for tenant-wide ReviewDesk / ModerationDesk calls.
 */
export const DESKCLOUD_APP_ID = 'promptmarket'

/* ── SurveyDesk — in-app feedback ─────────────────────────────────────────── */
export const surveyDeskUrl = env.VITE_SURVEYDESK_URL
export function getSurveyClient(): SurveyClient | null {
  if (!surveyDeskUrl) return null
  return createSurveyClient({ endpoint: surveyDeskUrl, publishableKey: pk(env.VITE_SURVEYDESK_PK) })
}

/* ── ChangelogDesk — "What's new" ─────────────────────────────────────────── */
export const changelogDeskUrl = env.VITE_CHANGELOGDESK_URL
export function getChangelogClient(): ChangelogClient | null {
  if (!changelogDeskUrl) return null
  return createChangelogClient({
    endpoint: changelogDeskUrl,
    publishableKey: pk(env.VITE_CHANGELOGDESK_PK),
  })
}

/* ── NotifyDesk — recipient inbox bell ────────────────────────────────────── */
export const notifyDeskUrl = env.VITE_NOTIFYDESK_URL
export function getNotifyClient(): NotifyClient | null {
  if (!notifyDeskUrl) return null
  return createNotifyClient({ endpoint: notifyDeskUrl, publishableKey: pk(env.VITE_NOTIFYDESK_PK) })
}

/* ── ReviewDesk — ratings & testimonials ──────────────────────────────────── */
export const reviewDeskUrl = env.VITE_REVIEWDESK_URL
export function getReviewClient(): ReviewClient | null {
  if (!reviewDeskUrl) return null
  return createReviewClient({ endpoint: reviewDeskUrl, publishableKey: pk(env.VITE_REVIEWDESK_PK) })
}

/* ── SearchDesk — secondary global search ─────────────────────────────────── */
export const searchDeskUrl = env.VITE_SEARCHDESK_URL
export function getSearchClient(): SearchClient | null {
  if (!searchDeskUrl) return null
  return createSearchClient({ endpoint: searchDeskUrl, publishableKey: pk(env.VITE_SEARCHDESK_PK) })
}

/* ── ModerationDesk — report content ──────────────────────────────────────── */
export const moderationDeskUrl = env.VITE_MODERATIONDESK_URL
export function getModerationClient(): ModerationClient | null {
  if (!moderationDeskUrl) return null
  return createModerationClient({
    endpoint: moderationDeskUrl,
    publishableKey: pk(env.VITE_MODERATIONDESK_PK),
  })
}

/* ── AdDesk — sponsored spotlight rail ────────────────────────────────────── */
export const adDeskUrl = env.VITE_ADDESK_URL
export function getAdClient(): AdClient | null {
  if (!adDeskUrl) return null
  return createAdClient({ endpoint: adDeskUrl, publishableKey: pk(env.VITE_ADDESK_PK) })
}

/**
 * Slot keys the home "Sponsored Spotlight" rail serves (one creative each).
 * Override per-deployment with a comma-separated `VITE_ADDESK_SLOTS`; the rail
 * renders only the slots that return an active creative, so unconfigured slots
 * (and the whole rail, when AdDesk is off) simply stay invisible.
 */
export const adHomeSlots: string[] = (
  env.VITE_ADDESK_SLOTS ?? 'home-spotlight-1,home-spotlight-2,home-spotlight-3'
)
  .split(',')
  .map((s: string) => s.trim())
  .filter(Boolean)

/**
 * A stable, anonymous per-browser id for changelog read tracking. Persisted in
 * localStorage; regenerated when storage is unavailable (private mode, embeds).
 */
const ANON_ID_KEY = 'pm.deskcloud.anonId'
export function getAnonId(): string {
  if (typeof window === 'undefined') return 'anon'
  try {
    const existing = globalThis.localStorage.getItem(ANON_ID_KEY)
    if (existing) return existing
    const id =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `anon-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
    globalThis.localStorage.setItem(ANON_ID_KEY, id)
    return id
  } catch {
    return `anon-${Math.random().toString(36).slice(2, 10)}`
  }
}
