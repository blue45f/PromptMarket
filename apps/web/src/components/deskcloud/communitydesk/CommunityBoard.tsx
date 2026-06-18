/* eslint-disable react-hooks/set-state-in-effect -- vendored DeskCloud widget */
/* eslint-disable react-compiler/react-compiler, jsx-a11y/no-autofocus -- vendored DeskCloud widget (upstream patterns; verified typecheck+build green) */
/**
 * CommunityDesk — 단일 파일 벤더링 컴포넌트 (의존성: react 만).
 * ──────────────────────────────────────────────────────────────────────────
 * npm publish 가 막힌 동안 호스트 앱에 그대로 복붙해서 쓰는 버전입니다.
 * 워크스페이스 의존(@communitydesk/sdk·shared) 0 — 필요한 타입·클라이언트를 인라인했습니다.
 * 동작/디자인은 @communitydesk/widget 의 <CommunityBoard>/<CommunityFeed> 와 동일합니다.
 *
 * 사용:
 *   import { CommunityBoard, CommunityFeed } from './CommunityBoard'
 *   <CommunityBoard boardSlug="free" publishableKey="pk_..." endpoint="https://community.example.com" memberId="u_42" />
 *
 * 백엔드 계약(공개·publishable, x-pk 헤더 + Origin):
 *   GET  {endpoint}/api/boards
 *   GET  {endpoint}/api/boards/{slug}/posts?sort&tag&limit&offset
 *   GET  {endpoint}/api/posts/{id}                       (살균 HTML + 중첩 댓글 트리)
 *   POST {endpoint}/api/posts | .../posts/{id}/comments | .../reactions
 *
 * 접근성/디자인: focus-visible · prefers-reduced-motion · 대비 ≥4.5:1 ·
 * 그라디언트 텍스트/글래스모피즘/사이드스트라이프 없음 · 외부 CSS 프레임워크 0.
 * 살균 본문 HTML 은 서버가 화이트리스트로 생성하므로 그대로 렌더합니다.
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
} from 'react'

/* ============================ 공유 계약(인라인) ============================ */

type PostSort = 'recent' | 'popular' | 'replies'
type ReactionKind = 'like' | 'love' | 'laugh' | 'wow' | 'sad' | 'angry'
type ReactionTarget = 'post' | 'comment'
type ReactionCounts = Partial<Record<ReactionKind, number>>

interface BoardDto {
  id: string
  slug: string
  name: string
  description: string | null
  kind: 'board' | 'cafe'
  postCount: number
  createdAt: string
}
interface PostSummaryDto {
  id: string
  boardSlug: string
  authorName: string
  title: string | null
  excerpt: string
  tags: string[]
  pinned: boolean
  locked: boolean
  reactions: ReactionCounts
  replyCount: number
  createdAt: string
}
interface CommentNodeDto {
  id: string
  parentId: string | null
  authorName: string
  bodyHtml: string
  reactions: ReactionCounts
  depth: number
  createdAt: string
  children: CommentNodeDto[]
}
interface PostDetailDto {
  id: string
  boardSlug: string
  authorMemberId: string
  authorName: string
  title: string | null
  bodyHtml: string
  body: string
  tags: string[]
  pinned: boolean
  locked: boolean
  reactions: ReactionCounts
  replyCount: number
  createdAt: string
  comments: CommentNodeDto[]
}
interface PostListDto {
  boardSlug: string
  items: PostSummaryDto[]
  total: number
  offset: number
  limit: number
}
interface PostReceiptDto {
  id: string
  status: 'visible' | 'hidden' | 'pending'
  createdAt: string
}
interface ReactionToggleDto {
  active: boolean
  reactions: ReactionCounts
}

const REACTION_ORDER: readonly ReactionKind[] = ['like', 'love', 'laugh', 'wow', 'sad', 'angry']
const REACTION_META: Record<ReactionKind, { emoji: string; label: string }> = {
  like: { emoji: '👍', label: '좋아요' },
  love: { emoji: '❤️', label: '최고예요' },
  laugh: { emoji: '😂', label: '웃겨요' },
  wow: { emoji: '😮', label: '놀라워요' },
  sad: { emoji: '😢', label: '슬퍼요' },
  angry: { emoji: '😡', label: '화나요' },
}

/* ============================ 클라이언트(인라인) ============================ */

class CommunityDeskError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message)
    this.name = 'CommunityDeskError'
  }
}

interface BrowserClient {
  listBoards(signal?: AbortSignal): Promise<BoardDto[]>
  listPosts(
    slug: string,
    q?: { sort?: PostSort; tag?: string; limit?: number; offset?: number },
    signal?: AbortSignal
  ): Promise<PostListDto>
  getPost(id: string, signal?: AbortSignal): Promise<PostDetailDto>
  createPost(input: {
    boardSlug: string
    authorMemberId: string
    authorName: string
    title?: string
    body: string
    tags: string[]
  }): Promise<PostReceiptDto>
  createComment(
    postId: string,
    input: { authorMemberId: string; authorName: string; body: string; parentId?: string }
  ): Promise<PostReceiptDto>
  toggleReaction(input: {
    targetType: ReactionTarget
    targetId: string
    memberId: string
    kind: ReactionKind
  }): Promise<ReactionToggleDto>
}

