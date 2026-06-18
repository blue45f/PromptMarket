/* eslint-disable react-hooks/set-state-in-effect, jsx-a11y/interactive-supports-focus -- vendored DeskCloud widget */

/**
 * ReviewDesk — 단일 파일 벤더링 컴포넌트 (의존성: react 만).
 * ──────────────────────────────────────────────────────────────────────────
 * npm publish 가 막힌 동안 외부 사이트/형제 앱에 그대로 복붙해서 쓰는 버전입니다.
 * 워크스페이스 의존(@reviewdesk/shared) 0 — 필요한 상수·집계·검증 로직을 이 파일에 인라인.
 * 동작/디자인은 @reviewdesk/widget 의 4개 컴포넌트와 동일합니다.
 *
 * 사용:
 *   import { ReviewStars, ReviewList, ReviewForm, TestimonialWall } from './ReviewWidgets'
 *
 *   const cfg = { publishableKey: 'pk_live_xxx', endpoint: 'https://reviews.example.com' }
 *   <ReviewStars {...cfg} subjectId="pro-plan" />
 *   <ReviewList {...cfg} subjectId="pro-plan" />
 *   <ReviewForm {...cfg} subjectId="pro-plan" subjectLabel="Pro 플랜" />
 *   <TestimonialWall {...cfg} />
 *
 * 인증: publishable 키(pk_...)는 브라우저 노출 안전(제출 + 승인본 읽기). secret 키는 넣지 마세요.
 *
 * 백엔드 계약(공개·publishable):
 *   GET  {endpoint}/api/reviews/aggregate?subjectId=...   → ReviewAggregate
 *   GET  {endpoint}/api/reviews?subjectId=...&limit=...    → PublicReviewsDto
 *   GET  {endpoint}/api/reviews/wall?limit=...             → ReviewWallDto
 *   POST {endpoint}/api/reviews                            → ReviewReceiptDto (201)
 *
 * 접근성/디자인: focus-visible · prefers-reduced-motion · roving star radios ·
 * 대비 ≥4.5:1 · 그라디언트 텍스트/글래스모피즘 없음 · 외부 CSS 프레임워크 0.
 * ──────────────────────────────────────────────────────────────────────────
 */
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
} from 'react'

/* ============================ 공유 계약(인라인) ============================ */

const RATING_MIN = 1
const RATING_MAX = 5
const REVIEW_BODY_MAX = 4000
const REVIEW_TITLE_MAX = 200
const REVIEW_AUTHOR_MAX = 120
const SUBJECT_ID_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

interface ReviewAggregate {
  count: number
  avgRating: number | null
  distribution: Record<string, number>
  satisfaction: number | null
}

interface PublicReviewDto {
  id: string
  subjectId: string
  subjectLabel: string | null
  rating: number
  title: string | null
  body: string
  authorName: string
  featured: boolean
  reply: string | null
  createdAt: string
}

interface PublicReviewsDto {
  subjectId: string
  items: PublicReviewDto[]
  aggregate: ReviewAggregate
}

interface ReviewWallDto {
  items: PublicReviewDto[]
}

interface ReviewReceiptDto {
  id: string
  subjectId: string
  status: string
  createdAt: string
}

interface SubmitReviewInput {
  subjectId: string
  subjectLabel?: string
  rating: number
  title?: string
  body: string
  authorName: string
  authorEmail?: string
  source?: string
  meta?: { pageUrl?: string; referrer?: string; userAgent?: string }
}

/** 이메일 형식 약식 검사(서버가 zod 로 2차 검증). */
function isEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
}

/* ============================ 클라이언트(인라인) ============================ */

class ReviewDeskError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message)
    this.name = 'ReviewDeskError'
  }
}

interface ClientOptions {
  publishableKey: string
  endpoint: string
  fetch?: typeof fetch
}

interface ReviewDeskClient {
  getAggregate(subjectId: string, signal?: AbortSignal): Promise<ReviewAggregate>
  getReviews(subjectId: string, limit?: number, signal?: AbortSignal): Promise<PublicReviewsDto>
  getWall(limit?: number, signal?: AbortSignal): Promise<ReviewWallDto>
  submitReview(input: SubmitReviewInput, signal?: AbortSignal): Promise<ReviewReceiptDto>
}

