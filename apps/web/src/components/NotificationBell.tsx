import { Bell } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

export default function NotificationBell() {
  const { t } = useTranslation('nav')
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={t('notifications.label', { defaultValue: 'Notifications' })}
        aria-expanded={open}
        aria-controls="notification-bell-panel"
        className="relative inline-flex items-center justify-center w-8 h-8 rounded-full text-ink-soft dark:text-bone-soft hover:text-ink dark:hover:text-bone hover:bg-canvas-sub dark:hover:bg-night-sub motion-safe:transition ease-expo focus-volt"
      >
        <Bell className="w-4 h-4" aria-hidden />
      </button>

      {open && (
        <div
          id="notification-bell-panel"
          role="dialog"
          className="absolute right-0 top-full z-20 mt-2 w-72 rounded-2xl border border-line dark:border-night-line bg-canvas dark:bg-night-sub p-3 shadow-2xl shadow-ink/15 dark:shadow-black/35"
        >
          <p className="font-medium text-[0.92rem] text-ink dark:text-bone">
            {t('notifications.panelTitle', { defaultValue: 'Notifications' })}
          </p>
          <p className="mt-1 text-[0.75rem] text-ink-soft dark:text-bone-soft">
            {t('notifications.panelBody', {
              defaultValue: 'Notification center stub is ready and will be connected next.',
            })}
          </p>
        </div>
      )}
    </div>
  )
}
