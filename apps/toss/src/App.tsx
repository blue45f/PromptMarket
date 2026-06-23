import { ListingDetailPage } from './pages/ListingDetailPage.tsx'
import { ListingListPage } from './pages/ListingListPage.tsx'
import { useHashPath } from './router'
import IntroSplashScreen from './components/IntroSplashScreen.tsx'

export function App() {
  const path = useHashPath()
  const m = path.match(/^\/listing\/(.+)$/)
  const content = m ? <ListingDetailPage id={decodeURIComponent(m[1])} /> : <ListingListPage />

  return (
    <>
      <IntroSplashScreen />
      {content}
    </>
  )
}
