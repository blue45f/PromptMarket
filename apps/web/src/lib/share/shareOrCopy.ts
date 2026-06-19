// Framework-agnostic share helper — prefers the Web Share API (mobile / some
// desktop browsers), then falls back to copying the URL to the clipboard, then
// to a legacy execCommand copy for insecure/older contexts. No design or
// framework dependencies, so it can be vendored verbatim across sibling apps.
// Vendored from desk-platform/apps/web/src/lib/share/.

export type ShareInput = {
  /** Share title. Included in the copy-fallback text when the Share API is absent. */
  title?: string
  /** Share description / body. */
  text?: string
  /** Share URL. Defaults to the current location.href when omitted. */
  url?: string
}

/**
 * 'shared'      — native share sheet completed
 * 'copied'      — fell back to clipboard copy
 * 'dismissed'   — user cancelled the native sheet (not an error)
 * 'unsupported' — neither the Share API nor any clipboard path worked
 */
export type ShareResult = 'shared' | 'copied' | 'dismissed' | 'unsupported'

/** Render title/text/url as a single human-readable line for the copy fallback. */
function toCopyText(input: ShareInput, url: string): string {
  return [input.title, input.text, url].filter(Boolean).join(' — ') || url
}

/**
 * Copy plain text to the clipboard, with a legacy execCommand fallback for
 * insecure contexts (HTTP previews) where navigator.clipboard is unavailable.
 * Returns whether the copy succeeded. Never throws.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (!text) return false

  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      // Permission denied or non-secure context — fall through to execCommand.
    }
  }

  if (typeof document !== 'undefined') {
    try {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.setAttribute('readonly', '')
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      ta.style.pointerEvents = 'none'
      document.body.appendChild(ta)
      ta.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(ta)
      if (ok) return true
    } catch {
      // Ignore — return false below.
    }
  }

  return false
}

/**
 * Share content. Uses the native share sheet when present; otherwise copies the
 * URL to the clipboard.
 * - Closing the native sheet resolves to `'dismissed'` (not treated as an error).
 * - In SSR / non-browser environments this resolves to `'unsupported'` instead
 *   of throwing.
 */
export async function shareOrCopy(input: ShareInput = {}): Promise<ShareResult> {
  if (typeof navigator === 'undefined') return 'unsupported'
  const url =
    input.url ?? (typeof globalThis.location !== 'undefined' ? globalThis.location.href : '')
  const data: ShareData = { title: input.title, text: input.text, url }

  // 1) Web Share API
  if (typeof navigator.share === 'function') {
    try {
      // Prefer canShare when present so we don't hand the sheet incompatible data.
      if (typeof navigator.canShare !== 'function' || navigator.canShare(data)) {
        await navigator.share(data)
        return 'shared'
      }
    } catch (err) {
      // User closed the sheet → normal flow, surface it as a distinct result.
      if (err instanceof DOMException && err.name === 'AbortError') return 'dismissed'
      // Any other error → fall through to the clipboard fallback.
    }
  }

  // 2) Clipboard copy fallback (incl. legacy execCommand)
  const copied = await copyToClipboard(toCopyText(input, url))
  return copied ? 'copied' : 'unsupported'
}
