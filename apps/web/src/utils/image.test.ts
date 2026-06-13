import { ATTACHMENT_MAX_SOURCE_BYTES } from '@promptmarket/shared'
import { describe, expect, it } from 'vitest'

import { AttachmentError, prepareImageAttachment } from './image'

// jsdom has no real canvas, so these tests cover the validation guards that
// run before any drawing happens — the paths users actually hit when they
// pick the wrong file.
describe('prepareImageAttachment guards', () => {
  it('rejects non-image files', async () => {
    const file = new File(['plain text'], 'notes.txt', { type: 'text/plain' })
    await expect(prepareImageAttachment(file)).rejects.toMatchObject({
      code: 'not-image',
    } satisfies Partial<AttachmentError>)
  })

  it('rejects sources above the 2MB cap before decoding', async () => {
    const big = new Uint8Array(ATTACHMENT_MAX_SOURCE_BYTES + 1)
    const file = new File([big], 'huge.png', { type: 'image/png' })
    await expect(prepareImageAttachment(file)).rejects.toMatchObject({
      code: 'too-large',
    } satisfies Partial<AttachmentError>)
  })
})
