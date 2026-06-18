/* eslint-disable jsx-a11y/no-static-element-interactions -- vendored DeskCloud widget (upstream patterns; verified typecheck+build green) */
/**
 * DeskCloudDock — 콘텐츠 Desk 위젯용 떠있는 드로어 (PromptMarket / apps/web).
 * ──────────────────────────────────────────────────────────────────────────
 * 리뷰·커뮤니티·미디어·신고(ReportButton) 위젯은 인라인 콘텐츠 블록이라 붙일 단일
 * 페이지가 명확하지 않습니다. 그래서 셸 차원에서 떠있는 런처 + 드로어로 한 번만
 * 마운트합니다. 각 Desk 는 자기 `VITE_<DESK>_URL` 이 설정된 경우에만 탭/섹션이
 * 나타나며(env-gated), 콘텐츠 Desk 가 하나도 설정되지 않으면 런처 자체가 렌더되지
 * 않습니다(앱에 무영향).
 *
 * 자기-완결: react 만 의존하고, 스코프 .dc-* CSS 를 1회 주입해 앱 토큰 시스템과
 * 충돌하지 않습니다. 접근성: role="dialog" + aria-modal · 포커스 트랩 · Esc ·
 * focus-visible · prefers-reduced-motion.
 * ──────────────────────────────────────────────────────────────────────────
 */
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react'

import { CommunityFeed } from './communitydesk/CommunityBoard'
import { MediaGallery } from './mediadesk/MediaWidgets'
import { ReportButton } from './moderationdesk/ReportButton'
import { ReviewList } from './reviewdesk/ReviewWidgets'

const env = import.meta.env
const PK = (specific: string | undefined): string => specific ?? 'pk_demo'

/* 호스트 앱이 DeskCloud 콘텐츠 위젯에 넘기는 기본 식별자(데모/공용 마운트용). */
const REVIEW_SUBJECT_ID = 'promptmarket'
const COMMUNITY_BOARD_SLUG = 'general'

type TabKey = 'reviews' | 'community' | 'media' | 'report'

interface TabDef {
  key: TabKey
  label: string
  enabled: boolean
  render: () => ReactNode
}

const STYLE_ID = 'deskcloud-dock-styles'
const ACCENT = '#2f5fe0'

