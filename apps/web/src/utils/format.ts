// Re-export formatting helpers from the shared package so all surfaces match.
export {
  typeLabel,
  typeColor,
  typeEmoji,
  typeGradient,
  formatPrice,
  modelLabel,
  modelVendor,
  modelFamily,
} from '@promptmarket/shared';

export function formatDollars(cents: number): string {
  return `$${((cents ?? 0) / 100).toFixed(2)}`;
}

/** Locale used for human-facing dates and compact numbers. Set once so the
 *  formatting is deterministic regardless of the browser's system locale. */
const LOCALE = 'ko-KR';

export function formatDate(input: string | Date): string {
  const d = typeof input === 'string' ? new Date(input) : input;
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(LOCALE, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/** Relative time ("3분 전", "어제") for activity timestamps where the absolute
 *  date is less interesting than the freshness. Falls back to formatDate
 *  beyond 30 days. Always uses Korean locale. */
export function formatRelative(input: string | Date): string {
  const d = typeof input === 'string' ? new Date(input) : input;
  if (Number.isNaN(d.getTime())) return '';
  const diffMs = d.getTime() - Date.now();
  const diffMin = Math.round(diffMs / 60_000);
  const absMin = Math.abs(diffMin);
  try {
    const rtf = new Intl.RelativeTimeFormat(LOCALE, { numeric: 'auto' });
    if (absMin < 1) return '방금';
    if (absMin < 60) return rtf.format(diffMin, 'minute');
    if (absMin < 60 * 24) return rtf.format(Math.round(diffMin / 60), 'hour');
    if (absMin < 60 * 24 * 30)
      return rtf.format(Math.round(diffMin / (60 * 24)), 'day');
    return formatDate(d);
  } catch {
    return formatDate(d);
  }
}

/** Compact number formatter (1.2천, 3.4만) used in stat strips and chips.
 *  Uses Korean compact notation so the ko-KR locale renders 만/억 instead of K/M. */
export function formatCompact(n: number | undefined | null): string {
  if (n == null || !Number.isFinite(n)) return '0';
  try {
    return new Intl.NumberFormat(LOCALE, {
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(n);
  } catch {
    return String(n);
  }
}