function createBrowserClient(opts: {
  publishableKey: string
  endpoint: string
  fetch?: typeof fetch
}): BrowserClient {
  const base = opts.endpoint.replace(/\/+$/, '')
  const doFetch = opts.fetch ?? globalThis.fetch

  async function req<T>(
    path: string,
    init?: {
      method?: string
      body?: unknown
      query?: Record<string, unknown>
      signal?: AbortSignal
    }
  ): Promise<T> {
    const usp = new URLSearchParams()
    if (init?.query) {
      for (const [k, v] of Object.entries(init.query)) {
        if (v === undefined || v === null) continue
        usp.set(k, String(v))
      }
    }
    const qs = usp.toString() ? `?${usp}` : ''
    const headers: Record<string, string> = {
      accept: 'application/json',
      'x-pk': opts.publishableKey,
    }
    let body: string | undefined
    if (init?.body !== undefined) {
      headers['content-type'] = 'application/json'
      body = JSON.stringify(init.body)
    }
    const res = await doFetch(`${base}/api${path}${qs}`, {
      method: init?.method ?? 'GET',
      headers,
      body,
      signal: init?.signal,
    })
    const text = await res.text()
    const json: unknown = text ? safeParse(text) : null
    if (!res.ok) {
      const rec = (json ?? {}) as Record<string, unknown>
      const raw = rec.message ?? rec.error ?? `요청 실패 (${res.status})`
      const msg = Array.isArray(raw) ? raw.join(', ') : String(raw)
      throw new CommunityDeskError(msg, res.status)
    }
    return json as T
  }

  return {
    listBoards: (signal) => req<BoardDto[]>('/boards', { signal }),
    listPosts: (slug, q, signal) =>
      req<PostListDto>(`/boards/${encodeURIComponent(slug)}/posts`, { query: q, signal }),
    getPost: (id, signal) => req<PostDetailDto>(`/posts/${encodeURIComponent(id)}`, { signal }),
    createPost: (input) => req<PostReceiptDto>('/posts', { method: 'POST', body: input }),
    createComment: (postId, input) =>
      req<PostReceiptDto>(`/posts/${encodeURIComponent(postId)}/comments`, {
        method: 'POST',
        body: input,
      }),
    toggleReaction: (input) =>
      req<ReactionToggleDto>('/reactions', { method: 'POST', body: input }),
  }
}

function safeParse(t: string): unknown {
  try {
    return JSON.parse(t)
  } catch {
    return t
  }
}

/* ============================ 유틸(인라인) ============================ */

function relativeTime(iso: string, now: number = Date.now()): string {
  const t = Date.parse(iso)
  if (Number.isNaN(t)) return ''
  const diff = Math.max(0, now - t)
  const sec = Math.floor(diff / 1000)
  if (sec < 60) return '방금'
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}분 전`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}시간 전`
  const day = Math.floor(hr / 24)
  if (day < 7) return `${day}일 전`
  const d = new Date(t)
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return d.getFullYear() === new Date(now).getFullYear()
    ? `${m}.${dd}`
    : `${d.getFullYear()}.${m}.${dd}`
}

function reactionTotal(counts: ReactionCounts): number {
  let n = 0
  for (const v of Object.values(counts)) n += v ?? 0
  return n
}

/* ============================ 스타일(인라인·스코프) ============================ */

const ACCENT = '#2f5fe0'
const ACCENT_INK = '#ffffff'
const STYLE_ID = 'communitydesk-vendor-styles'

