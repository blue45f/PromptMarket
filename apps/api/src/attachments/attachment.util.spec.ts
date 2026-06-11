import { BadRequestException } from '@nestjs/common'
import { describe, expect, it } from 'vitest'
import { buildAttachmentCreates, serializeAttachment } from './attachment.util'

const PNG = `data:image/png;base64,${'QUJD'.repeat(16)}`

describe('buildAttachmentCreates', () => {
  it('returns an empty list for undefined input', () => {
    expect(buildAttachmentCreates('u1', undefined)).toEqual([])
  })

  it('computes the decoded byte size and carries dimensions', () => {
    const [row] = buildAttachmentCreates('u1', [{ dataUrl: PNG, width: 1600, height: 1200 }])
    expect(row.uploaderId).toBe('u1')
    expect(row.width).toBe(1600)
    expect(row.height).toBe(1200)
    expect(row.byteSize).toBeGreaterThan(0)
    // base64 → bytes is ~3/4 of the payload length
    const payload = PNG.slice(PNG.indexOf(',') + 1)
    expect(row.byteSize).toBeLessThanOrEqual(Math.ceil((payload.length * 3) / 4))
  })

  it('rejects more than 3 attachments', () => {
    const four = Array.from({ length: 4 }, () => ({ dataUrl: PNG }))
    expect(() => buildAttachmentCreates('u1', four)).toThrow(BadRequestException)
  })

  it('rejects non-image data URLs', () => {
    expect(() =>
      buildAttachmentCreates('u1', [{ dataUrl: 'data:text/html;base64,QUJDRA==' }])
    ).toThrow(BadRequestException)
  })

  it('rejects empty payloads', () => {
    expect(() => buildAttachmentCreates('u1', [{ dataUrl: 'data:image/png;base64,' }])).toThrow(
      BadRequestException
    )
  })
})

describe('serializeAttachment', () => {
  it('exposes only the public fields', () => {
    expect(serializeAttachment({ id: 'a1', dataUrl: PNG, width: 10, height: 20 })).toEqual({
      id: 'a1',
      dataUrl: PNG,
      width: 10,
      height: 20,
    })
  })
})