function createClient(options: ClientOptions): ReviewDeskClient {
  const base = options.endpoint.replace(/\/+$/, '')
  const doFetch = options.fetch ?? globalThis.fetch
  const headers = (json: boolean): Record<string, string> => {
    const h: Record<string, string> = {
      'x-pk': options.publishableKey,
      'x-reviewdesk-widget': 'vendor-0.1.0',
    }
    if (json) h['content-type'] = 'application/json'
    return h
  }
  async function parse<T>(res: Response): Promise<T> {
    const text = await res.text()
    const json: unknown = text ? JSON.parse(text) : null
    if (!res.ok) {
      const rec = (json ?? {}) as Record<string, unknown>
      const raw = rec.message ?? rec.error ?? `ReviewDesk 요청 실패 (${res.status})`
      throw new ReviewDeskError(Array.isArray(raw) ? raw.join(', ') : String(raw), res.status)
    }
    return json as T
  }
  const qs = (params: Record<string, string | number | undefined>): string => {
    const s = new URLSearchParams()
    for (const [k, v] of Object.entries(params))
      if (v !== undefined && v !== '') s.set(k, String(v))
    const str = s.toString()
    return str ? `?${str}` : ''
  }
  return {
    async getAggregate(subjectId, signal) {
      return parse(
        await doFetch(`${base}/api/reviews/aggregate${qs({ subjectId })}`, {
          headers: headers(false),
          signal,
        })
      )
    },
    async getReviews(subjectId, limit, signal) {
      return parse(
        await doFetch(`${base}/api/reviews${qs({ subjectId, limit })}`, {
          headers: headers(false),
          signal,
        })
      )
    },
    async getWall(limit, signal) {
      return parse(
        await doFetch(`${base}/api/reviews/wall${qs({ limit })}`, {
          headers: headers(false),
          signal,
        })
      )
    },
    async submitReview(input, signal) {
      return parse(
        await doFetch(`${base}/api/reviews`, {
          method: 'POST',
          headers: headers(true),
          body: JSON.stringify(input),
          signal,
        })
      )
    },
  }
}

/* ================================ 스타일 ================================ */

const STYLE_ID = 'reviewdesk-widget-styles'
const DEFAULT_ACCENT = '#2f5fe0'
const DEFAULT_ACCENT_INK = '#ffffff'