const WIDGET_CSS = `
.cd-root,.cd-root *{box-sizing:border-box}
.cd-root{--cd-accent:${ACCENT};--cd-accent-ink:${ACCENT_INK};--cd-ink:#1a1d23;--cd-ink-soft:#4a4f57;--cd-muted:#6b7280;--cd-surface:#fff;--cd-surface-2:#f4f5f7;--cd-surface-3:#eceef1;--cd-border:#d7dae0;--cd-border-strong:#b7bcc6;--cd-danger:#b42318;--cd-radius:14px;--cd-radius-sm:9px;--cd-ease:cubic-bezier(.22,1,.36,1);font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:var(--cd-ink);line-height:1.5;font-size:14px}
.cd-card{background:var(--cd-surface);border:1px solid var(--cd-border);border-radius:var(--cd-radius);overflow:hidden}
.cd-head{padding:16px 18px;border-bottom:1px solid var(--cd-border)}
.cd-head-top{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.cd-title{margin:0;font-size:17px;font-weight:700;letter-spacing:-.01em}
.cd-desc{margin:4px 0 0;font-size:13px;color:var(--cd-ink-soft)}
.cd-head-spacer{flex:1 1 auto}
.cd-kind{font-size:11px;font-weight:700;padding:3px 8px;border-radius:999px;background:var(--cd-surface-2);color:var(--cd-ink-soft);border:1px solid var(--cd-border)}
.cd-controls{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:12px}
.cd-sort{display:inline-flex;gap:4px;background:var(--cd-surface-2);border-radius:999px;padding:3px}
.cd-sort-btn{appearance:none;border:0;background:transparent;color:var(--cd-ink-soft);padding:5px 12px;border-radius:999px;font:inherit;font-size:12px;font-weight:600;cursor:pointer;transition:background .12s var(--cd-ease),color .12s var(--cd-ease)}
.cd-sort-btn[aria-pressed=true]{background:var(--cd-surface);color:var(--cd-ink);box-shadow:0 1px 2px rgba(16,24,40,.1)}
.cd-tagfilter{display:inline-flex;align-items:center;gap:6px;font-size:12px;color:var(--cd-muted)}
.cd-tagfilter button{appearance:none;border:1px solid var(--cd-border);background:var(--cd-surface);color:var(--cd-ink-soft);border-radius:999px;padding:3px 10px;font:inherit;font-size:12px;cursor:pointer}
.cd-list{list-style:none;margin:0;padding:0}
.cd-item{border-bottom:1px solid var(--cd-border)}.cd-item:last-child{border-bottom:0}
.cd-item-btn{display:block;width:100%;text-align:left;appearance:none;border:0;background:transparent;padding:14px 18px;cursor:pointer;font:inherit;color:inherit;transition:background .12s var(--cd-ease)}
.cd-item-btn:hover{background:var(--cd-surface-2)}
.cd-item-meta{display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-size:12px;color:var(--cd-muted)}
.cd-pin{display:inline-flex;align-items:center;gap:3px;font-weight:700;color:var(--cd-accent)}.cd-pin svg{width:13px;height:13px}
.cd-lock svg{width:12px;height:12px;vertical-align:-1px;color:var(--cd-muted)}
.cd-item-title{margin:4px 0 0;font-size:15px;font-weight:600;line-height:1.35;color:var(--cd-ink)}
.cd-excerpt{margin:4px 0 0;font-size:13px;color:var(--cd-ink-soft);display:-webkit-box;-webkit-line-clamp:2;line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.cd-item-foot{display:flex;align-items:center;gap:14px;margin-top:8px;font-size:12px;color:var(--cd-muted)}
.cd-stat{display:inline-flex;align-items:center;gap:4px}.cd-stat svg{width:14px;height:14px}
.cd-tags{display:flex;gap:5px;flex-wrap:wrap;margin-top:8px}
.cd-tagchip{font-size:11px;color:var(--cd-ink-soft);background:var(--cd-surface-2);border-radius:6px;padding:2px 7px}
.cd-detail-head{display:flex;align-items:flex-start;gap:10px;padding:14px 18px;border-bottom:1px solid var(--cd-border)}
.cd-back{flex:none;appearance:none;border:1px solid var(--cd-border);background:var(--cd-surface);color:var(--cd-ink-soft);width:34px;height:34px;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;cursor:pointer}
.cd-back:hover{background:var(--cd-surface-2);border-color:var(--cd-border-strong)}.cd-back svg{width:18px;height:18px}
.cd-detail-body{padding:18px}
.cd-detail-title{margin:0 0 6px;font-size:19px;font-weight:700;letter-spacing:-.01em;line-height:1.3}
.cd-byline{font-size:12px;color:var(--cd-muted);margin-bottom:14px}
.cd-prose{font-size:14.5px;line-height:1.65;color:var(--cd-ink);word-break:break-word;overflow-wrap:anywhere}
.cd-prose>:first-child{margin-top:0}.cd-prose>:last-child{margin-bottom:0}
.cd-prose p{margin:0 0 .85em}
.cd-prose h1,.cd-prose h2,.cd-prose h3{margin:1.2em 0 .5em;line-height:1.3;font-weight:700}
.cd-prose h1{font-size:1.4em}.cd-prose h2{font-size:1.2em}.cd-prose h3{font-size:1.05em}
.cd-prose a{color:var(--cd-accent);text-underline-offset:2px}
.cd-prose ul,.cd-prose ol{margin:0 0 .85em;padding-left:1.5em}.cd-prose li{margin:.2em 0}
.cd-prose blockquote{margin:0 0 .85em;padding:.2em 0 .2em 1em;border-left:3px solid var(--cd-border-strong);color:var(--cd-ink-soft)}
.cd-prose code{background:var(--cd-surface-3);padding:.12em .4em;border-radius:5px;font-size:.9em;font-family:ui-monospace,Menlo,Consolas,monospace}
.cd-prose pre{background:var(--cd-surface-3);padding:12px 14px;border-radius:var(--cd-radius-sm);overflow-x:auto;margin:0 0 .85em}
.cd-prose pre code{background:transparent;padding:0}
.cd-prose hr{border:0;border-top:1px solid var(--cd-border);margin:1.2em 0}
.cd-reactions{display:flex;gap:6px;flex-wrap:wrap;margin-top:16px}
.cd-react{appearance:none;border:1px solid var(--cd-border);background:var(--cd-surface);color:var(--cd-ink-soft);border-radius:999px;padding:5px 11px;font:inherit;font-size:13px;cursor:pointer;display:inline-flex;align-items:center;gap:5px;transition:background .12s var(--cd-ease),border-color .12s var(--cd-ease),color .12s var(--cd-ease)}
.cd-react:hover:not(:disabled){border-color:var(--cd-border-strong);background:var(--cd-surface-2)}
.cd-react[aria-pressed=true]{border-color:var(--cd-accent);background:color-mix(in srgb,var(--cd-accent) 10%,var(--cd-surface));color:var(--cd-ink)}
.cd-react:disabled{opacity:.55;cursor:not-allowed}.cd-react .cd-emoji{font-size:15px;line-height:1}.cd-react .cd-count{font-variant-numeric:tabular-nums;font-weight:600}
.cd-comments{margin-top:24px}.cd-comments-h{margin:0 0 12px;font-size:14px;font-weight:700}
.cd-ctree{list-style:none;margin:0;padding:0}.cd-cnode{margin-top:12px}
.cd-cbody{padding:10px 12px;background:var(--cd-surface-2);border-radius:var(--cd-radius-sm)}
.cd-cmeta{display:flex;align-items:center;gap:8px;font-size:12px}
.cd-cauthor{font-weight:600;color:var(--cd-ink)}.cd-ctime{color:var(--cd-muted)}.cd-ctext{margin-top:4px}
.cd-children{list-style:none;margin:0 0 0 6px;padding:0 0 0 16px;border-left:2px solid var(--cd-border)}
.cd-cactions{margin-top:6px;display:flex;gap:12px;align-items:center}
.cd-link-btn{appearance:none;border:0;background:transparent;color:var(--cd-ink-soft);padding:0;font:inherit;font-size:12px;font-weight:600;cursor:pointer}
.cd-link-btn:hover{color:var(--cd-accent);text-decoration:underline}
.cd-compose-inline{margin-top:8px}
.cd-field{margin-bottom:10px}.cd-label{display:block;font-size:12px;font-weight:600;color:var(--cd-ink-soft);margin-bottom:5px}
.cd-input,.cd-textarea{width:100%;border:1px solid var(--cd-border);border-radius:var(--cd-radius-sm);padding:9px 11px;font:inherit;font-size:14px;color:var(--cd-ink);background:var(--cd-surface);resize:vertical;transition:border-color .12s var(--cd-ease)}
.cd-textarea{min-height:80px;line-height:1.5}.cd-input::placeholder,.cd-textarea::placeholder{color:var(--cd-muted)}
.cd-input:hover,.cd-textarea:hover{border-color:var(--cd-border-strong)}
.cd-hint{margin:4px 0 0;font-size:11px;color:var(--cd-muted)}
.cd-compose-foot{display:flex;align-items:center;gap:10px;margin-top:8px}.cd-compose-foot .cd-spacer{flex:1}
.cd-btn{appearance:none;border:1px solid transparent;border-radius:var(--cd-radius-sm);padding:9px 16px;font:inherit;font-weight:600;font-size:14px;cursor:pointer;transition:filter .14s var(--cd-ease),background .14s var(--cd-ease),border-color .14s var(--cd-ease)}
.cd-btn-primary{background:var(--cd-accent);color:var(--cd-accent-ink)}.cd-btn-primary:hover:not(:disabled){filter:brightness(1.06)}
.cd-btn-ghost{background:transparent;color:var(--cd-ink-soft);border-color:var(--cd-border)}.cd-btn-ghost:hover:not(:disabled){background:var(--cd-surface-2)}
.cd-btn-sm{padding:6px 12px;font-size:13px}.cd-btn:disabled{opacity:.55;cursor:not-allowed}
.cd-state{padding:40px 24px;text-align:center}.cd-state-title{margin:0;font-size:15px;font-weight:700}.cd-state-text{margin:6px 0 0;font-size:13px;color:var(--cd-ink-soft)}
.cd-spinner{width:26px;height:26px;border:3px solid var(--cd-border);border-top-color:var(--cd-accent);border-radius:50%;margin:0 auto 14px;animation:cd-spin .7s linear infinite}
.cd-form-error{margin:0 0 12px;padding:9px 11px;border:1px solid color-mix(in srgb,var(--cd-danger) 35%,var(--cd-border));background:color-mix(in srgb,var(--cd-danger) 8%,var(--cd-surface));border-radius:var(--cd-radius-sm);font-size:13px;color:var(--cd-danger)}
.cd-skel{padding:14px 18px;border-bottom:1px solid var(--cd-border)}
.cd-skel-line{height:11px;border-radius:6px;background:var(--cd-surface-2);margin-bottom:8px;animation:cd-pulse 1.2s var(--cd-ease) infinite}
.cd-skel-line.cd-w70{width:70%}.cd-skel-line.cd-w40{width:40%}.cd-skel-line.cd-w90{width:90%}
.cd-feed{display:flex;flex-direction:column}
.cd-feed-h{display:flex;align-items:baseline;gap:8px;padding:12px 16px;border-bottom:1px solid var(--cd-border)}.cd-feed-h h3{margin:0;font-size:14px;font-weight:700}
.cd-feed-item{padding:11px 16px;border-bottom:1px solid var(--cd-border)}.cd-feed-item:last-child{border-bottom:0}
.cd-feed-link{display:block;text-align:left;appearance:none;border:0;background:transparent;cursor:pointer;font:inherit;color:inherit;padding:0;width:100%}
.cd-feed-link:hover .cd-feed-title{color:var(--cd-accent)}
.cd-feed-title{font-size:14px;font-weight:600;line-height:1.35}.cd-feed-meta{display:flex;gap:8px;margin-top:3px;font-size:11.5px;color:var(--cd-muted)}
.cd-root :focus{outline:none}
.cd-root :focus-visible{outline:2px solid var(--cd-accent);outline-offset:2px;border-radius:6px}
@keyframes cd-spin{to{transform:rotate(360deg)}}@keyframes cd-pulse{0%,100%{opacity:1}50%{opacity:.5}}
@media (prefers-reduced-motion:reduce){.cd-root *,.cd-spinner,.cd-skel-line{animation-duration:.001ms!important;animation-iteration-count:1!important;transition-duration:.001ms!important}.cd-spinner{animation:cd-spin .9s linear infinite!important}}
`

