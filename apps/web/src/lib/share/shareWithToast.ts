import { toast } from 'sonner'

import { copyToClipboard, shareOrCopy, type ShareInput, type ShareResult } from './shareOrCopy'

import i18n from '@/i18n'

type ShareWithToastOptions = {
  /** Toast shown when we fall back to a clipboard copy. */
  copiedMessage?: string
  /** Toast shown when neither sharing nor copying worked. */
  failedMessage?: string
}

/**
 * App-standard share handler that pairs {@link shareOrCopy} with sonner toasts.
 * - Native share sheet success → no toast (the OS sheet is its own feedback).
 * - Clipboard fallback → an informational "link copied" toast.
 * - Total failure → an error toast asking the user to copy manually.
 * - User-dismissed sheet → silent.
 *
 * Returns the {@link ShareResult} so callers can also drive inline UI state.
 */
export async function shareWithToast(
  input: ShareInput,
  options: ShareWithToastOptions = {}
): Promise<ShareResult> {
  const result = await shareOrCopy(input)
  if (result === 'copied') {
    toast.success(options.copiedMessage ?? i18n.t('common:toasts.linkCopied'))
  } else if (result === 'unsupported') {
    toast.error(options.failedMessage ?? i18n.t('common:toasts.shareFailed'))
  }
  return result
}

type CopyWithToastOptions = {
  /** Toast shown on a successful copy (omit to stay silent on success). */
  successMessage?: string
  /** Toast shown when the copy fails. */
  failedMessage?: string
}

/**
 * Copy text to the clipboard with consistent toast feedback. On success shows
 * `successMessage` (when provided); on failure always shows an error toast so a
 * denied/unsupported clipboard never fails silently. Returns whether it copied.
 */
export async function copyWithToast(
  text: string,
  options: CopyWithToastOptions = {}
): Promise<boolean> {
  const ok = await copyToClipboard(text)
  if (ok) {
    if (options.successMessage) toast.success(options.successMessage)
  } else {
    toast.error(options.failedMessage ?? i18n.t('common:toasts.copyFailed'))
  }
  return ok
}