const WIDGET_CSS = `
.rd-root, .rd-root * { box-sizing: border-box; }
.rd-root {
  --rd-accent: ${DEFAULT_ACCENT}; --rd-accent-ink: ${DEFAULT_ACCENT_INK}; --rd-star: #e0a93f;
  --rd-ink: #1a1d23; --rd-ink-soft: #4a4f57; --rd-muted: #6b7280; --rd-surface: #ffffff;
  --rd-surface-2: #f4f5f7; --rd-border: #d7dae0; --rd-border-strong: #b7bcc6; --rd-track: #e7e9ee;
  --rd-danger: #b42318; --rd-success: #047857; --rd-radius: 14px; --rd-radius-sm: 9px;
  --rd-shadow: 0 1px 2px rgba(16,24,40,.06), 0 6px 18px -8px rgba(16,24,40,.16);
  --rd-ease: cubic-bezier(.22,1,.36,1);
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  color: var(--rd-ink); line-height: 1.5; text-align: left;
}
.rd-stars { display: inline-flex; gap: 2px; color: var(--rd-star); line-height: 0; }
.rd-stars svg { width: 1em; height: 1em; display: block; }
.rd-stars.rd-sm { font-size: 15px; } .rd-stars.rd-md { font-size: 19px; } .rd-stars.rd-lg { font-size: 26px; }
.rd-star-empty { color: var(--rd-border-strong); }
.rd-badge { display: inline-flex; align-items: center; gap: 8px; vertical-align: middle; }
.rd-badge-num { font-weight: 700; font-size: 15px; color: var(--rd-ink); font-variant-numeric: tabular-nums; }
.rd-badge-count { font-size: 13px; color: var(--rd-muted); }
.rd-badge-count a { color: inherit; text-decoration: underline; text-underline-offset: 2px; }
.rd-badge-empty { font-size: 13px; color: var(--rd-muted); }
.rd-card { border: 1px solid var(--rd-border); border-radius: var(--rd-radius); background: var(--rd-surface); box-shadow: var(--rd-shadow); overflow: hidden; }
.rd-list { width: 100%; }
.rd-summary { display: flex; flex-wrap: wrap; align-items: center; gap: 16px 28px; padding: 20px; border-bottom: 1px solid var(--rd-border); }
.rd-summary-score { display: flex; flex-direction: column; gap: 4px; }
.rd-score-num { font-size: 38px; font-weight: 800; letter-spacing: -0.02em; line-height: 1; font-variant-numeric: tabular-nums; }
.rd-score-meta { font-size: 13px; color: var(--rd-muted); }
.rd-dist { flex: 1; min-width: 200px; display: flex; flex-direction: column; gap: 6px; }
.rd-dist-row { display: flex; align-items: center; gap: 10px; font-size: 12px; color: var(--rd-ink-soft); }
.rd-dist-star { width: 34px; flex: none; display: inline-flex; align-items: center; gap: 3px; color: var(--rd-ink-soft); font-variant-numeric: tabular-nums; }
.rd-dist-star svg { width: 12px; height: 12px; color: var(--rd-star); }
.rd-dist-track { flex: 1; height: 8px; border-radius: 999px; background: var(--rd-track); overflow: hidden; }
.rd-dist-fill { height: 100%; border-radius: 999px; background: var(--rd-star); transition: width .4s var(--rd-ease); }
.rd-dist-n { width: 34px; flex: none; text-align: right; color: var(--rd-muted); font-variant-numeric: tabular-nums; }
.rd-items { list-style: none; margin: 0; padding: 0; }
.rd-item { padding: 18px 20px; border-bottom: 1px solid var(--rd-border); }
.rd-item:last-child { border-bottom: 0; }
.rd-item-head { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; flex-wrap: wrap; }
.rd-avatar { width: 34px; height: 34px; flex: none; border-radius: 50%; background: var(--rd-surface-2); color: var(--rd-ink-soft); display: inline-flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; }
.rd-item-meta { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.rd-item-author { font-weight: 600; font-size: 14px; }
.rd-item-date { font-size: 12px; color: var(--rd-muted); }
.rd-item-head .rd-stars { margin-left: auto; }
.rd-featured-tag { font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 999px; background: color-mix(in srgb, var(--rd-star) 18%, var(--rd-surface)); color: #7a5a12; }
.rd-item-title { margin: 0 0 4px; font-size: 15px; font-weight: 700; }
.rd-item-body { margin: 0; font-size: 14px; color: var(--rd-ink-soft); white-space: pre-wrap; word-break: break-word; }
.rd-reply { margin: 12px 0 0; padding: 10px 12px; border-left: 3px solid var(--rd-border-strong); background: var(--rd-surface-2); border-radius: 0 var(--rd-radius-sm) var(--rd-radius-sm) 0; }
.rd-reply-label { font-size: 11px; font-weight: 700; color: var(--rd-muted); text-transform: uppercase; letter-spacing: .04em; }
.rd-reply-body { margin: 3px 0 0; font-size: 13px; color: var(--rd-ink-soft); white-space: pre-wrap; }
.rd-form-card { padding: 20px; }
.rd-form-title { margin: 0 0 4px; font-size: 17px; font-weight: 700; }
.rd-form-sub { margin: 0 0 16px; font-size: 13px; color: var(--rd-ink-soft); }
.rd-field { margin: 0 0 16px; }
.rd-label { display: block; font-size: 13px; font-weight: 600; margin-bottom: 8px; color: var(--rd-ink); }
.rd-req { color: var(--rd-danger); margin-left: 2px; }
.rd-field-error { margin: 6px 0 0; font-size: 12px; color: var(--rd-danger); }
.rd-starpick { display: inline-flex; gap: 4px; }
.rd-starbtn { border: 0; background: transparent; padding: 2px; cursor: pointer; color: var(--rd-border-strong); line-height: 0; border-radius: 6px; transition: color .12s var(--rd-ease), transform .12s var(--rd-ease); }
.rd-starbtn svg { width: 32px; height: 32px; }
.rd-starbtn:hover { transform: scale(1.08); }
.rd-starbtn.rd-on { color: var(--rd-star); }
.rd-rating-hint { margin-left: 10px; font-size: 13px; color: var(--rd-muted); vertical-align: middle; }
.rd-input, .rd-textarea { width: 100%; border: 1px solid var(--rd-border); border-radius: var(--rd-radius-sm); padding: 10px 12px; font: inherit; font-size: 14px; color: var(--rd-ink); background: var(--rd-surface); resize: vertical; transition: border-color .12s var(--rd-ease); }
.rd-textarea { min-height: 96px; line-height: 1.5; }
.rd-input::placeholder, .rd-textarea::placeholder { color: var(--rd-muted); }
.rd-input:hover, .rd-textarea:hover { border-color: var(--rd-border-strong); }
.rd-input[aria-invalid="true"], .rd-textarea[aria-invalid="true"] { border-color: var(--rd-danger); }
.rd-count { margin-top: 4px; font-size: 11px; color: var(--rd-muted); text-align: right; }
.rd-form-actions { display: flex; align-items: center; gap: 10px; margin-top: 4px; }
.rd-form-error { margin: 0 0 14px; padding: 10px 12px; border: 1px solid color-mix(in srgb, var(--rd-danger) 35%, var(--rd-border)); background: color-mix(in srgb, var(--rd-danger) 8%, var(--rd-surface)); border-radius: var(--rd-radius-sm); font-size: 13px; color: var(--rd-danger); }
.rd-btn { appearance: none; border: 1px solid transparent; border-radius: var(--rd-radius-sm); padding: 10px 18px; font: inherit; font-weight: 600; font-size: 14px; cursor: pointer; transition: filter .14s var(--rd-ease), background .14s var(--rd-ease), border-color .14s var(--rd-ease); }
.rd-btn-primary { background: var(--rd-accent); color: var(--rd-accent-ink); }
.rd-btn-primary:hover:not(:disabled) { filter: brightness(1.06); }
.rd-btn-ghost { background: transparent; color: var(--rd-ink-soft); border-color: var(--rd-border); }
.rd-btn-ghost:hover:not(:disabled) { background: var(--rd-surface-2); }
.rd-btn:disabled { opacity: .55; cursor: not-allowed; }
.rd-state { padding: 32px 24px; text-align: center; }
.rd-state-icon { width: 52px; height: 52px; margin: 0 auto 14px; display: flex; align-items: center; justify-content: center; border-radius: 50%; }
.rd-state-icon.rd-ok { background: color-mix(in srgb, var(--rd-success) 12%, var(--rd-surface)); color: var(--rd-success); }
.rd-state-icon.rd-err { background: color-mix(in srgb, var(--rd-danger) 12%, var(--rd-surface)); color: var(--rd-danger); }
.rd-state-icon svg { width: 28px; height: 28px; }
.rd-state-title { margin: 0; font-size: 16px; font-weight: 700; }
.rd-state-text { margin: 8px 0 0; font-size: 13px; color: var(--rd-ink-soft); }
.rd-empty { padding: 28px 20px; text-align: center; color: var(--rd-muted); font-size: 14px; }
.rd-spinner { width: 26px; height: 26px; border: 3px solid var(--rd-border); border-top-color: var(--rd-accent); border-radius: 50%; margin: 0 auto; animation: rd-spin .7s linear infinite; }
.rd-wall { width: 100%; }
.rd-wall-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; list-style: none; margin: 0; padding: 0; }
.rd-tcard { display: flex; flex-direction: column; gap: 12px; padding: 18px; border: 1px solid var(--rd-border); border-radius: var(--rd-radius); background: var(--rd-surface); box-shadow: var(--rd-shadow); height: 100%; margin: 0; }
.rd-tcard-body { margin: 0; flex: 1; font-size: 14px; color: var(--rd-ink); white-space: pre-wrap; word-break: break-word; }
.rd-tcard-foot { display: flex; align-items: center; gap: 10px; }
.rd-root :focus { outline: none; }
.rd-root :focus-visible { outline: 2px solid var(--rd-accent); outline-offset: 2px; border-radius: 6px; }
.rd-input:focus-visible, .rd-textarea:focus-visible { outline: 2px solid var(--rd-accent); outline-offset: 1px; }
@keyframes rd-spin { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) {
  .rd-root *, .rd-spinner, .rd-dist-fill, .rd-starbtn { animation-duration: .001ms !important; animation-iteration-count: 1 !important; transition-duration: .001ms !important; }
  .rd-spinner { animation: rd-spin .9s linear infinite !important; }
}
`

