/* eslint-disable jsx-a11y/no-static-element-interactions, react-refresh/only-export-components -- vendored DeskCloud widget (upstream patterns; verified typecheck+build green) */
/**
 * ModerationDesk — 단일 파일 벤더링 컴포넌트 (의존성: react 만).
 * ──────────────────────────────────────────────────────────────────────────
 * npm publish 가 막힌 동안 형제 앱(offhours·rotifolk·…)에 그대로 복붙해서 쓰는 버전입니다.
 * 워크스페이스 의존(@moderationdesk/shared) 0 — 필요한 상수/타입을 이 파일에 인라인했습니다.
 * 동작/디자인은 @moderationdesk/widget 의 <ReportButton> 과 동일합니다.
 *
 * 사용:
 *   import { ReportButton } from './ReportButton'
 *   <ReportButton
 *     subjectType="comment" subjectId={comment.id}
 *     publishableKey="pk_..." endpoint="https://moderate.example.com"
 *   />
 *
 * 백엔드 계약(공개 — publishable 키 + Origin 가드):
 *   POST {endpoint}/api/reports   (헤더 x-pk: pk_...)   → { id, status, createdAt }
 *
 * 접근성/디자인: 포커스 트랩 · Esc · :focus-visible · prefers-reduced-motion · 대비 ≥4.5:1 ·
 * 그라디언트 텍스트/글래스모피즘/사이드스트라이프 없음 · 외부 CSS 프레임워크 0.
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

const REPORT_REASON_MAX = 1000

/** 기본 신고 사유(라벨 = 제출되는 reason 텍스트). */
export const DEFAULT_REASONS: readonly string[] = [
  '스팸/광고',
  '욕설/혐오 발언',
  '음란물/선정성',
  '폭력/위협',
  '개인정보 노출',
  '기타',
]

interface SubmitReportInput {
  subjectType: string
  subjectId: string
  reason: string
  reporterId?: string
}
interface ReportReceiptDto {
  id: string
  status: string
  createdAt: string
}

/* ============================ 클라이언트(인라인) ============================ */

class ModerationDeskError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message)
    this.name = 'ModerationDeskError'
  }
}

async function postReport(
  endpoint: string,
  publishableKey: string,
  input: SubmitReportInput,
  signal?: AbortSignal
): Promise<ReportReceiptDto> {
  const base = endpoint.replace(/\/+$/, '')
  const res = await fetch(`${base}/api/reports`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-pk': publishableKey,
      'x-moderationdesk-widget': 'vendor-0.1.0',
    },
    body: JSON.stringify(input),
    signal,
  })
  const text = await res.text()
  let json: unknown = null
  if (text) {
    try {
      json = JSON.parse(text)
    } catch {
      json = text
    }
  }
  if (!res.ok) {
    const rec = (json ?? {}) as Record<string, unknown>
    const raw = rec.message ?? rec.error ?? `요청 실패 (${res.status})`
    const msg = Array.isArray(raw) ? raw.join(', ') : String(raw)
    throw new ModerationDeskError(msg, res.status)
  }
  return json as ReportReceiptDto
}

/* ================================ 아이콘 ================================ */

function FlagIcon(): ReactElement {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 21V4m0 0 1.2-.5a7 7 0 0 1 5.6.3 7 7 0 0 0 5.6.3L19 3.7V14l-1.6.6a7 7 0 0 1-5.6-.3 7 7 0 0 0-5.6-.3L5 14.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
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

/* ================================ 스타일 ================================ */

const DEFAULT_ACCENT = '#c0362c'
const DEFAULT_ACCENT_INK = '#ffffff'
const STYLE_ID = 'moderationdesk-widget-styles'

function ensureStyles(): void {
  if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) return
  const el = document.createElement('style')
  el.id = STYLE_ID
  el.textContent = WIDGET_CSS
  document.head.appendChild(el)
}

