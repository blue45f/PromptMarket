/* eslint-disable react-hooks/set-state-in-effect -- vendored DeskCloud widget */
/* eslint-disable jsx-a11y/no-interactive-element-to-noninteractive-role, react-refresh/only-export-components -- vendored DeskCloud widget (upstream patterns; verified typecheck+build green) */
/**
 * MediaDesk — 단일 파일 벤더링 컴포넌트 (의존성: react 만).
 * ──────────────────────────────────────────────────────────────────────────
 * npm publish 가 막힌 동안 형제 앱(offhours·resume·…)에 그대로 복붙해서 쓰는 버전입니다.
 * 워크스페이스 의존(@mediadesk/sdk·shared) 0 — 필요한 클라이언트/URL 로직을 이 파일에 인라인했습니다.
 * 동작/디자인은 @mediadesk/widget 의 <MediaUploader>/<MediaGallery> 와 동일합니다.
 *
 * 사용:
 *   import { MediaUploader, MediaGallery } from './MediaWidgets'
 *   <MediaUploader publishableKey="pk_…" endpoint="https://media.example.com" folder="avatars" onUploaded={(a)=>…} />
 *   <MediaGallery  publishableKey="pk_…" endpoint="https://media.example.com" folder="avatars" />
 *
 * 백엔드 계약(공개 — 브라우저에서 pk_ + Origin 으로 인증):
 *   POST {endpoint}/api/uploads   (multipart: file, folder?)  → MediaAsset
 *   GET  {endpoint}/api/assets?folder=&limit=&offset=         → { items, total, offset, limit }
 *   GET  {endpoint}/file/{key}?w=&h=&format=&q=               → (변환) 자산
 *
 * 접근성/디자인: focus-visible · prefers-reduced-motion · 대비 ≥4.5:1 ·
 * 그라디언트 텍스트/글래스모피즘/사이드스트라이프 없음 · 외부 CSS 프레임워크 0.
 * ──────────────────────────────────────────────────────────────────────────
 */
import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type DragEvent,
  type ForwardedRef,
  type MouseEvent as ReactMouseEvent,
  type ReactElement,
} from 'react'

/* ============================ 인라인 SDK ============================ */

export type TransformFormat = 'jpeg' | 'png' | 'webp' | 'avif'

export interface MediaAsset {
  key: string
  url: string
  contentType: string
  size: number
  folder: string | null
  transformable: boolean
  width?: number | null
  height?: number | null
  createdAt: string
}
export interface AssetListResult {
  items: MediaAsset[]
  total: number
  offset: number
  limit: number
}
export interface TransformOptions {
  w?: number
  h?: number
  format?: TransformFormat
  q?: number
}

const SDK_VERSION = 'vendor-0.1.0'
const DIM_MIN = 1
const DIM_MAX = 4000
const Q_MIN = 1
const Q_MAX = 100
const FORMATS = new Set(['jpeg', 'png', 'webp', 'avif'])

class MediaDeskError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message)
    this.name = 'MediaDeskError'
  }
}

