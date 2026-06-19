import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { copyToClipboard, shareOrCopy } from './shareOrCopy'

describe('shareOrCopy', () => {
  const originalShare = navigator.share
  const originalCanShare = navigator.canShare
  const originalClipboard = navigator.clipboard

  function setNav(value: Partial<Navigator>) {
    for (const [key, val] of Object.entries(value)) {
      Object.defineProperty(navigator, key, { value: val, configurable: true, writable: true })
    }
  }

  beforeEach(() => {
    setNav({ share: undefined, canShare: undefined, clipboard: undefined })
  })

  afterEach(() => {
    setNav({
      share: originalShare,
      canShare: originalCanShare,
      clipboard: originalClipboard,
    })
    vi.restoreAllMocks()
  })

  it('uses the native share sheet when available', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    setNav({ share })

    const result = await shareOrCopy({ title: 'T', url: 'https://promptmarket.test/x' })

    expect(result).toBe('shared')
    expect(share).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'T', url: 'https://promptmarket.test/x' })
    )
  })

  it('treats an AbortError (user closed the sheet) as dismissed without copying', async () => {
    const share = vi.fn().mockRejectedValue(new DOMException('cancelled', 'AbortError'))
    const writeText = vi.fn().mockResolvedValue(undefined)
    setNav({ share, clipboard: { writeText } as unknown as Clipboard })

    const result = await shareOrCopy({ url: 'https://promptmarket.test/x' })

    expect(result).toBe('dismissed')
    expect(writeText).not.toHaveBeenCalled()
  })

  it('falls back to clipboard when the Web Share API is unavailable', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    setNav({ clipboard: { writeText } as unknown as Clipboard })

    const result = await shareOrCopy({
      title: 'PromptMarket',
      text: 'share',
      url: 'https://promptmarket.test/x',
    })

    expect(result).toBe('copied')
    expect(writeText).toHaveBeenCalledWith('PromptMarket — share — https://promptmarket.test/x')
  })

  it('falls back to clipboard when a non-abort share error is thrown', async () => {
    const share = vi.fn().mockRejectedValue(new Error('boom'))
    const writeText = vi.fn().mockResolvedValue(undefined)
    setNav({ share, clipboard: { writeText } as unknown as Clipboard })

    const result = await shareOrCopy({ url: 'https://promptmarket.test/x' })

    expect(result).toBe('copied')
    expect(writeText).toHaveBeenCalledWith('https://promptmarket.test/x')
  })

  it('reports unsupported when neither share nor clipboard nor execCommand works', async () => {
    const execCommand = vi.fn().mockReturnValue(false)
    Object.defineProperty(document, 'execCommand', {
      value: execCommand,
      configurable: true,
      writable: true,
    })

    const result = await shareOrCopy({ url: 'https://promptmarket.test/x' })

    expect(result).toBe('unsupported')
  })
})

describe('copyToClipboard', () => {
  const originalClipboard = navigator.clipboard

  function setClipboard(value: Clipboard | undefined) {
    Object.defineProperty(navigator, 'clipboard', {
      value,
      configurable: true,
      writable: true,
    })
  }

  afterEach(() => {
    setClipboard(originalClipboard)
    vi.restoreAllMocks()
  })

  it('returns false for empty text without touching the clipboard', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    setClipboard({ writeText } as unknown as Clipboard)

    expect(await copyToClipboard('')).toBe(false)
    expect(writeText).not.toHaveBeenCalled()
  })

  it('writes to the async clipboard when available', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    setClipboard({ writeText } as unknown as Clipboard)

    expect(await copyToClipboard('hello')).toBe(true)
    expect(writeText).toHaveBeenCalledWith('hello')
  })

  it('falls back to execCommand when the async clipboard rejects', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('denied'))
    setClipboard({ writeText } as unknown as Clipboard)
    const execCommand = vi.fn().mockReturnValue(true)
    Object.defineProperty(document, 'execCommand', {
      value: execCommand,
      configurable: true,
      writable: true,
    })

    expect(await copyToClipboard('hello')).toBe(true)
    expect(execCommand).toHaveBeenCalledWith('copy')
  })
})
