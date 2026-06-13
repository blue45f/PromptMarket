import { cn } from '@utils/cn'
import { LineChart, MessagesSquare, Star, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { NavLink } from 'react-router-dom'

const items = [
  { to: '/admin', end: true, icon: LineChart, key: 'revenue' },
  { to: '/admin/moderation', end: false, icon: MessagesSquare, key: 'moderation' },
  { to: '/admin/reviews', end: false, icon: Star, key: 'reviews' },
  { to: '/admin/members', end: false, icon: Users, key: 'members' },
] as const

/**
 * Shared switcher across the split admin routes. Each surface owns a full
 * route instead of stacking into one mega-page, so deep links and the back
 * button behave like the rest of the app.
 */
export default function AdminNav() {
  const { t } = useTranslation('admin')

  return (
    <nav aria-label={t('nav.label')} className="mb-8 -mx-1 overflow-x-auto scrollbar-hide">
      <ul className="flex items-center gap-1 px-1">
        {items.map(({ to, end, icon: Icon, key }) => (
          <li key={to} className="shrink-0">
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'inline-flex min-h-9 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[0.82rem] font-medium tracking-tight motion-safe:transition ease-expo focus-volt',
                  isActive
                    ? 'bg-ink text-bone dark:bg-bone dark:text-ink'
                    : 'border border-line dark:border-night-line text-ink-soft dark:text-bone-soft hover:border-volt-400 hover:text-ink dark:hover:border-volt-500/60 dark:hover:text-bone'
                )
              }
            >
              <Icon aria-hidden="true" className="h-3.5 w-3.5" />
              {t(`nav.${key}`)}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
