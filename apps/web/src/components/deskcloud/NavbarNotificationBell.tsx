/**
 * NavbarNotificationBell — NotifyDesk (live) ↔ first-party bell (fallback).
 * ──────────────────────────────────────────────────────────────────────────
 * In the navbar's bell slot: when NotifyDesk is configured (VITE_NOTIFYDESK_URL)
 * AND a recipient exists (signed-in user.id), render the NATIVE live inbox bell
 * (data via the published `@heejun/deskcloud` `pk_` SDK, app design tokens).
 * Otherwise render the existing first-party static bell. The two never show at
 * once and the integration is fully reversible — clear the env to revert.
 * ──────────────────────────────────────────────────────────────────────────
 */
import { getNotifyClient } from '@components/deskcloud/config'
import NotifyDeskBell from '@components/deskcloud/NotifyDeskBell'
import HomegrownNotificationBell from '@components/NotificationBell'
import { useAuthStore } from '@store/auth'
import { useMemo, type ReactElement } from 'react'

export default function NavbarNotificationBell(): ReactElement {
  const user = useAuthStore((s) => s.user)
  // Memoize the pk_ client so polling effects keep a stable reference.
  const client = useMemo(() => getNotifyClient(), [])

  if (client && user?.id) {
    return <NotifyDeskBell client={client} recipientId={user.id} />
  }

  return <HomegrownNotificationBell />
}