const CSS = `
.dc-dock, .dc-dock * { box-sizing: border-box; }
.dc-dock {
  --dc-accent: ${ACCENT}; --dc-accent-ink: #fff;
  --dc-ink:#1a1d23; --dc-ink-soft:#4a4f57; --dc-muted:#6b7280;
  --dc-surface:#fff; --dc-surface-2:#f4f5f7; --dc-border:#d7dae0; --dc-border-strong:#b7bcc6;
  --dc-radius:14px; --dc-radius-sm:9px;
  --dc-shadow:0 1px 2px rgba(16,24,40,.06),0 18px 48px -12px rgba(16,24,40,.28);
  --dc-z-launcher:2147482900; --dc-z-backdrop:2147483400; --dc-z-drawer:2147483401;
  --dc-ease:cubic-bezier(.22,1,.36,1);
  font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif; color:var(--dc-ink); line-height:1.5;
}
/* 좌하단 스택: SurveyDesk 피드백 런처(bottom:20) → ChangelogDesk(bottom:84) →
   Dock(bottom:148) 순으로 위로 쌓아 어떤 조합에서도 겹치지 않게 합니다. 우하단은
   앱 자체 ScrollToTop 필이 차지하므로 DeskCloud 런처는 전부 좌측 레인에 둡니다. */
.dc-launcher{position:fixed;left:20px;bottom:148px;z-index:var(--dc-z-launcher);display:inline-flex;
  align-items:center;gap:8px;padding:11px 16px;border:0;border-radius:999px;background:var(--dc-accent);
  color:var(--dc-accent-ink);font:inherit;font-weight:600;font-size:14px;cursor:pointer;box-shadow:var(--dc-shadow);
  transition:transform .18s var(--dc-ease),filter .18s var(--dc-ease);}
.dc-launcher:hover{filter:brightness(1.06);transform:translateY(-1px);}
.dc-launcher:active{transform:translateY(0);}
.dc-launcher svg{width:18px;height:18px;display:block;}
.dc-backdrop{position:fixed;inset:0;z-index:var(--dc-z-backdrop);background:rgba(16,24,40,.42);
  animation:dc-fade .16s var(--dc-ease);}
.dc-drawer{position:fixed;z-index:var(--dc-z-drawer);left:0;top:0;bottom:0;
  width:min(460px,calc(100vw - 24px));display:flex;flex-direction:column;background:var(--dc-surface);
  color:var(--dc-ink);box-shadow:var(--dc-shadow);overflow:hidden;animation:dc-slide .22s var(--dc-ease);}
@media (max-width:520px){.dc-drawer{width:100vw;}}
.dc-head{display:flex;align-items:center;gap:12px;padding:16px 18px 12px;border-bottom:1px solid var(--dc-border);flex:none;}
.dc-head-title{flex:1;min-width:0;margin:0;font-size:16px;font-weight:700;letter-spacing:-.01em;}
.dc-close{flex:none;width:32px;height:32px;display:inline-flex;align-items:center;justify-content:center;
  border:0;border-radius:8px;background:transparent;color:var(--dc-muted);cursor:pointer;
  transition:background .14s var(--dc-ease),color .14s var(--dc-ease);}
.dc-close:hover{background:var(--dc-surface-2);color:var(--dc-ink);} .dc-close svg{width:18px;height:18px;}
.dc-tabs{display:flex;gap:4px;padding:8px 12px;border-bottom:1px solid var(--dc-border);flex:none;
  overflow-x:auto;-webkit-overflow-scrolling:touch;}
.dc-tab{appearance:none;border:1px solid transparent;border-radius:999px;background:transparent;
  color:var(--dc-ink-soft);font:inherit;font-size:13px;font-weight:600;padding:7px 14px;cursor:pointer;white-space:nowrap;
  transition:background .12s var(--dc-ease),color .12s var(--dc-ease),border-color .12s var(--dc-ease);}
.dc-tab:hover{background:var(--dc-surface-2);color:var(--dc-ink);}
.dc-tab[aria-selected="true"]{background:color-mix(in srgb,var(--dc-accent) 12%,var(--dc-surface));
  border-color:color-mix(in srgb,var(--dc-accent) 32%,var(--dc-border));color:var(--dc-accent);}
.dc-body{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:16px 18px;}
.dc-report{display:flex;flex-direction:column;gap:12px;}
.dc-report p{margin:0;font-size:13px;color:var(--dc-ink-soft);}
.dc-dock :focus{outline:none;}
.dc-dock :focus-visible{outline:2px solid var(--dc-accent);outline-offset:2px;border-radius:6px;}
@keyframes dc-fade{from{opacity:0}to{opacity:1}}
@keyframes dc-slide{from{transform:translateX(-100%)}to{transform:none}}
@media (prefers-reduced-motion:reduce){
  .dc-dock *,.dc-backdrop,.dc-drawer,.dc-launcher{
    animation-duration:.001ms!important;animation-iteration-count:1!important;transition-duration:.001ms!important;}
}
`

function ensureStyles(): void {
  if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) return
  const el = document.createElement('style')
  el.id = STYLE_ID
  el.textContent = CSS
  document.head.appendChild(el)
}

const FOCUSABLE =
  'a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),button:not([disabled]),[tabindex]:not([tabindex="-1"])'