const WIDGET_CSS = `
.md-root, .md-root * { box-sizing: border-box; }
.md-root {
  --md-accent: ${DEFAULT_ACCENT};
  --md-accent-ink: ${DEFAULT_ACCENT_INK};
  --md-ink: #1a1d23; --md-ink-soft: #4a4f57; --md-muted: #6b7280;
  --md-surface: #ffffff; --md-surface-2: #f4f5f7;
  --md-border: #d7dae0; --md-border-strong: #b7bcc6;
  --md-danger: #b42318; --md-success: #047857;
  --md-radius: 14px; --md-radius-sm: 9px;
  --md-shadow: 0 1px 2px rgba(16,24,40,.06), 0 12px 32px -8px rgba(16,24,40,.22);
  --md-z-backdrop: 2147483600; --md-z-dialog: 2147483601;
  --md-ease: cubic-bezier(.22,1,.36,1);
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  color: var(--md-ink); line-height: 1.5; display: contents;
}
.md-report-trigger {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 5px 10px; border: 1px solid var(--md-border); border-radius: 999px;
  background: var(--md-surface); color: var(--md-ink-soft);
  font: inherit; font-weight: 600; font-size: 13px; cursor: pointer;
  transition: background .14s var(--md-ease), border-color .14s var(--md-ease), color .14s var(--md-ease);
}
.md-report-trigger:hover { background: var(--md-surface-2); border-color: var(--md-border-strong); color: var(--md-ink); }
.md-report-trigger svg { width: 15px; height: 15px; display: block; }
.md-report-trigger.md-bare { border: 0; background: transparent; padding: 4px 6px; color: var(--md-muted); }
.md-report-trigger.md-bare:hover { color: var(--md-accent); background: transparent; }
.md-backdrop {
  position: fixed; inset: 0; z-index: var(--md-z-backdrop);
  background: rgba(16,24,40,.45); display: flex; align-items: center; justify-content: center;
  padding: 20px; animation: md-fade .16s var(--md-ease);
}
.md-dialog {
  position: relative; z-index: var(--md-z-dialog);
  width: min(440px, calc(100vw - 32px)); max-height: min(640px, calc(100vh - 40px));
  display: flex; flex-direction: column; background: var(--md-surface); color: var(--md-ink);
  border-radius: var(--md-radius); box-shadow: var(--md-shadow); overflow: hidden;
  animation: md-pop .2s var(--md-ease);
}
@media (max-width: 520px) {
  .md-backdrop { padding: 0; align-items: flex-end; }
  .md-dialog { width: 100vw; max-height: 92vh; border-radius: 18px 18px 0 0; animation: md-sheet .24s var(--md-ease); }
}
.md-header { display: flex; align-items: flex-start; gap: 12px; padding: 18px 20px 12px; border-bottom: 1px solid var(--md-border); }
.md-header-text { flex: 1; min-width: 0; }
.md-title { margin: 0; font-size: 16px; font-weight: 700; letter-spacing: -0.01em; text-wrap: balance; }
.md-subtitle { margin: 6px 0 0; font-size: 13px; color: var(--md-ink-soft); }
.md-close {
  flex: none; width: 32px; height: 32px; display: inline-flex; align-items: center; justify-content: center;
  border: 0; border-radius: 8px; background: transparent; color: var(--md-muted); cursor: pointer;
  transition: background .14s var(--md-ease), color .14s var(--md-ease);
}
.md-close:hover { background: var(--md-surface-2); color: var(--md-ink); }
.md-close svg { width: 18px; height: 18px; }
.md-body { padding: 16px 20px; overflow-y: auto; -webkit-overflow-scrolling: touch; }
.md-footer { padding: 14px 20px; border-top: 1px solid var(--md-border); display: flex; align-items: center; gap: 10px; }
.md-footer-spacer { flex: 1; }
.md-brand { font-size: 11px; color: var(--md-muted); text-decoration: none; }
.md-brand:hover { color: var(--md-ink-soft); }
.md-field { margin: 0 0 18px; }
.md-field:last-child { margin-bottom: 4px; }
.md-label { display: block; font-size: 14px; font-weight: 600; margin-bottom: 10px; color: var(--md-ink); }
.md-req { color: var(--md-danger); margin-left: 2px; }
.md-field-error { margin: 8px 0 0; font-size: 12px; color: var(--md-danger); }
.md-reasons { display: flex; flex-direction: column; gap: 8px; }
.md-reason {
  display: flex; align-items: center; gap: 10px; padding: 10px 12px;
  border: 1px solid var(--md-border); border-radius: var(--md-radius-sm); cursor: pointer; font-size: 14px;
  transition: border-color .12s var(--md-ease), background .12s var(--md-ease);
}
.md-reason:hover { border-color: var(--md-border-strong); background: var(--md-surface-2); }
.md-reason.md-checked { border-color: var(--md-accent); background: color-mix(in srgb, var(--md-accent) 8%, var(--md-surface)); }
.md-reason input { accent-color: var(--md-accent); width: 17px; height: 17px; margin: 0; flex: none; }
.md-reason span { flex: 1; }
.md-textarea {
  width: 100%; border: 1px solid var(--md-border); border-radius: var(--md-radius-sm);
  padding: 10px 12px; font: inherit; font-size: 14px; color: var(--md-ink); background: var(--md-surface);
  resize: vertical; min-height: 88px; line-height: 1.5; transition: border-color .12s var(--md-ease);
}
.md-textarea::placeholder { color: var(--md-muted); }
.md-textarea:hover { border-color: var(--md-border-strong); }
.md-count { margin-top: 4px; font-size: 11px; color: var(--md-muted); text-align: right; }
.md-btn {
  appearance: none; border: 1px solid transparent; border-radius: var(--md-radius-sm);
  padding: 10px 18px; font: inherit; font-weight: 600; font-size: 14px; cursor: pointer;
  transition: filter .14s var(--md-ease), background .14s var(--md-ease), border-color .14s var(--md-ease);
}
.md-btn-primary { background: var(--md-accent); color: var(--md-accent-ink); }
.md-btn-primary:hover:not(:disabled) { filter: brightness(1.06); }
.md-btn-ghost { background: transparent; color: var(--md-ink-soft); border-color: var(--md-border); }
.md-btn-ghost:hover:not(:disabled) { background: var(--md-surface-2); }
.md-btn:disabled { opacity: .55; cursor: not-allowed; }
.md-state { padding: 36px 24px; text-align: center; }
.md-state-icon { width: 52px; height: 52px; margin: 0 auto 14px; display: flex; align-items: center; justify-content: center; border-radius: 50%; }
.md-state-icon.md-ok { background: color-mix(in srgb, var(--md-success) 12%, var(--md-surface)); color: var(--md-success); }
.md-state-icon svg { width: 28px; height: 28px; }
.md-state-title { margin: 0; font-size: 16px; font-weight: 700; }
.md-state-text { margin: 8px 0 0; font-size: 13px; color: var(--md-ink-soft); }
.md-form-error {
  margin: 0 0 14px; padding: 10px 12px;
  border: 1px solid color-mix(in srgb, var(--md-danger) 35%, var(--md-border));
  background: color-mix(in srgb, var(--md-danger) 8%, var(--md-surface));
  border-radius: var(--md-radius-sm); font-size: 13px; color: var(--md-danger);
}
.md-root :focus { outline: none; }
.md-root :focus-visible { outline: 2px solid var(--md-accent); outline-offset: 2px; border-radius: 6px; }
.md-reason:focus-within, .md-textarea:focus-visible { outline: 2px solid var(--md-accent); outline-offset: 1px; }
@keyframes md-fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes md-pop { from { opacity: 0; transform: translateY(8px) scale(.98); } to { opacity: 1; transform: none; } }
@keyframes md-sheet { from { transform: translateY(100%); } to { transform: none; } }
@media (prefers-reduced-motion: reduce) {
  .md-root *, .md-backdrop, .md-dialog, .md-report-trigger {
    animation-duration: .001ms !important; animation-iteration-count: 1 !important; transition-duration: .001ms !important;
  }
}
`