function ensureStyles(): void {
  if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) return
  const el = document.createElement('style')
  el.id = STYLE_ID
  el.textContent = WIDGET_CSS
  document.head.appendChild(el)
}

/* ================================ 아이콘 ================================ */

function StarIcon({ filled }: { filled: boolean }): ReactElement {
  return (
    <svg viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} aria-hidden="true">
      <path
        d="m12 3 2.7 5.5 6 .9-4.35 4.24 1.03 6-5.38-2.83L6.62 19.6l1.03-6L3.3 9.4l6-.9L12 3Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  )
}
function StarHalfIcon({ fraction, gradId }: { fraction: number; gradId: string }): ReactElement {
  const c = Math.max(0, Math.min(1, fraction))
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
          <stop offset={`${c * 100}%`} stopColor="currentColor" />
          <stop offset={`${c * 100}%`} stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="m12 3 2.7 5.5 6 .9-4.35 4.24 1.03 6-5.38-2.83L6.62 19.6l1.03-6L3.3 9.4l6-.9L12 3Z"
        fill={`url(#${gradId})`}
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  )
}
function CheckIcon(): ReactElement {
  return (
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
}
function AlertIcon(): ReactElement {
  return (
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
}

/* ============================ 표시 조각 ============================ */

type StarSize = 'sm' | 'md' | 'lg'

function Stars({
  value,
  size = 'md',
  label,
}: {
  value: number
  size?: StarSize
  label?: string
}): ReactElement {
  const grad = useId()
  const full = Math.floor(value)
  const frac = value - full
  return (
    <span
      className={`rd-stars rd-${size}`}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {Array.from({ length: RATING_MAX }, (_, i) => {
        const idx = i + 1
        if (idx <= full) return <StarIcon key={idx} filled />
        if (idx === full + 1 && frac > 0.05)
          return <StarHalfIcon key={idx} fraction={frac} gradId={`${grad}-${idx}`} />
        return (
          <span key={idx} className="rd-star-empty">
            <StarIcon filled={false} />
          </span>
        )
      })}
    </span>
  )
}
function Avatar({ name }: { name: string }): ReactElement {
  return (
    <span className="rd-avatar" aria-hidden="true">
      {name.trim().charAt(0).toUpperCase() || '?'}
    </span>
  )
}
function formatDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}.`
}

/* ============================ 공통 props/루트 ============================ */

export interface CommonWidgetProps {
  publishableKey: string
  endpoint: string
  accent?: string
  accentInk?: string
  fetch?: typeof fetch
}

type LoadPhase = 'loading' | 'ready' | 'error'

function Root({
  accent = DEFAULT_ACCENT,
  accentInk = DEFAULT_ACCENT_INK,
  inline,
  children,
}: {
  accent?: string
  accentInk?: string
  inline?: boolean
  children: ReactNode
}): ReactElement {
  useEffect(() => {
    ensureStyles()
  }, [])
  const style = {
    '--rd-accent': accent,
    '--rd-accent-ink': accentInk,
    ...(inline ? { display: 'inline-flex' } : null),
  } as CSSProperties
  return (
    <div className="rd-root" style={style}>
      {children}
    </div>
  )
}

function useClient(props: CommonWidgetProps): ReviewDeskClient {
  const { publishableKey, endpoint, fetch: f } = props
  return useMemo(
    () => createClient({ publishableKey, endpoint, fetch: f }),
    [publishableKey, endpoint, f]
  )
}

const isAbort = (e: unknown) => e instanceof DOMException && e.name === 'AbortError'

/* ============================ 1) ReviewStars ============================ */

export interface ReviewStarsProps extends CommonWidgetProps {
  subjectId: string
  size?: StarSize
  hideCount?: boolean
  href?: string
}

export function ReviewStars(props: ReviewStarsProps): ReactElement {
  const { subjectId, size = 'sm', hideCount = false, href, accent, accentInk } = props
  const client = useClient(props)
  const [phase, setPhase] = useState<LoadPhase>('loading')
  const [agg, setAgg] = useState<ReviewAggregate | null>(null)
  useEffect(() => {
    const ctrl = new AbortController()
    setPhase('loading')
    client
      .getAggregate(subjectId, ctrl.signal)
      .then((a) => {
        setAgg(a)
        setPhase('ready')
      })
      .catch((e: unknown) => {
        if (!ctrl.signal.aborted && !isAbort(e)) setPhase('error')
      })
    return () => ctrl.abort()
  }, [client, subjectId])
  const avg = agg?.avgRating ?? 0
  const count = agg?.count ?? 0
  const countText = count === 1 ? '리뷰 1건' : `리뷰 ${count.toLocaleString()}건`
  const ariaLabel =
    count > 0
      ? `${RATING_MAX}점 만점에 평균 ${avg.toFixed(1)}점, ${countText}`
      : '아직 리뷰가 없습니다'
  return (
    <Root accent={accent} accentInk={accentInk} inline>
      {phase === 'loading' ? (
        <span className="rd-badge" aria-busy="true" aria-label="평점 불러오는 중">
          <Stars value={0} size={size} />
        </span>
      ) : phase === 'error' || !agg || count === 0 ? (
        <span className="rd-badge">
          <Stars value={0} size={size} />
          <span className="rd-badge-empty">
            {phase === 'error' ? '평점 없음' : '아직 리뷰가 없어요'}
          </span>
        </span>
      ) : (
        <span className="rd-badge" role="img" aria-label={ariaLabel}>
          <Stars value={avg} size={size} />
          <span className="rd-badge-num" aria-hidden="true">
            {avg.toFixed(1)}
          </span>
          {!hideCount ? (
            <span className="rd-badge-count" aria-hidden="true">
              {href ? <a href={href}>{countText}</a> : countText}
            </span>
          ) : null}
        </span>
      )}
    </Root>
  )
}

/* ============================ 2) ReviewList ============================ */

export interface ReviewListProps extends CommonWidgetProps {
  subjectId: string
  limit?: number
  hideDistribution?: boolean
  title?: string
}

function DistributionBars({ agg }: { agg: ReviewAggregate }): ReactElement {
  const total = agg.count || 1
  return (
    <div className="rd-dist" aria-hidden="true">
      {[5, 4, 3, 2, 1].map((star) => {
        const n = agg.distribution[String(star)] ?? 0
        const pct = Math.round((n / total) * 100)
        return (
          <div className="rd-dist-row" key={star}>
            <span className="rd-dist-star">
              {star}
              <StarIcon filled />
            </span>
            <span className="rd-dist-track">
              <span className="rd-dist-fill" style={{ width: `${pct}%` }} />
            </span>
            <span className="rd-dist-n">{n}</span>
          </div>
        )
      })}
    </div>
  )
}

function ReviewItem({ review }: { review: PublicReviewDto }): ReactElement {
  return (
    <li className="rd-item">
      <div className="rd-item-head">
        <Avatar name={review.authorName} />
        <span className="rd-item-meta">
          <span className="rd-item-author">{review.authorName}</span>
          <span className="rd-item-date">{formatDate(review.createdAt)}</span>
        </span>
        {review.featured ? <span className="rd-featured-tag">추천</span> : null}
        <Stars
          value={review.rating}
          size="sm"
          label={`${RATING_MAX}점 만점에 ${review.rating}점`}
        />
      </div>
      {review.title ? <h4 className="rd-item-title">{review.title}</h4> : null}
      <p className="rd-item-body">{review.body}</p>
      {review.reply ? (
        <div className="rd-reply">
          <div className="rd-reply-label">운영자 답글</div>
          <p className="rd-reply-body">{review.reply}</p>
        </div>
      ) : null}
    </li>
  )
}

export function ReviewList(props: ReviewListProps): ReactElement {
  const { subjectId, limit, hideDistribution, title = '고객 리뷰', accent, accentInk } = props
  const client = useClient(props)
  const [phase, setPhase] = useState<LoadPhase>('loading')
  const [data, setData] = useState<PublicReviewsDto | null>(null)
  useEffect(() => {
    const ctrl = new AbortController()
    setPhase('loading')
    client
      .getReviews(subjectId, limit, ctrl.signal)
      .then((d) => {
        setData(d)
        setPhase('ready')
      })
      .catch((e: unknown) => {
        if (!ctrl.signal.aborted && !isAbort(e)) setPhase('error')
      })
    return () => ctrl.abort()
  }, [client, subjectId, limit])
  const avg = data?.aggregate.avgRating ?? 0
  return (
    <Root accent={accent} accentInk={accentInk}>
      <section className="rd-list rd-card" aria-label={title}>
        {phase === 'loading' ? (
          <div className="rd-state" aria-busy="true">
            <div className="rd-spinner" />
            <p className="rd-state-text" style={{ marginTop: 12 }}>
              리뷰를 불러오는 중…
            </p>
          </div>
        ) : phase === 'error' || !data ? (
          <div className="rd-state">
            <div className="rd-state-icon rd-err">
              <AlertIcon />
            </div>
            <h3 className="rd-state-title">리뷰를 불러오지 못했어요</h3>
            <p className="rd-state-text">잠시 후 다시 시도해 주세요.</p>
          </div>
        ) : (
          <>
            <div className="rd-summary">
              <div className="rd-summary-score">
                <span className="rd-score-num" aria-hidden="true">
                  {avg.toFixed(1)}
                </span>
                <Stars
                  value={avg}
                  size="sm"
                  label={`${RATING_MAX}점 만점에 평균 ${avg.toFixed(1)}점`}
                />
                <span className="rd-score-meta">
                  {data.aggregate.count === 1
                    ? '리뷰 1건'
                    : `리뷰 ${data.aggregate.count.toLocaleString()}건`}
                </span>
              </div>
              {!hideDistribution ? <DistributionBars agg={data.aggregate} /> : null}
            </div>
            {data.items.length === 0 ? (
              <p className="rd-empty">아직 작성된 리뷰가 없어요. 첫 리뷰를 남겨 주세요!</p>
            ) : (
              <ul className="rd-items">
                {data.items.map((r) => (
                  <ReviewItem key={r.id} review={r} />
                ))}
              </ul>
            )}
          </>
        )}
      </section>
    </Root>
  )
}

/* ============================ 3) ReviewForm ============================ */

export interface ReviewFormProps extends CommonWidgetProps {
  subjectId: string
  subjectLabel?: string
  title?: string
  subtitle?: string
  collectEmail?: boolean
  onSubmitted?: (receipt: { id: string; status: string }) => void
}

const RATING_HINTS: Record<number, string> = {
  1: '별로예요',
  2: '그저 그래요',
  3: '괜찮아요',
  4: '좋아요',
  5: '최고예요',
}

export function ReviewForm(props: ReviewFormProps): ReactElement {
  const {
    subjectId,
    subjectLabel,
    title = '리뷰 작성',
    subtitle = '경험을 별점과 함께 남겨 주세요.',
    collectEmail = false,
    onSubmitted,
    accent,
    accentInk,
  } = props
  const client = useClient(props)
  const [rating, setRating] = useState(0)
  const [authorName, setAuthorName] = useState('')
  const [reviewTitle, setReviewTitle] = useState('')
  const [body, setBody] = useState('')
  const [email, setEmail] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [phase, setPhase] = useState<'idle' | 'submitting' | 'success'>('idle')
  const groupRef = useRef<HTMLDivElement>(null)
  const rErr = useId()
  const nErr = useId()
  const bErr = useId()
  const rLbl = useId()

  const moveRating = useCallback((next: number) => {
    const c = Math.min(RATING_MAX, Math.max(RATING_MIN, next))
    setRating(c)
    setErrors((p) => {
      if (!p.rating) return p
      const n = { ...p }
      delete n.rating
      return n
    })
    window.setTimeout(() => {
      groupRef.current?.querySelector<HTMLButtonElement>(`button[data-star="${c}"]`)?.focus()
    }, 0)
  }, [])
  const clearError = (k: string) =>
    setErrors((p) => {
      if (!p[k]) return p
      const n = { ...p }
      delete n[k]
      return n
    })

  const submit = useCallback(() => {
    const le: Record<string, string> = {}
    if (rating < RATING_MIN) le.rating = '별점을 선택해 주세요.'
    if (!authorName.trim()) le.authorName = '이름을 입력해 주세요.'
    if (!body.trim()) le.body = '리뷰 내용을 입력해 주세요.'
    if (collectEmail && email.trim() && !isEmail(email.trim()))
      le.authorEmail = '이메일 형식이 올바르지 않습니다.'
    if (!SUBJECT_ID_RE.test(subjectId)) le.form = 'subjectId 형식이 올바르지 않습니다.'
    if (Object.keys(le).length > 0) {
      setErrors(le)
      setFormError('입력을 확인해 주세요.')
      return
    }
    const input: SubmitReviewInput = {
      subjectId,
      subjectLabel: subjectLabel || undefined,
      rating,
      title: reviewTitle.trim() || undefined,
      body: body.trim(),
      authorName: authorName.trim(),
      authorEmail: collectEmail && email.trim() ? email.trim() : undefined,
      source: 'widget',
      meta: {
        pageUrl: typeof location !== 'undefined' ? location.href : undefined,
        referrer:
          typeof document !== 'undefined' && document.referrer ? document.referrer : undefined,
      },
    }
    setPhase('submitting')
    setFormError(null)
    client
      .submitReview(input)
      .then((r) => {
        setPhase('success')
        onSubmitted?.({ id: r.id, status: r.status })
      })
      .catch((e: unknown) => {
        setPhase('idle')
        setFormError(
          e instanceof Error ? e.message : '제출에 실패했습니다. 잠시 후 다시 시도해 주세요.'
        )
      })
  }, [
    rating,
    authorName,
    body,
    reviewTitle,
    email,
    collectEmail,
    subjectId,
    subjectLabel,
    client,
    onSubmitted,
  ])

  const reset = useCallback(() => {
    setRating(0)
    setAuthorName('')
    setReviewTitle('')
    setBody('')
    setEmail('')
    setErrors({})
    setFormError(null)
    setPhase('idle')
  }, [])

  return (
    <Root accent={accent} accentInk={accentInk}>
      <section className="rd-form-card rd-card" aria-label={title}>
        {phase === 'success' ? (
          <div className="rd-state" role="status">
            <div className="rd-state-icon rd-ok">
              <CheckIcon />
            </div>
            <h3 className="rd-state-title">소중한 리뷰 감사합니다</h3>
            <p className="rd-state-text">
              검수 후 게시돼요. 의견은 서비스 개선에 큰 도움이 됩니다.
            </p>
            <div style={{ marginTop: 18 }}>
              <button type="button" className="rd-btn rd-btn-ghost" onClick={reset}>
                다른 리뷰 작성
              </button>
            </div>
          </div>
        ) : (
          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault()
              submit()
            }}
          >
            <h3 className="rd-form-title">{title}</h3>
            {subtitle ? <p className="rd-form-sub">{subtitle}</p> : null}
            {formError ? (
              <p className="rd-form-error" role="alert">
                {formError}
              </p>
            ) : null}
            <div className="rd-field">
              <span className="rd-label" id={rLbl}>
                별점
                <span className="rd-req" aria-hidden="true">
                  *
                </span>
              </span>
              <div
                className="rd-starpick"
                ref={groupRef}
                role="radiogroup"
                aria-labelledby={rLbl}
                aria-describedby={errors.rating ? rErr : undefined}
                aria-required="true"
                onKeyDown={(e) => {
                  if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
                    e.preventDefault()
                    moveRating((rating || RATING_MIN) + (rating === 0 ? 0 : 1))
                  } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
                    e.preventDefault()
                    moveRating((rating || RATING_MIN) - 1)
                  } else if (e.key === 'Home') {
                    e.preventDefault()
                    moveRating(RATING_MIN)
                  } else if (e.key === 'End') {
                    e.preventDefault()
                    moveRating(RATING_MAX)
                  }
                }}
              >
                {Array.from({ length: RATING_MAX }, (_, i) => RATING_MIN + i).map((n) => {
                  const on = n <= rating
                  return (
                    <button
                      key={n}
                      type="button"
                      data-star={n}
                      className={`rd-starbtn${on ? ' rd-on' : ''}`}
                      role="radio"
                      aria-checked={rating === n}
                      aria-label={`${n}점 — ${RATING_HINTS[n]}`}
                      tabIndex={rating === n || (rating === 0 && n === RATING_MIN) ? 0 : -1}
                      onClick={() => moveRating(n)}
                    >
                      <StarIcon filled={on} />
                    </button>
                  )
                })}
                {rating > 0 ? (
                  <span className="rd-rating-hint" aria-hidden="true">
                    {RATING_HINTS[rating]}
                  </span>
                ) : null}
              </div>
              {errors.rating ? (
                <p className="rd-field-error" id={rErr} role="alert">
                  {errors.rating}
                </p>
              ) : null}
            </div>
            <div className="rd-field">
              <label className="rd-label" htmlFor={`${nErr}-name`}>
                이름
                <span className="rd-req" aria-hidden="true">
                  *
                </span>
              </label>
              <input
                id={`${nErr}-name`}
                className="rd-input"
                type="text"
                value={authorName}
                maxLength={REVIEW_AUTHOR_MAX}
                placeholder="표시될 이름"
                autoComplete="name"
                aria-invalid={errors.authorName ? true : undefined}
                aria-describedby={errors.authorName ? nErr : undefined}
                onChange={(e) => {
                  setAuthorName(e.target.value)
                  clearError('authorName')
                }}
              />
              {errors.authorName ? (
                <p className="rd-field-error" id={nErr} role="alert">
                  {errors.authorName}
                </p>
              ) : null}
            </div>
            {collectEmail ? (
              <div className="rd-field">
                <label className="rd-label" htmlFor={`${nErr}-email`}>
                  이메일{' '}
                  <span style={{ color: 'var(--rd-muted)', fontWeight: 400 }}>(선택·비공개)</span>
                </label>
                <input
                  id={`${nErr}-email`}
                  className="rd-input"
                  type="email"
                  value={email}
                  maxLength={320}
                  placeholder="you@example.com"
                  autoComplete="email"
                  aria-invalid={errors.authorEmail ? true : undefined}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    clearError('authorEmail')
                  }}
                />
                {errors.authorEmail ? (
                  <p className="rd-field-error" role="alert">
                    {errors.authorEmail}
                  </p>
                ) : null}
              </div>
            ) : null}
            <div className="rd-field">
              <label className="rd-label" htmlFor={`${nErr}-title`}>
                제목 <span style={{ color: 'var(--rd-muted)', fontWeight: 400 }}>(선택)</span>
              </label>
              <input
                id={`${nErr}-title`}
                className="rd-input"
                type="text"
                value={reviewTitle}
                maxLength={REVIEW_TITLE_MAX}
                placeholder="한 줄 요약"
                onChange={(e) => setReviewTitle(e.target.value)}
              />
            </div>
            <div className="rd-field">
              <label className="rd-label" htmlFor={`${bErr}-body`}>
                리뷰 내용
                <span className="rd-req" aria-hidden="true">
                  *
                </span>
              </label>
              <textarea
                id={`${bErr}-body`}
                className="rd-textarea"
                value={body}
                maxLength={REVIEW_BODY_MAX}
                placeholder="어떤 점이 좋았나요? 자유롭게 적어 주세요."
                aria-invalid={errors.body ? true : undefined}
                aria-describedby={errors.body ? bErr : undefined}
                onChange={(e) => {
                  setBody(e.target.value)
                  clearError('body')
                }}
              />
              <div className="rd-count" aria-hidden="true">
                {body.length}/{REVIEW_BODY_MAX}
              </div>
              {errors.body ? (
                <p className="rd-field-error" id={bErr} role="alert">
                  {errors.body}
                </p>
              ) : null}
            </div>
            <div className="rd-form-actions">
              <button
                type="submit"
                className="rd-btn rd-btn-primary"
                disabled={phase === 'submitting'}
              >
                {phase === 'submitting' ? '제출 중…' : '리뷰 제출'}
              </button>
            </div>
          </form>
        )}
      </section>
    </Root>
  )
}

/* ============================ 4) TestimonialWall ============================ */

export interface TestimonialWallProps extends CommonWidgetProps {
  limit?: number
  title?: string
}

function TestimonialCard({ testimonial }: { testimonial: PublicReviewDto }): ReactElement {
  return (
    <figure className="rd-tcard">
      <Stars
        value={testimonial.rating}
        size="sm"
        label={`${RATING_MAX}점 만점에 ${testimonial.rating}점`}
      />
      <blockquote className="rd-tcard-body">
        {testimonial.title ? <strong>{testimonial.title}. </strong> : null}
        {testimonial.body}
      </blockquote>
      <figcaption className="rd-tcard-foot">
        <Avatar name={testimonial.authorName} />
        <span className="rd-item-meta">
          <span className="rd-item-author">{testimonial.authorName}</span>
          <span className="rd-item-date">{formatDate(testimonial.createdAt)}</span>
        </span>
      </figcaption>
    </figure>
  )
}

export function TestimonialWall(props: TestimonialWallProps): ReactElement {
  const { limit, title = '고객 후기', accent, accentInk } = props
  const client = useClient(props)
  const [phase, setPhase] = useState<LoadPhase>('loading')
  const [data, setData] = useState<ReviewWallDto | null>(null)
  useEffect(() => {
    const ctrl = new AbortController()
    setPhase('loading')
    client
      .getWall(limit, ctrl.signal)
      .then((d) => {
        setData(d)
        setPhase('ready')
      })
      .catch((e: unknown) => {
        if (!ctrl.signal.aborted && !isAbort(e)) setPhase('error')
      })
    return () => ctrl.abort()
  }, [client, limit])
  return (
    <Root accent={accent} accentInk={accentInk}>
      <section className="rd-wall" aria-label={title}>
        {phase === 'loading' ? (
          <div className="rd-state" aria-busy="true">
            <div className="rd-spinner" />
            <p className="rd-state-text" style={{ marginTop: 12 }}>
              후기를 불러오는 중…
            </p>
          </div>
        ) : phase === 'error' || !data ? (
          <div className="rd-state">
            <div className="rd-state-icon rd-err">
              <AlertIcon />
            </div>
            <h3 className="rd-state-title">후기를 불러오지 못했어요</h3>
            <p className="rd-state-text">잠시 후 다시 시도해 주세요.</p>
          </div>
        ) : data.items.length === 0 ? (
          <p className="rd-empty">아직 후기가 없어요.</p>
        ) : (
          <ul className="rd-wall-grid">
            {data.items.map((t) => (
              <li key={t.id}>
                <TestimonialCard testimonial={t} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </Root>
  )
}