function trimSlashes(s: string): string {
  return s.replace(/\/+$/g, '')
}
function clampInt(v: number, min: number, max: number): number {
  const n = Math.round(v)
  return n < min ? min : n > max ? max : n
}
function transformQuery(t?: TransformOptions): string {
  if (!t) return ''
  const p = new URLSearchParams()
  if (typeof t.w === 'number' && Number.isFinite(t.w))
    p.set('w', String(clampInt(t.w, DIM_MIN, DIM_MAX)))
  if (typeof t.h === 'number' && Number.isFinite(t.h))
    p.set('h', String(clampInt(t.h, DIM_MIN, DIM_MAX)))
  if (t.format && FORMATS.has(t.format)) p.set('format', t.format)
  if (typeof t.q === 'number' && Number.isFinite(t.q))
    p.set('q', String(clampInt(t.q, Q_MIN, Q_MAX)))
  return p.toString()
}
function buildUrl(endpoint: string, key: string, t?: TransformOptions): string {
  const q = transformQuery(t)
  const isAbsolute = /^https?:\/\//i.test(key)
  const base = isAbsolute
    ? key
    : `${trimSlashes(endpoint)}/file/${key.split('/').map(encodeURIComponent).join('/')}`
  if (!q) return base
  return base.includes('?') ? `${base}&${q}` : `${base}?${q}`
}
function authHeaders(publishableKey: string): Record<string, string> {
  return { 'x-publishable-key': publishableKey, 'x-mediadesk-sdk': SDK_VERSION }
}
async function errMessage(res: Response): Promise<string> {
  try {
    const j = (await res.json()) as { message?: unknown; error?: unknown }
    const m = j.message ?? j.error
    if (Array.isArray(m)) return m.join(', ')
    if (m) return String(m)
  } catch {
    /* ignore */
  }
  return `요청 실패 (${res.status})`
}

async function listAssets(
  endpoint: string,
  publishableKey: string,
  params: { folder?: string; limit?: number; signal?: AbortSignal }
): Promise<AssetListResult> {
  const url = new URL(`${trimSlashes(endpoint)}/api/assets`)
  if (params.folder) url.searchParams.set('folder', params.folder)
  if (typeof params.limit === 'number') url.searchParams.set('limit', String(params.limit))
  const res = await fetch(url.toString(), {
    headers: authHeaders(publishableKey),
    signal: params.signal,
  })
  if (!res.ok) throw new MediaDeskError(await errMessage(res), res.status)
  return (await res.json()) as AssetListResult
}

