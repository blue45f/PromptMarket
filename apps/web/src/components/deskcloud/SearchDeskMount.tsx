/**
 * SearchDeskMount — env-gated mount for the native SearchDesk palette.
 * Renders the native SearchDeskPalette (hotkey mod+/) only when
 * VITE_SEARCHDESK_URL is set; the app's core ⌘K palette is always primary and
 * is never touched. The client comes from the published `@heejun/deskcloud` SDK.
 */
import { useMemo } from 'react'

import { getSearchClient } from './config'
import SearchDeskPalette from './SearchDeskPalette'

export default function SearchDeskMount() {
  const client = useMemo(() => getSearchClient(), [])
  if (!client) return null
  return <SearchDeskPalette client={client} />
}