/* ============================== 컴포넌트 ============================== */

export interface ReportButtonProps {
  subjectType: string
  subjectId: string
  publishableKey: string
  endpoint: string
  reasons?: readonly string[]
  reporterId?: string
  label?: string
  bare?: boolean
  accent?: string
  accentInk?: string
  title?: string
  allowDetail?: boolean
  onSubmitted?: (receipt: { id: string; status: string }) => void
}

type Phase = 'form' | 'submitting' | 'success'

const FOCUSABLE =
  'a[href],area[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),button:not([disabled]),[tabindex]:not([tabindex="-1"])'

export function ReportButton(props: ReportButtonProps): ReactElement {
  const {
    subjectType,
    subjectId,
    publishableKey,
    endpoint,
    reasons = DEFAULT_REASONS,
    reporterId,
    label = '신고',
    bare = false,
    accent = DEFAULT_ACCENT,
    accentInk = DEFAULT_ACCENT_INK,
    title = '신고하기',
    allowDetail = true,
    onSubmitted,
  } = props

  const [open, setOpen] = useState(false)
  const [phase, setPhase] = useState<Phase>('form')
  const [reason, setReason] = useState<string | null>(null)
  const [detail, setDetail] = useState('')
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const titleId = useId()
  const reasonGroupId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  const rootStyle = useMemo<CSSProperties>(
    () => ({ ['--md-accent' as string]: accent, ['--md-accent-ink' as string]: accentInk }),
    [accent, accentInk]
  )
  const detailMax = REPORT_REASON_MAX - 64

  useEffect(() => {
    ensureStyles()
  }, [])

  const reset = useCallback(() => {
    setPhase('form')
    setReason(null)
    setDetail('')
    setFieldError(null)
    setFormError(null)
  }, [])

  const openDialog = useCallback(() => {
    reset()
    setOpen(true)
  }, [reset])

  const closeDialog = useCallback(() => {
    setOpen(false)
    triggerRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        closeDialog()
        return
      }
      if (e.key !== 'Tab') return
      const root = dialogRef.current
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
  }, [open, closeDialog])

  useEffect(() => {
    if (!open) return
    const t = window.setTimeout(() => {
      dialogRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus()
    }, 20)
    return () => window.clearTimeout(t)
  }, [open, phase])

  const submit = useCallback(() => {
    if (!reason) {
      setFieldError('신고 사유를 선택해 주세요.')
      return
    }
    setPhase('submitting')
    setFormError(null)
    const input: SubmitReportInput = {
      subjectType,
      subjectId,
      reason: detail.trim() ? `${reason} — ${detail.trim()}` : reason,
      ...(reporterId ? { reporterId } : {}),
    }
    postReport(endpoint, publishableKey, input)
      .then((receipt) => {
        setPhase('success')
        onSubmitted?.({ id: receipt.id, status: receipt.status })
      })
      .catch((e: unknown) => {
        setPhase('form')
        setFormError(
          e instanceof Error ? e.message : '신고 접수에 실패했습니다. 잠시 후 다시 시도해 주세요.'
        )
      })
  }, [reason, detail, subjectType, subjectId, reporterId, endpoint, publishableKey, onSubmitted])

  return (
    <span className="md-root" style={rootStyle}>
      <button
        ref={triggerRef}
        type="button"
        className={`md-report-trigger${bare ? ' md-bare' : ''}`}
        aria-haspopup="dialog"
        onClick={openDialog}
      >
        <FlagIcon />
        {label}
      </button>

      {open ? (
        <div
          className="md-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeDialog()
          }}
        >
          <div
            ref={dialogRef}
            className="md-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
          >
            {phase === 'success' ? (
              <div className="md-state" role="status">
                <div className="md-state-icon md-ok">
                  <CheckIcon />
                </div>
                <h2 className="md-state-title">신고가 접수되었습니다</h2>
                <p className="md-state-text">검토 후 적절한 조치를 취하겠습니다. 감사합니다.</p>
                <div style={{ marginTop: 18 }}>
                  <button type="button" className="md-btn md-btn-primary" onClick={closeDialog}>
                    닫기
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="md-header">
                  <div className="md-header-text">
                    <h2 className="md-title" id={titleId}>
                      {title}
                    </h2>
                    <p className="md-subtitle">신고 사유를 선택해 주세요. 검토 후 조치됩니다.</p>
                  </div>
                  <button
                    type="button"
                    className="md-close"
                    aria-label="닫기"
                    onClick={closeDialog}
                  >
                    <CloseIcon />
                  </button>
                </div>

                <form
                  className="md-body"
                  noValidate
                  onSubmit={(e) => {
                    e.preventDefault()
                    submit()
                  }}
                >
                  {formError ? (
                    <p className="md-form-error" role="alert">
                      <AlertIcon /> {formError}
                    </p>
                  ) : null}

                  <fieldset
                    className="md-field"
                    style={{ border: 0, margin: 0, padding: 0, minInlineSize: 'auto' }}
                  >
                    <legend className="md-label" id={reasonGroupId} style={{ padding: 0 }}>
                      신고 사유
                      <span className="md-req" aria-hidden="true">
                        *
                      </span>
                    </legend>
                    <div className="md-reasons" role="radiogroup" aria-labelledby={reasonGroupId}>
                      {reasons.map((r) => (
                        <label key={r} className={`md-reason${reason === r ? ' md-checked' : ''}`}>
                          <input
                            type="radio"
                            name="md-reason"
                            value={r}
                            checked={reason === r}
                            onChange={() => {
                              setReason(r)
                              setFieldError(null)
                            }}
                          />
                          <span>{r}</span>
                        </label>
                      ))}
                    </div>
                    {fieldError ? (
                      <p className="md-field-error" role="alert">
                        {fieldError}
                      </p>
                    ) : null}
                  </fieldset>

                  {allowDetail ? (
                    <div className="md-field">
                      <label className="md-label" htmlFor={`${titleId}-detail`}>
                        상세 내용{' '}
                        <span style={{ fontWeight: 400, color: 'var(--md-muted)' }}>(선택)</span>
                      </label>
                      <textarea
                        id={`${titleId}-detail`}
                        className="md-textarea"
                        placeholder="신고 내용을 자세히 알려 주시면 검토에 도움이 됩니다."
                        maxLength={detailMax}
                        value={detail}
                        onChange={(e) => setDetail(e.target.value)}
                      />
                      <div className="md-count">
                        {detail.length}/{detailMax}
                      </div>
                    </div>
                  ) : null}

                  <button
                    type="submit"
                    style={{ display: 'none' }}
                    aria-hidden="true"
                    tabIndex={-1}
                  />
                </form>

                <div className="md-footer">
                  <a
                    className="md-brand"
                    href="https://github.com"
                    target="_blank"
                    rel="noreferrer"
                  >
                    ModerationDesk
                  </a>
                  <span className="md-footer-spacer" />
                  <button type="button" className="md-btn md-btn-ghost" onClick={closeDialog}>
                    취소
                  </button>
                  <button
                    type="button"
                    className="md-btn md-btn-primary"
                    disabled={phase === 'submitting'}
                    onClick={submit}
                  >
                    {phase === 'submitting' ? '접수 중…' : '신고 제출'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </span>
  )
}