function ensureStyles(): void {
  if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) return
  const el = document.createElement('style')
  el.id = STYLE_ID
  el.textContent = WIDGET_CSS
  document.head.appendChild(el)
}

/* ============================ 아이콘(인라인) ============================ */

function PinIcon(): ReactElement {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M9 4h6l-1 5 3 3v2H7v-2l3-3-1-5Zm3 10v6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
function LockIcon(): ReactElement {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M8 11V8a4 4 0 0 1 8 0v3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}
function CommentIcon(): ReactElement {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H9l-4 4v-4H6.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
function BackIcon(): ReactElement {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M14 6l-6 6 6 6"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/* ============================ 컴포넌트 ============================ */

interface BaseProps {
  publishableKey: string
  endpoint: string
  accent?: string
  accentInk?: string
  fetch?: typeof fetch
  client?: BrowserClient
}
export interface CommunityBoardProps extends BaseProps {
  boardSlug: string
  memberId?: string
  memberName?: string
  defaultSort?: PostSort
  pageSize?: number
  showHeader?: boolean
}
export interface CommunityFeedProps extends BaseProps {
  boardSlug: string
  limit?: number
  title?: string
  onOpenPost?: (post: PostSummaryDto) => void
}

const SORT_LABELS: Record<PostSort, string> = { recent: '최신', popular: '인기', replies: '댓글순' }

function useClient(props: BaseProps): BrowserClient {
  const { client, publishableKey, endpoint, fetch: f } = props
  return useMemo<BrowserClient>(
    () => client ?? createBrowserClient({ publishableKey, endpoint, fetch: f }),
    [client, publishableKey, endpoint, f]
  )
}
function rootStyle(accent: string, ink: string): CSSProperties {
  return { ['--cd-accent' as string]: accent, ['--cd-accent-ink' as string]: ink } as CSSProperties
}

type View = { kind: 'list' } | { kind: 'detail'; postId: string }

export function CommunityBoard(props: CommunityBoardProps): ReactElement {
  const {
    boardSlug,
    memberId,
    memberName = '익명',
    defaultSort = 'recent',
    pageSize = 20,
    showHeader = true,
    accent = ACCENT,
    accentInk = ACCENT_INK,
  } = props
  const client = useClient(props)
  useEffect(() => ensureStyles(), [])

  const [view, setView] = useState<View>({ kind: 'list' })
  const [board, setBoard] = useState<BoardDto | null>(null)

  useEffect(() => {
    if (!showHeader) return
    let alive = true
    client
      .listBoards()
      .then((bs) => alive && setBoard(bs.find((b) => b.slug === boardSlug) ?? null))
      .catch(() => undefined)
    return () => {
      alive = false
    }
  }, [client, boardSlug, showHeader])

  const canPost = Boolean(memberId)

  return (
    <div className="cd-root" style={rootStyle(accent, accentInk)}>
      <div className="cd-card">
        {view.kind === 'list' ? (
          <BoardListView
            client={client}
            boardSlug={boardSlug}
            board={showHeader ? board : null}
            showHeader={showHeader}
            defaultSort={defaultSort}
            pageSize={pageSize}
            canPost={canPost}
            memberId={memberId}
            memberName={memberName}
            onOpen={(id) => setView({ kind: 'detail', postId: id })}
          />
        ) : (
          <PostDetailView
            client={client}
            postId={view.postId}
            boardName={board?.name ?? boardSlug}
            canPost={canPost}
            memberId={memberId}
            memberName={memberName}
            onBack={() => setView({ kind: 'list' })}
          />
        )}
      </div>
    </div>
  )
}

function BoardListView(props: {
  client: BrowserClient
  boardSlug: string
  board: BoardDto | null
  showHeader: boolean
  defaultSort: PostSort
  pageSize: number
  canPost: boolean
  memberId?: string
  memberName: string
  onOpen: (id: string) => void
}): ReactElement {
  const {
    client,
    boardSlug,
    board,
    showHeader,
    defaultSort,
    pageSize,
    canPost,
    memberId,
    memberName,
    onOpen,
  } = props
  const [sort, setSort] = useState<PostSort>(defaultSort)
  const [tag, setTag] = useState<string | undefined>(undefined)
  const [items, setItems] = useState<PostSummaryDto[]>([])
  const [total, setTotal] = useState(0)
  const [phase, setPhase] = useState<'loading' | 'ready' | 'error'>('loading')
  const [loadingMore, setLoadingMore] = useState(false)
  const [composing, setComposing] = useState(false)

  const load = useCallback(
    (reset: boolean) => {
      const offset = reset ? 0 : items.length
      if (reset) setPhase('loading')
      else setLoadingMore(true)
      const ctrl = new AbortController()
      client
        .listPosts(boardSlug, { sort, tag, limit: pageSize, offset }, ctrl.signal)
        .then((res) => {
          setTotal(res.total)
          setItems((prev) => (reset ? res.items : [...prev, ...res.items]))
          setPhase('ready')
          setLoadingMore(false)
        })
        .catch(() => {
          if (ctrl.signal.aborted) return
          setPhase('error')
          setLoadingMore(false)
        })
      return ctrl
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [client, boardSlug, sort, tag, pageSize]
  )

  useEffect(() => {
    const ctrl = load(true)
    return () => ctrl.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sort, tag, boardSlug])

  const onCreated = useCallback(() => {
    setComposing(false)
    load(true)
  }, [load])

  return (
    <>
      {showHeader ? (
        <div className="cd-head">
          <div className="cd-head-top">
            <div>
              <h2 className="cd-title">{board?.name ?? boardSlug}</h2>
              {board?.description ? <p className="cd-desc">{board.description}</p> : null}
            </div>
            <span className="cd-head-spacer" />
            {board ? (
              <span className="cd-kind">{board.kind === 'cafe' ? '카페' : '게시판'}</span>
            ) : null}
          </div>
          <div className="cd-controls">
            <div className="cd-sort" role="group" aria-label="정렬">
              {(['recent', 'popular', 'replies'] as PostSort[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  className="cd-sort-btn"
                  aria-pressed={sort === s}
                  onClick={() => setSort(s)}
                >
                  {SORT_LABELS[s]}
                </button>
              ))}
            </div>
            {tag ? (
              <span className="cd-tagfilter">
                태그: #{tag}
                <button
                  type="button"
                  onClick={() => setTag(undefined)}
                  aria-label={`태그 ${tag} 해제`}
                >
                  해제
                </button>
              </span>
            ) : null}
            <span className="cd-head-spacer" />
            {canPost ? (
              <button
                type="button"
                className="cd-btn cd-btn-primary cd-btn-sm"
                aria-expanded={composing}
                onClick={() => setComposing((v) => !v)}
              >
                {composing ? '닫기' : '글쓰기'}
              </button>
            ) : null}
          </div>
          {composing && canPost ? (
            <PostComposer
              client={client}
              boardSlug={boardSlug}
              memberId={memberId!}
              memberName={memberName}
              onCreated={onCreated}
              onCancel={() => setComposing(false)}
            />
          ) : null}
        </div>
      ) : null}

      {phase === 'loading' ? (
        <ListSkeleton />
      ) : phase === 'error' ? (
        <div className="cd-state" role="alert">
          <p className="cd-state-title">글을 불러오지 못했어요</p>
          <div style={{ marginTop: 14 }}>
            <button
              type="button"
              className="cd-btn cd-btn-primary cd-btn-sm"
              onClick={() => load(true)}
            >
              다시 시도
            </button>
          </div>
        </div>
      ) : items.length === 0 ? (
        <div className="cd-state">
          <p className="cd-state-title">아직 글이 없어요</p>
          <p className="cd-state-text">
            {canPost ? '첫 글을 남겨 보세요.' : '곧 새 글이 올라올 거예요.'}
          </p>
        </div>
      ) : (
        <>
          <ul className="cd-list">
            {items.map((p) => (
              <li className="cd-item" key={p.id}>
                <button type="button" className="cd-item-btn" onClick={() => onOpen(p.id)}>
                  <span className="cd-item-meta">
                    {p.pinned ? (
                      <span className="cd-pin">
                        <PinIcon />
                        고정
                      </span>
                    ) : null}
                    <span>{p.authorName}</span>
                    <span aria-hidden="true">·</span>
                    <span>{relativeTime(p.createdAt)}</span>
                    {p.locked ? (
                      <span className="cd-lock" title="잠긴 글">
                        <LockIcon />
                      </span>
                    ) : null}
                  </span>
                  {p.title ? <p className="cd-item-title">{p.title}</p> : null}
                  {p.excerpt ? <p className="cd-excerpt">{p.excerpt}</p> : null}
                  {p.tags.length > 0 ? (
                    <span className="cd-tags">
                      {p.tags.map((t) => (
                        <span key={t} className="cd-tagchip">
                          #{t}
                        </span>
                      ))}
                    </span>
                  ) : null}
                  <span className="cd-item-foot">
                    <span className="cd-stat">
                      <CommentIcon />
                      {p.replyCount}
                    </span>
                    <span className="cd-stat" aria-label="반응 수">
                      {reactionTotal(p.reactions)} 반응
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {items.length < total ? (
            <div style={{ padding: 14, textAlign: 'center' }}>
              <button
                type="button"
                className="cd-btn cd-btn-ghost cd-btn-sm"
                disabled={loadingMore}
                onClick={() => load(false)}
              >
                {loadingMore ? '불러오는 중…' : `더 보기 (${items.length}/${total})`}
              </button>
            </div>
          ) : null}
        </>
      )}
    </>
  )
}

function PostDetailView(props: {
  client: BrowserClient
  postId: string
  boardName: string
  canPost: boolean
  memberId?: string
  memberName: string
  onBack: () => void
}): ReactElement {
  const { client, postId, boardName, canPost, memberId, memberName, onBack } = props
  const [post, setPost] = useState<PostDetailDto | null>(null)
  const [phase, setPhase] = useState<'loading' | 'ready' | 'error'>('loading')
  const headingRef = useRef<HTMLHeadingElement>(null)

  const load = useCallback(() => {
    setPhase('loading')
    const ctrl = new AbortController()
    client
      .getPost(postId, ctrl.signal)
      .then((p) => {
        setPost(p)
        setPhase('ready')
      })
      .catch(() => {
        if (ctrl.signal.aborted) return
        setPhase('error')
      })
    return ctrl
  }, [client, postId])

  useEffect(() => {
    const ctrl = load()
    return () => ctrl.abort()
  }, [load])
  useEffect(() => {
    if (phase === 'ready') headingRef.current?.focus()
  }, [phase])

  const replyTo = useCallback(
    async (parentId: string | undefined, body: string) => {
      if (!memberId) return
      await client.createComment(postId, {
        authorMemberId: memberId,
        authorName: memberName,
        body,
        parentId,
      })
      load()
    },
    [client, postId, memberId, memberName, load]
  )

  return (
    <>
      <div className="cd-detail-head">
        <button
          type="button"
          className="cd-back"
          aria-label={`${boardName} 목록으로`}
          onClick={onBack}
        >
          <BackIcon />
        </button>
        <div className="cd-byline" style={{ margin: 0 }}>
          {boardName}
        </div>
      </div>
      {phase === 'loading' ? (
        <div className="cd-state" aria-busy="true">
          <div className="cd-spinner" />
          <p className="cd-state-text">글을 불러오는 중…</p>
        </div>
      ) : phase === 'error' || !post ? (
        <div className="cd-state" role="alert">
          <p className="cd-state-title">글을 불러오지 못했어요</p>
          <div style={{ marginTop: 14 }}>
            <button type="button" className="cd-btn cd-btn-primary cd-btn-sm" onClick={load}>
              다시 시도
            </button>
          </div>
        </div>
      ) : (
        <div className="cd-detail-body">
          <h2 className="cd-detail-title" tabIndex={-1} ref={headingRef}>
            {post.title ?? '(제목 없음)'}
          </h2>
          <div className="cd-byline">
            {post.authorName} · {relativeTime(post.createdAt)}
            {post.locked ? ' · 🔒 잠김' : ''}
          </div>
          <div className="cd-prose" dangerouslySetInnerHTML={{ __html: post.bodyHtml }} />
          {post.tags.length > 0 ? (
            <span className="cd-tags" style={{ marginTop: 14 }}>
              {post.tags.map((t) => (
                <span key={t} className="cd-tagchip">
                  #{t}
                </span>
              ))}
            </span>
          ) : null}
          <ReactionBar
            client={client}
            targetType="post"
            targetId={post.id}
            counts={post.reactions}
            memberId={memberId}
          />
          <CommentsSection
            client={client}
            comments={post.comments}
            replyCount={post.replyCount}
            locked={post.locked}
            canPost={canPost && !post.locked}
            memberId={memberId}
            onReply={replyTo}
          />
        </div>
      )}
    </>
  )
}

function CommentsSection(props: {
  client: BrowserClient
  comments: CommentNodeDto[]
  replyCount: number
  locked: boolean
  canPost: boolean
  memberId?: string
  onReply: (parentId: string | undefined, body: string) => Promise<void>
}): ReactElement {
  const { client, comments, replyCount, locked, canPost, memberId, onReply } = props
  const headingId = useId()
  return (
    <section className="cd-comments" aria-labelledby={headingId}>
      <h3 className="cd-comments-h" id={headingId}>
        댓글 {replyCount}
      </h3>
      {canPost && memberId ? (
        <CommentComposer onSubmit={(b) => onReply(undefined, b)} placeholder="댓글을 남겨보세요" />
      ) : locked ? (
        <p className="cd-hint" role="status">
          잠긴 글에는 댓글을 달 수 없어요.
        </p>
      ) : !memberId ? (
        <p className="cd-hint">로그인하면 댓글을 남길 수 있어요.</p>
      ) : null}
      {comments.length === 0 ? (
        <p className="cd-hint" style={{ marginTop: 12 }}>
          첫 댓글을 남겨보세요.
        </p>
      ) : (
        <ul className="cd-ctree" style={{ marginTop: 4 }}>
          {comments.map((c) => (
            <CommentNode
              key={c.id}
              node={c}
              client={client}
              canPost={canPost}
              memberId={memberId}
              onReply={onReply}
            />
          ))}
        </ul>
      )}
    </section>
  )
}

function CommentNode(props: {
  node: CommentNodeDto
  client: BrowserClient
  canPost: boolean
  memberId?: string
  onReply: (parentId: string | undefined, body: string) => Promise<void>
}): ReactElement {
  const { node, client, canPost, memberId, onReply } = props
  const [replying, setReplying] = useState(false)
  return (
    <li className="cd-cnode">
      <div className="cd-cbody">
        <div className="cd-cmeta">
          <span className="cd-cauthor">{node.authorName}</span>
          <span className="cd-ctime">{relativeTime(node.createdAt)}</span>
        </div>
        <div className="cd-ctext cd-prose" dangerouslySetInnerHTML={{ __html: node.bodyHtml }} />
        <div className="cd-cactions">
          <ReactionBar
            client={client}
            targetType="comment"
            targetId={node.id}
            counts={node.reactions}
            memberId={memberId}
            compact
          />
          {canPost ? (
            <button type="button" className="cd-link-btn" onClick={() => setReplying((v) => !v)}>
              {replying ? '취소' : '답글'}
            </button>
          ) : null}
        </div>
        {replying && canPost ? (
          <div className="cd-compose-inline">
            <CommentComposer
              placeholder="답글을 남겨보세요"
              autoFocus
              onSubmit={async (b) => {
                await onReply(node.id, b)
                setReplying(false)
              }}
            />
          </div>
        ) : null}
      </div>
      {node.children.length > 0 ? (
        <ul className="cd-children">
          {node.children.map((c) => (
            <CommentNode
              key={c.id}
              node={c}
              client={client}
              canPost={canPost}
              memberId={memberId}
              onReply={onReply}
            />
          ))}
        </ul>
      ) : null}
    </li>
  )
}

function ReactionBar(props: {
  client: BrowserClient
  targetType: ReactionTarget
  targetId: string
  counts: ReactionCounts
  memberId?: string
  compact?: boolean
}): ReactElement {
  const { client, targetType, targetId, counts, memberId, compact } = props
  const [local, setLocal] = useState<ReactionCounts>(counts)
  const [mine, setMine] = useState<Set<ReactionKind>>(new Set())
  const [busy, setBusy] = useState<ReactionKind | null>(null)
  useEffect(() => setLocal(counts), [counts])

  const kinds = compact ? (['like', 'love'] as ReactionKind[]) : REACTION_ORDER
  const toggle = useCallback(
    async (kind: ReactionKind) => {
      if (!memberId || busy) return
      setBusy(kind)
      try {
        const res = await client.toggleReaction({ targetType, targetId, memberId, kind })
        setLocal(res.reactions)
        setMine((prev) => {
          const next = new Set(prev)
          if (res.active) next.add(kind)
          else next.delete(kind)
          return next
        })
      } catch {
        /* 다음 상호작용에서 재시도 */
      } finally {
        setBusy(null)
      }
    },
    [client, targetType, targetId, memberId, busy]
  )

  const visible = kinds.filter((k) => memberId || (local[k] ?? 0) > 0)
  if (visible.length === 0 && !memberId) return <span />

  return (
    <div className="cd-reactions" role="group" aria-label="반응">
      {visible.map((k) => {
        const meta = REACTION_META[k]
        const count = local[k] ?? 0
        return (
          <button
            key={k}
            type="button"
            className="cd-react"
            aria-pressed={mine.has(k)}
            aria-label={`${meta.label} ${count}`}
            disabled={!memberId || busy === k}
            onClick={() => toggle(k)}
          >
            <span className="cd-emoji" aria-hidden="true">
              {meta.emoji}
            </span>
            {count > 0 ? <span className="cd-count">{count}</span> : null}
          </button>
        )
      })}
    </div>
  )
}

function PostComposer(props: {
  client: BrowserClient
  boardSlug: string
  memberId: string
  memberName: string
  onCreated: () => void
  onCancel: () => void
}): ReactElement {
  const { client, boardSlug, memberId, memberName, onCreated, onCancel } = props
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [tags, setTags] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const titleId = useId()
  const bodyId = useId()
  const tagsId = useId()

  const submit = useCallback(async () => {
    if (!body.trim() || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      await client.createPost({
        boardSlug,
        authorMemberId: memberId,
        authorName: memberName,
        title: title.trim() || undefined,
        body: body.trim(),
        tags: tags
          .split(/[,\s]+/)
          .map((t) => t.trim())
          .filter(Boolean)
          .slice(0, 10),
      })
      setTitle('')
      setBody('')
      setTags('')
      onCreated()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '작성에 실패했어요.')
    } finally {
      setSubmitting(false)
    }
  }, [client, boardSlug, memberId, memberName, title, body, tags, submitting, onCreated])

  return (
    <div style={{ marginTop: 12 }}>
      {error ? (
        <p className="cd-form-error" role="alert">
          {error}
        </p>
      ) : null}
      <div className="cd-field">
        <label className="cd-label" htmlFor={titleId}>
          제목 (선택)
        </label>
        <input
          id={titleId}
          className="cd-input"
          value={title}
          maxLength={200}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="제목"
        />
      </div>
      <div className="cd-field">
        <label className="cd-label" htmlFor={bodyId}>
          내용
        </label>
        <textarea
          id={bodyId}
          className="cd-textarea"
          value={body}
          maxLength={20000}
          onChange={(e) => setBody(e.target.value)}
          placeholder="마크다운을 쓸 수 있어요 (**굵게**, `코드`, - 목록)"
        />
        <p className="cd-hint">마크다운 지원 · 작성자: {memberName}</p>
      </div>
      <div className="cd-field">
        <label className="cd-label" htmlFor={tagsId}>
          태그 (선택, 쉼표/공백 구분)
        </label>
        <input
          id={tagsId}
          className="cd-input"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="질문, 후기"
        />
      </div>
      <div className="cd-compose-foot">
        <span className="cd-spacer" />
        <button type="button" className="cd-btn cd-btn-ghost cd-btn-sm" onClick={onCancel}>
          취소
        </button>
        <button
          type="button"
          className="cd-btn cd-btn-primary cd-btn-sm"
          disabled={submitting || !body.trim()}
          onClick={submit}
        >
          {submitting ? '게시 중…' : '게시'}
        </button>
      </div>
    </div>
  )
}

function CommentComposer(props: {
  onSubmit: (body: string) => Promise<void>
  placeholder?: string
  autoFocus?: boolean
}): ReactElement {
  const { onSubmit, placeholder = '댓글을 입력하세요', autoFocus } = props
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = useCallback(async () => {
    if (!body.trim() || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      await onSubmit(body.trim())
      setBody('')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '댓글 작성에 실패했어요.')
    } finally {
      setSubmitting(false)
    }
  }, [body, submitting, onSubmit])

  return (
    <div className="cd-compose-inline">
      {error ? (
        <p className="cd-form-error" role="alert">
          {error}
        </p>
      ) : null}
      <textarea
        className="cd-textarea"
        style={{ minHeight: 64 }}
        value={body}
        maxLength={8000}
        autoFocus={autoFocus}
        placeholder={placeholder}
        aria-label={placeholder}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
            e.preventDefault()
            void submit()
          }
        }}
      />
      <div className="cd-compose-foot">
        <span className="cd-hint">⌘/Ctrl + Enter 로 전송</span>
        <span className="cd-spacer" />
        <button
          type="button"
          className="cd-btn cd-btn-primary cd-btn-sm"
          disabled={submitting || !body.trim()}
          onClick={submit}
        >
          {submitting ? '등록 중…' : '댓글 등록'}
        </button>
      </div>
    </div>
  )
}

function ListSkeleton(): ReactElement {
  return (
    <div aria-busy="true" aria-label="불러오는 중">
      {[0, 1, 2, 3].map((i) => (
        <div className="cd-skel" key={i}>
          <div className="cd-skel-line cd-w40" />
          <div className="cd-skel-line cd-w90" />
          <div className="cd-skel-line cd-w70" />
        </div>
      ))}
    </div>
  )
}

export function CommunityFeed(props: CommunityFeedProps): ReactElement {
  const {
    boardSlug,
    limit = 5,
    title = '최근 글',
    accent = ACCENT,
    accentInk = ACCENT_INK,
    onOpenPost,
  } = props
  const client = useClient(props)
  const [items, setItems] = useState<PostSummaryDto[]>([])
  const [phase, setPhase] = useState<'loading' | 'ready' | 'error'>('loading')

  useEffect(() => ensureStyles(), [])
  useEffect(() => {
    let alive = true
    const ctrl = new AbortController()
    setPhase('loading')
    client
      .listPosts(boardSlug, { sort: 'recent', limit }, ctrl.signal)
      .then((res) => {
        if (!alive) return
        setItems(res.items)
        setPhase('ready')
      })
      .catch(() => {
        if (ctrl.signal.aborted || !alive) return
        setPhase('error')
      })
    return () => {
      alive = false
      ctrl.abort()
    }
  }, [client, boardSlug, limit])

  return (
    <div className="cd-root" style={rootStyle(accent, accentInk)}>
      <div className="cd-card cd-feed">
        <div className="cd-feed-h">
          <h3>{title}</h3>
        </div>
        {phase === 'loading' ? (
          <ListSkeleton />
        ) : phase === 'error' ? (
          <div className="cd-state" role="alert">
            <p className="cd-state-text">불러오지 못했어요.</p>
          </div>
        ) : items.length === 0 ? (
          <div className="cd-state">
            <p className="cd-state-text">아직 글이 없어요.</p>
          </div>
        ) : (
          items.map((p) => (
            <div className="cd-feed-item" key={p.id}>
              <button type="button" className="cd-feed-link" onClick={() => onOpenPost?.(p)}>
                <span className="cd-feed-title">{p.title ?? (p.excerpt || '(제목 없음)')}</span>
                <span className="cd-feed-meta">
                  <span>{p.authorName}</span>
                  <span aria-hidden="true">·</span>
                  <span>{relativeTime(p.createdAt)}</span>
                  <span aria-hidden="true">·</span>
                  <span>댓글 {p.replyCount}</span>
                </span>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
