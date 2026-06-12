import { useTranslation } from 'react-i18next'
import Spinner from '@components/Spinner'

/**
 * Initial-hydration / route-loading fallback for the data router.
 *
 * React Router renders this while the root route resolves its first lazy
 * module; supplying it (via the route's `HydrateFallback`) is what silences
 * the "No `HydrateFallback` element provided" warning. Kept intentionally
 * minimal so it never flashes heavy chrome before the real shell mounts.
 */
export default function RouteFallback() {
  const { t } = useTranslation('common')
  return (
    <div className="flex min-h-screen items-center justify-center px-[clamp(1.25rem,4vw,3rem)]">
      <Spinner size={28} label={t('actions.loading')} />
    </div>
  )
}
