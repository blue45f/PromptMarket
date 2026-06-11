import { BadRequestException } from '@nestjs/common'
import {
  ATTACHMENTS_PER_POST,
  ATTACHMENT_MAX_DATAURL_CHARS,
  dataUrlByteSize,
  isImageDataUrl,
  type AttachmentInput,
} from '@promptmarket/shared'

export interface AttachmentCreateData {
  dataUrl: string
  byteSize: number
  width: number | null
  height: number | null
  uploaderId: string
}

/**
 * Defense-in-depth re-validation of attachment payloads (the Zod DTO already
 * checks shape) plus byte-size accounting. Shared by reviews and community.
 */
export function buildAttachmentCreates(
  uploaderId: string,
  attachments: AttachmentInput[] | undefined
): AttachmentCreateData[] {
  const list = attachments ?? []
  if (list.length > ATTACHMENTS_PER_POST) {
    throw new BadRequestException(`at most ${ATTACHMENTS_PER_POST} attachments per post`)
  }
  return list.map((a) => {
    if (!isImageDataUrl(a.dataUrl) || a.dataUrl.length > ATTACHMENT_MAX_DATAURL_CHARS) {
      throw new BadRequestException('attachment must be a png/jpeg/webp data URL within 2MB')
    }
    const byteSize = dataUrlByteSize(a.dataUrl)
    if (byteSize <= 0) {
      throw new BadRequestException('attachment payload is empty or malformed')
    }
    return {
      dataUrl: a.dataUrl,
      byteSize,
      width: a.width ?? null,
      height: a.height ?? null,
      uploaderId,
    }
  })
}

export function serializeAttachment(a: {
  id: string
  dataUrl: string
  width: number | null
  height: number | null
}) {
  return { id: a.id, dataUrl: a.dataUrl, width: a.width, height: a.height }
}
