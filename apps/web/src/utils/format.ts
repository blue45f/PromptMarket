// Re-export formatting helpers from the shared package so all surfaces match.
export {
  typeLabel,
  typeColor,
  typeEmoji,
  typeGradient,
  formatPrice,
  formatDollars,
  modelLabel,
  modelVendor,
  modelFamily,
} from '@promptmarket/shared'

import { activeIntlLocale } from '@/i18n'

export function formatDate(input: string | Date): string {
  const d = typeof input === 'string' ? new Date(input) : input
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString(activeIntlLocale(), {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/** Relative time ("3분 전", "yesterday") for activity timestamps where the
 *  absolute date is less interesting than the freshness. Falls back to
 *  formatDate beyond 30 days. Follows the active UI language. */
export function formatRelative(input: string | Date): string {
  const d = typeof input === 'string' ? new Date(input) : input
  if (Number.isNaN(d.getTime())) return ''
  const diffMs = d.getTime() - Date.now()
  const diffSec = Math.round(diffMs / 1000)
  const diffMin = Math.round(diffMs / 60_000)
  const absSec = Math.abs(diffSec)
  const absMin = Math.abs(diffMin)
  try {
    const locale = activeIntlLocale()
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
    if (absSec < 60) return locale === 'ko-KR' ? '방금' : rtf.format(diffSec, 'second')
    if (absMin < 60) return rtf.format(diffMin, 'minute')
    if (absMin < 60 * 24) return rtf.format(Math.round(diffMin / 60), 'hour')
    if (absMin < 60 * 24 * 30) return rtf.format(Math.round(diffMin / (60 * 24)), 'day')
    return formatDate(d)
  } catch {
    return formatDate(d)
  }
}

/** Compact number formatter — renders 만/억 under ko-KR and K/M under en-US,
 *  following the active UI language. Used in stat strips and chips. */
export function formatCompact(n: number | undefined | null): string {
  if (n == null || !Number.isFinite(n)) return '0'
  try {
    return new Intl.NumberFormat(activeIntlLocale(), {
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(n)
  } catch {
    return String(n)
  }
}
