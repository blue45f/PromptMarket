/**
 * NavbarChangelog — env-gated mount for the native ChangelogDesk "What's new".
 * Renders the native ChangelogMenu only when VITE_CHANGELOGDESK_URL is set;
 * otherwise nothing (no first-party changelog feature to fall back to). The
 * client comes from the published `@heejun/deskcloud` SDK (`pk_`).
 */
import { useMemo } from 'react'

import ChangelogMenu from './ChangelogMenu'
import { getChangelogClient } from './config'

export default function NavbarChangelog() {
  const client = useMemo(() => getChangelogClient(), [])
  if (!client) return null
  return <ChangelogMenu client={client} />
}