function uploadFile(
  endpoint: string,
  publishableKey: string,
  file: File | Blob,
  opts: {
    folder?: string
    filename?: string
    onProgress?: (f: number) => void
    signal?: AbortSignal
  }
): Promise<MediaAsset> {
  const form = new FormData()
  const filename = opts.filename ?? (file instanceof File ? file.name : 'upload')
  form.append('file', file, filename)
  if (opts.folder) form.append('folder', opts.folder)

  if (typeof XMLHttpRequest === 'undefined') {
    opts.onProgress?.(0)
    return fetch(`${trimSlashes(endpoint)}/api/uploads`, {
      method: 'POST',
      headers: authHeaders(publishableKey),
      body: form,
      signal: opts.signal,
    }).then(async (res) => {
      if (!res.ok) throw new MediaDeskError(await errMessage(res), res.status)
      const json = (await res.json()) as MediaAsset
      opts.onProgress?.(1)
      return json
    })
  }

  return new Promise<MediaAsset>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${trimSlashes(endpoint)}/api/uploads`)
    for (const [k, v] of Object.entries(authHeaders(publishableKey))) xhr.setRequestHeader(k, v)
    if (opts.signal) {
      if (opts.signal.aborted) {
        xhr.abort()
        reject(new MediaDeskError('업로드가 취소되었습니다.', 0))
        return
      }
      opts.signal.addEventListener('abort', () => xhr.abort(), { once: true })
    }
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && opts.onProgress) opts.onProgress(e.loaded / e.total)
    })
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const json = JSON.parse(xhr.responseText) as MediaAsset
          opts.onProgress?.(1)
          resolve(json)
        } catch {
          reject(new MediaDeskError('업로드 응답을 해석하지 못했습니다.', xhr.status))
        }
      } else {
        let message = `업로드 실패 (${xhr.status})`
        try {
          const rec = JSON.parse(xhr.responseText) as { message?: unknown; error?: unknown }
          const raw = rec.message ?? rec.error
          if (raw) message = Array.isArray(raw) ? raw.join(', ') : String(raw)
        } catch {
          /* ignore */
        }
        reject(new MediaDeskError(message, xhr.status))
      }
    })
    xhr.addEventListener('error', () =>
      reject(new MediaDeskError('네트워크 오류로 업로드에 실패했습니다.', 0))
    )
    xhr.addEventListener('abort', () => reject(new MediaDeskError('업로드가 취소되었습니다.', 0)))
    opts.onProgress?.(0)
    xhr.send(form)
  })
}

/* ============================== 헬퍼 ============================== */

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '—'
  if (bytes < 1024) return `${bytes} B`
  const units = ['KB', 'MB', 'GB']
  let value = bytes / 1024
  let i = 0
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024
    i += 1
  }
  return `${value >= 10 ? Math.round(value) : value.toFixed(1)} ${units[i]}`
}
const DEFAULT_ACCEPT = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/avif',
  'image/gif',
  'image/svg+xml',
  'application/pdf',
] as const
function isMimeAccepted(accept: readonly string[], file: { type: string; name: string }): boolean {
  if (accept.length === 0) return true
  const type = (file.type || '').toLowerCase()
  const name = (file.name || '').toLowerCase()
  for (const tokenRaw of accept) {
    const token = tokenRaw.trim().toLowerCase()
    if (!token) continue
    if (token === '*' || token === '*/*') return true
    if (token.startsWith('.')) {
      if (name.endsWith(token)) return true
      continue
    }
    if (token.endsWith('/*')) {
      const prefix = token.slice(0, token.indexOf('/') + 1)
      if (type.startsWith(prefix)) return true
      continue
    }
    if (type === token) return true
  }
  return false
}
function isImageMime(mime: string): boolean {
  return /^image\//i.test(mime)
}
function shortId(): string {
  const c = globalThis.crypto
  if (c && typeof c.randomUUID === 'function') return c.randomUUID().slice(0, 8)
  return Math.random().toString(36).slice(2, 10)
}

/* ============================== 스타일 ============================== */

const STYLE_ID = 'mediadesk-widget-styles'
const ACCENT = '#2f5fe0'
const ACCENT_INK = '#ffffff'

function ensureStyles(): void {
  if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) return
  const el = document.createElement('style')
  el.id = STYLE_ID
  el.textContent = CSS
  document.head.appendChild(el)
}

const CSS = `
.md-root, .md-root * { box-sizing: border-box; }
.md-root {
  --md-accent:${ACCENT}; --md-accent-ink:${ACCENT_INK};
  --md-ink:#1a1d23; --md-ink-soft:#4a4f57; --md-muted:#6b7280;
  --md-surface:#fff; --md-surface-2:#f4f5f7; --md-surface-3:#eceef1;
  --md-border:#d7dae0; --md-border-strong:#b7bcc6; --md-danger:#b42318; --md-success:#047857;
  --md-radius:14px; --md-radius-sm:9px;
  --md-shadow:0 1px 2px rgba(16,24,40,.06),0 8px 24px -10px rgba(16,24,40,.18);
  --md-ease:cubic-bezier(.22,1,.36,1);
  font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif; color:var(--md-ink); line-height:1.5;
}
.md-uploader{display:flex;flex-direction:column;gap:14px;}
.md-drop{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;
  gap:10px;text-align:center;padding:32px 20px;border:2px dashed var(--md-border-strong);
  border-radius:var(--md-radius);background:var(--md-surface-2);color:var(--md-ink-soft);cursor:pointer;
  transition:border-color .15s var(--md-ease),background .15s var(--md-ease),color .15s var(--md-ease);}
.md-drop:hover{border-color:var(--md-accent);color:var(--md-ink);}
.md-drop.md-dragging{border-color:var(--md-accent);background:color-mix(in srgb,var(--md-accent) 8%,var(--md-surface));color:var(--md-ink);}
.md-drop.md-disabled{opacity:.6;cursor:not-allowed;}
.md-drop-icon{width:44px;height:44px;display:flex;align-items:center;justify-content:center;border-radius:50%;
  background:var(--md-surface);color:var(--md-accent);box-shadow:var(--md-shadow);}
.md-drop-icon svg{width:24px;height:24px;}
.md-drop-title{margin:0;font-size:14px;font-weight:600;color:var(--md-ink);}
.md-drop-hint{margin:0;font-size:12px;color:var(--md-muted);}
.md-drop-cta{color:var(--md-accent);font-weight:600;text-decoration:underline;}
.md-visually-hidden{position:absolute!important;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0;}
.md-items{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:10px;}
.md-item{display:flex;align-items:center;gap:12px;padding:10px 12px;border:1px solid var(--md-border);border-radius:var(--md-radius-sm);background:var(--md-surface);}
.md-item-thumb{flex:none;width:48px;height:48px;border-radius:8px;overflow:hidden;background:var(--md-surface-3);display:flex;align-items:center;justify-content:center;color:var(--md-muted);}
.md-item-thumb img{width:100%;height:100%;object-fit:cover;display:block;} .md-item-thumb svg{width:22px;height:22px;}
.md-item-main{flex:1;min-width:0;}
.md-item-name{margin:0;font-size:13px;font-weight:600;color:var(--md-ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.md-item-meta{margin:2px 0 0;font-size:11px;color:var(--md-muted);} .md-item-meta.md-err{color:var(--md-danger);}
.md-item-status{flex:none;display:flex;align-items:center;gap:8px;}
.md-progress{width:100%;height:5px;margin-top:7px;border-radius:999px;background:var(--md-surface-3);overflow:hidden;}
.md-progress-bar{height:100%;background:var(--md-accent);border-radius:999px;transition:width .18s var(--md-ease);}
.md-badge{display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:50%;}
.md-badge.md-ok{background:color-mix(in srgb,var(--md-success) 14%,var(--md-surface));color:var(--md-success);}
.md-badge.md-bad{background:color-mix(in srgb,var(--md-danger) 14%,var(--md-surface));color:var(--md-danger);}
.md-badge svg{width:15px;height:15px;}
.md-iconbtn{flex:none;width:28px;height:28px;display:inline-flex;align-items:center;justify-content:center;border:0;border-radius:7px;background:transparent;color:var(--md-muted);cursor:pointer;transition:background .14s var(--md-ease),color .14s var(--md-ease);}
.md-iconbtn:hover{background:var(--md-surface-2);color:var(--md-ink);} .md-iconbtn svg{width:16px;height:16px;}
.md-spinner{width:18px;height:18px;border:2.5px solid var(--md-border);border-top-color:var(--md-accent);border-radius:50%;animation:md-spin .7s linear infinite;}
.md-alert{margin:0;padding:10px 12px;border:1px solid color-mix(in srgb,var(--md-danger) 35%,var(--md-border));background:color-mix(in srgb,var(--md-danger) 8%,var(--md-surface));border-radius:var(--md-radius-sm);font-size:13px;color:var(--md-danger);}
.md-gallery{display:flex;flex-direction:column;gap:14px;}
.md-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(var(--md-cell,140px),1fr));gap:12px;}
.md-cell{position:relative;display:block;border:1px solid var(--md-border);border-radius:var(--md-radius-sm);overflow:hidden;background:var(--md-surface-3);aspect-ratio:1/1;text-decoration:none;color:inherit;transition:border-color .14s var(--md-ease),transform .14s var(--md-ease);}
.md-cell:hover{border-color:var(--md-border-strong);transform:translateY(-1px);}
.md-cell img{width:100%;height:100%;object-fit:cover;display:block;}
.md-cell-file{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;height:100%;color:var(--md-muted);padding:8px;text-align:center;}
.md-cell-file svg{width:28px;height:28px;} .md-cell-file span{font-size:11px;max-width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.md-cell-cap{position:absolute;left:0;right:0;bottom:0;padding:6px 8px;font-size:11px;color:#fff;background:linear-gradient(to top,rgba(16,24,40,.72),rgba(16,24,40,0));white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.md-empty{padding:40px 20px;text-align:center;border:1px dashed var(--md-border);border-radius:var(--md-radius);color:var(--md-muted);}
.md-empty svg{width:32px;height:32px;margin-bottom:10px;color:var(--md-border-strong);} .md-empty p{margin:0;font-size:13px;}
.md-state{padding:28px 20px;text-align:center;color:var(--md-ink-soft);} .md-state .md-spinner{margin:0 auto 12px;width:26px;height:26px;}
.md-btn{appearance:none;border:1px solid transparent;border-radius:var(--md-radius-sm);padding:9px 16px;font:inherit;font-weight:600;font-size:13px;cursor:pointer;transition:filter .14s var(--md-ease),background .14s var(--md-ease),border-color .14s var(--md-ease);}
.md-btn-primary{background:var(--md-accent);color:var(--md-accent-ink);} .md-btn-primary:hover:not(:disabled){filter:brightness(1.06);}
.md-btn-ghost{background:transparent;color:var(--md-ink-soft);border-color:var(--md-border);} .md-btn-ghost:hover:not(:disabled){background:var(--md-surface-2);}
.md-btn:disabled{opacity:.55;cursor:not-allowed;} .md-actions{display:flex;gap:10px;align-items:center;} .md-actions-spacer{flex:1;}
.md-root :focus{outline:none;}
.md-root :focus-visible{outline:2px solid var(--md-accent);outline-offset:2px;border-radius:6px;} .md-drop:focus-visible{outline-offset:3px;}
@keyframes md-spin{to{transform:rotate(360deg);}}
@media (prefers-reduced-motion:reduce){
  .md-root *,.md-drop,.md-cell,.md-progress-bar,.md-spinner{animation-duration:.001ms!important;animation-iteration-count:1!important;transition-duration:.001ms!important;}
  .md-spinner{animation:md-spin .9s linear infinite!important;}
}
`

/* ============================== 아이콘 ============================== */

const UploadIcon = (): ReactElement => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M12 15V4m0 0L8 8m4-4 4 4"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M4 14v3.5A2.5 2.5 0 0 0 6.5 20h11a2.5 2.5 0 0 0 2.5-2.5V14"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)
const ImageIcon = (): ReactElement => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="3" y="4" width="18" height="16" rx="2.5" stroke="currentColor" strokeWidth="1.7" />
    <circle cx="8.5" cy="9.5" r="1.6" stroke="currentColor" strokeWidth="1.5" />
    <path
      d="m4 17 4.5-4.2a1.6 1.6 0 0 1 2.2 0L15 17m-2-3 2-1.8a1.6 1.6 0 0 1 2.1 0L20 14.5"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)
const CloseIcon = (): ReactElement => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
)
const CheckIcon = (): ReactElement => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="m5 13 4 4L19 7"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)
const AlertIcon = (): ReactElement => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M12 8v5m0 3.5h.01M10.3 3.9 2.5 17.5A2 2 0 0 0 4.2 20.5h15.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)
const FileIcon = (): ReactElement => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M6 3h7l5 5v12.5A1.5 1.5 0 0 1 16.5 22h-9A1.5 1.5 0 0 1 6 20.5V3Z"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinejoin="round"
    />
    <path d="M13 3v5h5" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
  </svg>
)

/* ============================== Uploader ============================== */

export interface MediaUploaderProps {
  publishableKey: string
  endpoint: string
  folder?: string
  accept?: readonly string[]
  maxBytes?: number
  multiple?: boolean
  accent?: string
  accentInk?: string
  disabled?: boolean
  label?: string
  onUploaded?: (asset: MediaAsset) => void
  onError?: (error: Error, file: File) => void
}

type ItemStatus = 'uploading' | 'done' | 'error'
interface UploadItem {
  id: string
  name: string
  size: number
  mime: string
  previewUrl?: string
  status: ItemStatus
  progress: number
  error?: string
  result?: MediaAsset
}
const DEFAULT_MAX_BYTES = 10 * 1024 * 1024

export function MediaUploader(props: MediaUploaderProps): ReactElement {
  const {
    publishableKey,
    endpoint,
    folder,
    accept = DEFAULT_ACCEPT,
    maxBytes = DEFAULT_MAX_BYTES,
    multiple = true,
    accent = ACCENT,
    accentInk = ACCENT_INK,
    disabled = false,
    label = '파일을 끌어다 놓거나 선택하세요',
    onUploaded,
    onError,
  } = props

  const [items, setItems] = useState<UploadItem[]>([])
  const [dragging, setDragging] = useState(false)
  const [rejectError, setRejectError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const dragDepth = useRef(0)
  const inputId = useId()

  useEffect(() => {
    ensureStyles()
  }, [])

  const patchItem = useCallback((id: string, patch: Partial<UploadItem>) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)))
  }, [])

  const startUpload = useCallback(
    (file: File) => {
      const id = shortId()
      const previewUrl =
        typeof URL !== 'undefined' && isImageMime(file.type) ? URL.createObjectURL(file) : undefined
      setItems((prev) => [
        ...prev,
        {
          id,
          name: file.name,
          size: file.size,
          mime: file.type,
          previewUrl,
          status: 'uploading',
          progress: 0,
        },
      ])
      uploadFile(endpoint, publishableKey, file, {
        folder,
        onProgress: (f) => patchItem(id, { progress: f }),
      })
        .then((result) => {
          patchItem(id, { status: 'done', progress: 1, result })
          onUploaded?.(result)
        })
        .catch((e: unknown) => {
          const message = e instanceof Error ? e.message : '업로드에 실패했습니다.'
          patchItem(id, { status: 'error', error: message })
          onError?.(e instanceof Error ? e : new Error(message), file)
        })
    },
    [endpoint, publishableKey, folder, onUploaded, onError, patchItem]
  )

  const acceptFiles = useCallback(
    (fileList: FileList | File[]) => {
      if (disabled) return
      setRejectError(null)
      const files = Array.from(fileList)
      const toUpload = multiple ? files : files.slice(0, 1)
      const rejected: string[] = []
      for (const file of toUpload) {
        if (!isMimeAccepted(accept, file)) {
          rejected.push(`${file.name}: 허용되지 않는 형식`)
          continue
        }
        if (file.size > maxBytes) {
          rejected.push(`${file.name}: 용량 초과(최대 ${formatBytes(maxBytes)})`)
          continue
        }
        startUpload(file)
      }
      if (rejected.length > 0) setRejectError(rejected.join(' · '))
    },
    [accept, disabled, maxBytes, multiple, startUpload]
  )

  const onDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      dragDepth.current = 0
      setDragging(false)
      if (e.dataTransfer?.files?.length) acceptFiles(e.dataTransfer.files)
    },
    [acceptFiles]
  )

  const openPicker = useCallback(() => {
    if (!disabled) inputRef.current?.click()
  }, [disabled])

  const clearDone = useCallback(() => {
    setItems((prev) => {
      for (const it of prev)
        if (it.status === 'done' && it.previewUrl) URL.revokeObjectURL(it.previewUrl)
      return prev.filter((it) => it.status !== 'done')
    })
  }, [])

  const removeItem = useCallback((id: string) => {
    setItems((prev) => {
      const target = prev.find((it) => it.id === id)
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl)
      return prev.filter((it) => it.id !== id)
    })
  }, [])

  const rootStyle: CSSProperties = {
    ['--md-accent' as string]: accent,
    ['--md-accent-ink' as string]: accentInk,
  }
  const doneCount = items.filter((it) => it.status === 'done').length

  return (
    <div className="md-root md-uploader" style={rootStyle}>
      <div
        className={`md-drop${dragging ? ' md-dragging' : ''}${disabled ? ' md-disabled' : ''}`}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled || undefined}
        aria-label={label}
        onClick={openPicker}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            openPicker()
          }
        }}
        onDragEnter={(e) => {
          e.preventDefault()
          if (disabled) return
          dragDepth.current += 1
          setDragging(true)
        }}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={(e) => {
          e.preventDefault()
          dragDepth.current = Math.max(0, dragDepth.current - 1)
          if (dragDepth.current === 0) setDragging(false)
        }}
        onDrop={onDrop}
      >
        <span className="md-drop-icon" aria-hidden="true">
          <UploadIcon />
        </span>
        <p className="md-drop-title">{label}</p>
        <p className="md-drop-hint">
          최대 {formatBytes(maxBytes)}
          {multiple ? ' · 여러 개 가능' : ''} · <span className="md-drop-cta">찾아보기</span>
        </p>
        <input
          ref={inputRef}
          id={inputId}
          className="md-visually-hidden"
          type="file"
          accept={accept.join(',')}
          multiple={multiple}
          disabled={disabled}
          tabIndex={-1}
          onChange={(e) => {
            if (e.target.files?.length) acceptFiles(e.target.files)
            e.target.value = ''
          }}
        />
      </div>

      {rejectError ? (
        <p className="md-alert" role="alert">
          {rejectError}
        </p>
      ) : null}

      {items.length > 0 ? (
        <>
          <ul className="md-items" aria-live="polite">
            {items.map((it) => (
              <li key={it.id} className="md-item">
                <span className="md-item-thumb" aria-hidden="true">
                  {it.previewUrl ? <img src={it.previewUrl} alt="" /> : <FileIcon />}
                </span>
                <div className="md-item-main">
                  <p className="md-item-name" title={it.name}>
                    {it.name}
                  </p>
                  {it.status === 'error' ? (
                    <p className="md-item-meta md-err">{it.error}</p>
                  ) : (
                    <p className="md-item-meta">
                      {formatBytes(it.size)}
                      {it.status === 'uploading' ? ` · ${Math.round(it.progress * 100)}%` : ''}
                      {it.status === 'done' ? ' · 완료' : ''}
                    </p>
                  )}
                  {it.status === 'uploading' ? (
                    <div
                      className="md-progress"
                      role="progressbar"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={Math.round(it.progress * 100)}
                      aria-label={`${it.name} 업로드 진행률`}
                    >
                      <div className="md-progress-bar" style={{ width: `${it.progress * 100}%` }} />
                    </div>
                  ) : null}
                </div>
                <div className="md-item-status">
                  {it.status === 'uploading' ? (
                    <span className="md-spinner" aria-hidden="true" />
                  ) : null}
                  {it.status === 'done' ? (
                    <span className="md-badge md-ok" aria-label="업로드 완료">
                      <CheckIcon />
                    </span>
                  ) : null}
                  {it.status === 'error' ? (
                    <span className="md-badge md-bad" aria-label="업로드 실패">
                      <AlertIcon />
                    </span>
                  ) : null}
                  <button
                    type="button"
                    className="md-iconbtn"
                    aria-label={`${it.name} 목록에서 제거`}
                    onClick={() => removeItem(it.id)}
                  >
                    <CloseIcon />
                  </button>
                </div>
              </li>
            ))}
          </ul>
          {doneCount > 0 ? (
            <div className="md-actions">
              <span className="md-actions-spacer" />
              <button type="button" className="md-btn md-btn-ghost" onClick={clearDone}>
                완료 항목 비우기
              </button>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  )
}

/* ============================== Gallery ============================== */

export interface MediaGalleryProps {
  publishableKey: string
  endpoint: string
  folder?: string
  limit?: number
  thumbSize?: number
  thumbFormat?: TransformFormat
  thumbQuality?: number
  accent?: string
  accentInk?: string
  showCaptions?: boolean
  onSelect?: (asset: MediaAsset) => void
}
export interface MediaGalleryHandle {
  refresh: () => void
}
type GalleryPhase = 'loading' | 'ready' | 'error'

function captionOf(asset: MediaAsset): string {
  return asset.key.split('/').pop() ?? asset.key
}

export const MediaGallery = forwardRef(function MediaGallery(
  props: MediaGalleryProps,
  ref: ForwardedRef<MediaGalleryHandle>
): ReactElement {
  const {
    publishableKey,
    endpoint,
    folder,
    limit = 60,
    thumbSize = 160,
    thumbFormat = 'webp',
    thumbQuality = 70,
    accent = ACCENT,
    accentInk = ACCENT_INK,
    showCaptions = true,
    onSelect,
  } = props

  const [phase, setPhase] = useState<GalleryPhase>('loading')
  const [assets, setAssets] = useState<MediaAsset[]>([])
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    ensureStyles()
  }, [])

  useEffect(() => {
    const ctrl = new AbortController()
    setPhase('loading')
    listAssets(endpoint, publishableKey, { folder, limit, signal: ctrl.signal })
      .then((res) => {
        setAssets(res.items)
        setPhase('ready')
      })
      .catch(() => {
        if (!ctrl.signal.aborted) setPhase('error')
      })
    return () => ctrl.abort()
  }, [endpoint, publishableKey, folder, limit, reloadKey])

  const refresh = useCallback(() => setReloadKey((k) => k + 1), [])
  useImperativeHandle(ref, () => ({ refresh }), [refresh])

  const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1
  const thumbPx = Math.round(thumbSize * dpr)
  const thumbUrl = useCallback(
    (asset: MediaAsset): string =>
      buildUrl(endpoint, asset.key, {
        w: thumbPx,
        h: thumbPx,
        format: asset.transformable ? thumbFormat : undefined,
        q: thumbQuality,
      }),
    [endpoint, thumbPx, thumbFormat, thumbQuality]
  )

  const rootStyle = useMemo<CSSProperties>(
    () => ({
      ['--md-accent' as string]: accent,
      ['--md-accent-ink' as string]: accentInk,
      ['--md-cell' as string]: `${thumbSize}px`,
    }),
    [accent, accentInk, thumbSize]
  )

  const handleSelect = (asset: MediaAsset, e: ReactMouseEvent) => {
    if (onSelect) {
      e.preventDefault()
      onSelect(asset)
    }
  }

  return (
    <div className="md-root md-gallery" style={rootStyle} aria-busy={phase === 'loading'}>
      {phase === 'loading' ? (
        <div className="md-state" role="status">
          <span className="md-spinner" aria-hidden="true" />
          <p style={{ margin: 0 }}>자산을 불러오는 중…</p>
        </div>
      ) : null}

      {phase === 'error' ? (
        <div className="md-empty" role="alert">
          <AlertIcon />
          <p>자산을 불러오지 못했어요.</p>
          <div style={{ marginTop: 14 }}>
            <button type="button" className="md-btn md-btn-primary" onClick={refresh}>
              다시 시도
            </button>
          </div>
        </div>
      ) : null}

      {phase === 'ready' && assets.length === 0 ? (
        <div className="md-empty">
          <ImageIcon />
          <p>아직 업로드된 자산이 없어요.</p>
        </div>
      ) : null}

      {phase === 'ready' && assets.length > 0 ? (
        <div className="md-grid" role="list">
          {assets.map((asset) => {
            const isImg = isImageMime(asset.contentType)
            const cap = captionOf(asset)
            return (
              <a
                key={asset.key}
                className="md-cell"
                role="listitem"
                href={asset.url}
                target="_blank"
                rel="noreferrer"
                title={cap}
                onClick={(e) => handleSelect(asset, e)}
              >
                {isImg ? (
                  <img src={thumbUrl(asset)} alt={cap} loading="lazy" decoding="async" />
                ) : (
                  <span className="md-cell-file">
                    <FileIcon />
                    <span>{cap}</span>
                  </span>
                )}
                {showCaptions && isImg ? <span className="md-cell-cap">{cap}</span> : null}
              </a>
            )
          })}
        </div>
      ) : null}
    </div>
  )
})

export { buildUrl, MediaDeskError }