function GridIcon(): ReactElement {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
      <rect
        x="13.5"
        y="3.5"
        width="7"
        height="7"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <rect
        x="3.5"
        y="13.5"
        width="7"
        height="7"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <rect
        x="13.5"
        y="13.5"
        width="7"
        height="7"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  )
}
function CloseIcon(): ReactElement {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="m6 6 12 12M18 6 6 18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function DeskCloudDock(): ReactElement | null {
  const tabs: TabDef[] = [
    {
      key: 'reviews',
      label: '리뷰',
      enabled: Boolean(env.VITE_REVIEWDESK_URL),
      render: () => (
        <ReviewList
          publishableKey={PK(env.VITE_REVIEWDESK_PK)}
          endpoint={env.VITE_REVIEWDESK_URL as string}
          subjectId={REVIEW_SUBJECT_ID}
          title="리뷰"
        />
      ),
    },
    {
      key: 'community',
      label: '커뮤니티',
      enabled: Boolean(env.VITE_COMMUNITYDESK_URL),
      render: () => (
        <CommunityFeed
          publishableKey={PK(env.VITE_COMMUNITYDESK_PK)}
          endpoint={env.VITE_COMMUNITYDESK_URL as string}
          boardSlug={COMMUNITY_BOARD_SLUG}
          title="커뮤니티"
        />
      ),
    },
    {
      key: 'media',
      label: '미디어',
      enabled: Boolean(env.VITE_MEDIADESK_URL),
      render: () => (
        <MediaGallery
          publishableKey={PK(env.VITE_MEDIADESK_PK)}
          endpoint={env.VITE_MEDIADESK_URL as string}
        />
      ),
    },
    {
      key: 'report',
      label: '신고',
      enabled: Boolean(env.VITE_MODERATIONDESK_URL),
      render: () => (
        <div className="dc-report">
          <p>부적절한 콘텐츠를 발견하셨나요? 아래 버튼으로 신고해 주세요.</p>
          <ReportButton
            publishableKey={PK(env.VITE_MODERATIONDESK_PK)}
            endpoint={env.VITE_MODERATIONDESK_URL as string}
            subjectType="page"
            subjectId={REVIEW_SUBJECT_ID}
            label="이 페이지 신고"
          />
        </div>
      ),
    },
  ]

  const active = tabs.filter((t) => t.enabled)

  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<TabKey>(active[0]?.key ?? 'reviews')

  const titleId = useId()
  const drawerRef = useRef<HTMLDivElement>(null)
  const launcherRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    ensureStyles()
  }, [])

  const closeDrawer = useCallback(() => {
    setOpen(false)
    launcherRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        closeDrawer()
        return
      }
      if (e.key !== 'Tab') return
      const root = drawerRef.current
      if (!root) return
      const nodes = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (n) => n.offsetParent !== null || n === document.activeElement
      )
      if (nodes.length === 0) return
      const first = nodes[0]!
      const last = nodes[nodes.length - 1]!
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey, true)
    return () => document.removeEventListener('keydown', onKey, true)
  }, [open, closeDrawer])

  useEffect(() => {
    if (!open) return
    const t = window.setTimeout(() => {
      drawerRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus()
    }, 20)
    return () => window.clearTimeout(t)
  }, [open])

  // 콘텐츠 Desk 가 하나도 설정되지 않으면 런처 자체를 렌더하지 않음.
  if (active.length === 0) return null

  const current = active.find((t) => t.key === tab) ?? active[0]!

  return (
    <div className="dc-dock">
      {!open ? (
        <button
          ref={launcherRef}
          type="button"
          className="dc-launcher"
          aria-haspopup="dialog"
          onClick={() => setOpen(true)}
        >
          <GridIcon />
          DeskCloud
        </button>
      ) : null}

      {open ? (
        <>
          <div
            className="dc-backdrop"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) closeDrawer()
            }}
          />
          <div
            ref={drawerRef}
            className="dc-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
          >
            <div className="dc-head">
              <h2 className="dc-head-title" id={titleId}>
                DeskCloud
              </h2>
              <button type="button" className="dc-close" aria-label="닫기" onClick={closeDrawer}>
                <CloseIcon />
              </button>
            </div>

            {active.length > 1 ? (
              <div className="dc-tabs" role="tablist" aria-label="DeskCloud 위젯">
                {active.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    role="tab"
                    aria-selected={t.key === current.key}
                    className="dc-tab"
                    onClick={() => setTab(t.key)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            ) : null}

            <div className="dc-body" role="tabpanel">
              {current.render()}
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}

export default DeskCloudDock
