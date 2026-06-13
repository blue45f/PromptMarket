// Re-export formatting helpers from the shared package so all surfaces match.
import { activeIntlLocale } from '@/i18n'

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

const rtfCache = new Map<string, Intl.RelativeTimeFormat>()
const nfCompactCache = new Map<string, Intl.NumberFormat>()

function getRtf(locale: string): Intl.RelativeTimeFormat {
  let fmt = rtfCache.get(locale)
  if (!fmt) {
    fmt = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
    rtfCache.set(locale, fmt)
  }
  return fmt
}

function getNfCompact(locale: string): Intl.NumberFormat {
  let fmt = nfCompactCache.get(locale)
  if (!fmt) {
    fmt = new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 })
    nfCompactCache.set(locale, fmt)
  }
  return fmt
}

const dtfDateCache = new Map<string, Intl.DateTimeFormat>()
function getDtfDate(locale: string): Intl.DateTimeFormat {
  let fmt = dtfDateCache.get(locale)
  if (!fmt) {
    fmt = new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: 'numeric' })
    dtfDateCache.set(locale, fmt)
  }
  return fmt
}

export function formatDate(input: string | Date): string {
  const d = typeof input === 'string' ? new Date(input) : input
  if (Number.isNaN(d.getTime())) return ''
  return getDtfDate(activeIntlLocale()).format(d)
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
    const rtf = getRtf(locale)
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
    return getNfCompact(activeIntlLocale()).format(n)
  } catch {
    return String(n)
  }
}
