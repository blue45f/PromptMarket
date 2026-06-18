import { ListingDetailPage } from './pages/ListingDetailPage.tsx'
import { ListingListPage } from './pages/ListingListPage.tsx'
import { useHashPath } from './router'

export function App() {
  const path = useHashPath()
  const m = path.match(/^\/listing\/(.+)$/)
  if (m) return <ListingDetailPage id={decodeURIComponent(m[1])} />
  return <ListingListPage />
}
