// Re-export formatting helpers from the shared package so all surfaces match.
export { typeLabel, typeColor, formatPrice } from '@promptmarket/shared';

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
