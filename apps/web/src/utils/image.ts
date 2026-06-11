import {
  ATTACHMENT_MAX_DATAURL_CHARS,
  ATTACHMENT_MAX_EDGE_PX,
  ATTACHMENT_MAX_SOURCE_BYTES,
  type AttachmentInput,
} from '@promptmarket/shared'

export type AttachmentErrorCode = 'not-image' | 'too-large' | 'process-failed'

export class AttachmentError extends Error {
  readonly code: AttachmentErrorCode

  constructor(code: AttachmentErrorCode) {
    super(code)
    this.name = 'AttachmentError'
    this.code = code
  }
}

function loadImageElement(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new AttachmentError('process-failed'))
    }
    img.src = url
  })
}

async function loadSource(
  file: File
): Promise<{ source: CanvasImageSource; width: number; height: number }> {
  // createImageBitmap decodes off the main thread where supported.
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file)
      return { source: bitmap, width: bitmap.width, height: bitmap.height }
    } catch {
      /* some formats fall through to the <img> path */
    }
  }
  const img = await loadImageElement(file)
  return { source: img, width: img.naturalWidth, height: img.naturalHeight }
}

/**
 * Turn a user-picked screenshot into an upload-ready attachment:
 * 1. reject non-images and sources above the 2MB cap,
 * 2. downscale so the longest edge is ≤1600px,
 * 3. re-encode as WebP (JPEG fallback for engines that can't write WebP),
 * 4. enforce the encoded payload cap as a final guard.
 */
export async function prepareImageAttachment(file: File): Promise<AttachmentInput> {
  if (!file.type.startsWith('image/')) throw new AttachmentError('not-image')
  if (file.size > ATTACHMENT_MAX_SOURCE_BYTES) throw new AttachmentError('too-large')

  const { source, width, height } = await loadSource(file)
  if (!width || !height) throw new AttachmentError('process-failed')

  const scale = Math.min(1, ATTACHMENT_MAX_EDGE_PX / Math.max(width, height))
  const targetWidth = Math.max(1, Math.round(width * scale))
  const targetHeight = Math.max(1, Math.round(height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = targetWidth
  canvas.height = targetHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new AttachmentError('process-failed')
  ctx.drawImage(source, 0, 0, targetWidth, targetHeight)
  if ('close' in source && typeof source.close === 'function') source.close()

  // Safari historically returns PNG when asked for WebP — detect and fall back.
  let dataUrl = canvas.toDataURL('image/webp', 0.85)
  if (!dataUrl.startsWith('data:image/webp')) {
    dataUrl = canvas.toDataURL('image/jpeg', 0.85)
  }
  if (!dataUrl.startsWith('data:image/')) throw new AttachmentError('process-failed')
  if (dataUrl.length > ATTACHMENT_MAX_DATAURL_CHARS) throw new AttachmentError('too-large')

  return { dataUrl, width: targetWidth, height: targetHeight }
}
