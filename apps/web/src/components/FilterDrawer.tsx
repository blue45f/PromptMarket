import * as Dialog from '@radix-ui/react-dialog'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import FilterPanel, { type FilterState } from './FilterPanel'
import { useSavedFilters } from '@hooks/useSavedFilters'

interface FilterDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  value: FilterState
  onChange: (next: FilterState) => void
  onReset: () => void
}

export default function FilterDrawer({
  open,
  onOpenChange,
  value,
  onChange,
  onReset,
}: FilterDrawerProps) {
  const navigate = useNavigate()
  const { t } = useTranslation('browse')
  const { entries: saved, remove } = useSavedFilters()

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-ink/50 dark:bg-night/70 backdrop-blur-md data-[state=open]:motion-safe:animate-in data-[state=open]:fade-in" />
        <Dialog.Content
          className="fixed inset-y-0 left-0 z-50 w-80 max-w-[88vw] bg-canvas dark:bg-night border-r border-line dark:border-night-line shadow-xl shadow-ink/30 flex flex-col"
          aria-describedby={undefined}
        >
          <div className="flex items-center justify-between p-4 border-b border-line dark:border-night-line">
            <Dialog.Title className="font-display text-[1rem] font-semibold text-ink dark:text-bone tracking-tight">
              {t('drawer.title')}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label={t('drawer.close')}
                className="inline-flex items-center justify-center w-8 h-8 rounded-full text-ink-soft dark:text-bone-soft hover:bg-canvas-deep dark:hover:bg-night-sub motion-safe:transition focus-volt"
              >
                <X className="w-4 h-4" />
              </button>
            </Dialog.Close>
          </div>

          {saved.length > 0 && (
            <div className="px-4 pt-4 pb-2 border-b border-line dark:border-night-line">
              <p className="font-mono text-[0.66rem] uppercase tracking-[0.18em] text-volt-700 dark:text-volt-300 inline-flex items-center gap-2 mb-2.5">
                <span aria-hidden className="w-5 h-px bg-volt-500" />
                {t('drawer.savedLabel')}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {saved.map((f) => (
                  <span
                    key={f.search}
                    className="group inline-flex items-center gap-1 rounded-full bg-canvas-sub dark:bg-night-sub border border-line dark:border-night-line hover:border-volt-400 dark:hover:border-volt-500/60 motion-safe:transition"
                  >
                    <button
                      type="button"
                      aria-label={t('drawer.savedApply', {
                        label: f.label,
                        defaultValue: 'Apply saved filter: {{label}}',
                      })}
                      onClick={() => {
                        onOpenChange(false)
                        navigate(`/browse?${f.search}`)
                      }}
                      className="inline-flex items-center px-2.5 py-1 text-[0.74rem] text-ink-soft dark:text-bone-soft group-hover:text-ink dark:group-hover:text-bone motion-safe:transition focus-volt rounded-full"
                    >
                      {f.label}
                    </button>
                    <button
                      type="button"
                      aria-label={t('drawer.savedRemove', {
                        label: f.label,
                        defaultValue: 'Remove saved filter: {{label}}',
                      })}
                      onClick={() => remove(f.search)}
                      className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full text-ink-mute dark:text-bone-mute hover:text-coral-deep dark:hover:text-coral motion-safe:transition focus-volt mr-1.5"
                    >
                      <X className="w-3 h-3" aria-hidden />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-4">
            <FilterPanel value={value} onChange={onChange} onReset={onReset} />
          </div>
          <div className="border-t border-line dark:border-night-line p-4">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="group relative overflow-hidden w-full inline-flex justify-center items-center gap-2 px-4 py-2.5 rounded-full bg-ink dark:bg-bone text-bone dark:text-ink text-sm font-medium tracking-tight motion-safe:transition focus-volt"
            >
              <span
                aria-hidden
                className="absolute inset-0 bg-volt-500 translate-y-full motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-y-0"
              />
              <span className="relative group-hover:text-ink motion-safe:transition-colors">
                {t('drawer.apply')}
              </span>
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
