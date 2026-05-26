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

export function formatDate(input: string | Date): string {
  const d = typeof input === 'string' ? new Date(input) : input;
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/** Compact number formatter (1.2k, 3.4M) used in stat strips and chips. */
export function formatCompact(n: number | undefined | null): string {
  if (n == null || !Number.isFinite(n)) return '0';
  try {
    return new Intl.NumberFormat(undefined, {
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(n);
  } catch {
    return String(n);
  }
}
