import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const toastSuccess = vi.fn()
const toastError = vi.fn()

vi.mock('sonner', () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccess(...args),
    error: (...args: unknown[]) => toastError(...args),
  },
}))

const { copyWithToast, shareWithToast } = await import('./shareWithToast')

function setNav(value: Partial<Navigator>) {
  for (const [key, val] of Object.entries(value)) {
    Object.defineProperty(navigator, key, { value: val, configurable: true, writable: true })
  }
}

describe('copyWithToast', () => {
  const originalClipboard = navigator.clipboard

  beforeEach(() => {
    toastSuccess.mockClear()
    toastError.mockClear()
  })

  afterEach(() => {
    setNav({ clipboard: originalClipboard })
    vi.restoreAllMocks()
  })

  it('shows the success toast (only) when the copy succeeds', async () => {
    setNav({
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } as unknown as Clipboard,
    })

    const ok = await copyWithToast('https://promptmarket.test/x', { successMessage: 'Copied!' })

    expect(ok).toBe(true)
    expect(toastSuccess).toHaveBeenCalledWith('Copied!')
    expect(toastError).not.toHaveBeenCalled()
  })

  it('shows an error toast when the copy fails everywhere', async () => {
    setNav({ clipboard: undefined })
    Object.defineProperty(document, 'execCommand', {
      value: vi.fn().mockReturnValue(false),
      configurable: true,
      writable: true,
    })

    const ok = await copyWithToast('x', { failedMessage: 'Nope' })

    expect(ok).toBe(false)
    expect(toastError).toHaveBeenCalledWith('Nope')
    expect(toastSuccess).not.toHaveBeenCalled()
  })
})

describe('shareWithToast', () => {
  const originalShare = navigator.share
  const originalClipboard = navigator.clipboard

  beforeEach(() => {
    toastSuccess.mockClear()
    toastError.mockClear()
    setNav({ share: undefined, clipboard: undefined })
  })

  afterEach(() => {
    setNav({ share: originalShare, clipboard: originalClipboard })
    vi.restoreAllMocks()
  })

  it('shows a copied toast when it falls back to the clipboard', async () => {
    setNav({
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } as unknown as Clipboard,
    })

    const result = await shareWithToast(
      { url: 'https://promptmarket.test/x' },
      { copiedMessage: 'Link copied' }
    )

    expect(result).toBe('copied')
    expect(toastSuccess).toHaveBeenCalledWith('Link copied')
  })

  it('stays silent when the native share sheet completes', async () => {
    setNav({ share: vi.fn().mockResolvedValue(undefined) })

    const result = await shareWithToast({ url: 'https://promptmarket.test/x' })

    expect(result).toBe('shared')
    expect(toastSuccess).not.toHaveBeenCalled()
    expect(toastError).not.toHaveBeenCalled()
  })
})
