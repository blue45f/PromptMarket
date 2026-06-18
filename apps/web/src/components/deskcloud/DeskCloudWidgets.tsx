/**
 * DeskCloud — 형제 앱 공용 위젯 마운트 (PromptMarket / apps/web).
 * ──────────────────────────────────────────────────────────────────────────
 * 각 Desk 의 self-contained · react-only 위젯을 한곳에서 마운트합니다. 모두
 * env-gated 라서 해당 Desk 의 `VITE_<DESK>_URL` 이 설정된 경우에만 렌더링되고,
 * 미설정(기본·오늘) 상태에서는 앱에 어떤 영향도 주지 않습니다. <AppProviders>
 * 에 이미 통합된 SurveyDesk FeedbackWidget 의 게이팅 패턴을 그대로 따릅니다.
 *
 * - 범용(헤더/셸 떠있는 런처):
 *     ChangelogWidget — 우하단 'What's new' 런처
 *     NotificationBell — 우상단 알림 벨(로그인 사용자에게만, recipientId = user.id)
 *     SearchPalette    — ⌘K/Ctrl+K 커맨드 팔레트(트리거 전엔 비가시)
 * - 콘텐츠(별도 페이지가 없어 셸 떠있는 런처로):
 *     DeskCloudDock    — 리뷰·커뮤니티·미디어·신고(ReportButton) 위젯을 담는 드로어
 *
 * 앱의 기존 기능(자체 Navbar 의 NotificationBell·SearchBar 등)은 건드리지 않습니다.
 * DeskCloud 위젯은 전부 스코프 CSS(.cd-/.nd-/.sk-/.rd-/.dc-…)라 토큰 시스템과 충돌
 * 하지 않습니다.
 * ──────────────────────────────────────────────────────────────────────────
 */
import { useAuthStore } from '@store/auth'
import { type ReactElement } from 'react'

import { ChangelogWidget } from './changelogdesk/ChangelogWidget'
import { DeskCloudDock } from './DeskCloudDock'
import { NotificationBell } from './notifydesk/NotificationBell'
import { SearchPalette } from './searchdesk/SearchPalette'

const env = import.meta.env

const PK = (specific: string | undefined): string => specific ?? 'pk_demo'

export function DeskCloudWidgets(): ReactElement {
  const user = useAuthStore((s) => s.user)

  return (
    <>
      {/* ChangelogDesk — 우하단 'What's new' 런처(범용). */}
      {env.VITE_CHANGELOGDESK_URL && (
        <ChangelogWidget
          publishableKey={PK(env.VITE_CHANGELOGDESK_PK)}
          endpoint={env.VITE_CHANGELOGDESK_URL}
          position="bottom-right"
        />
      )}

      {/* NotifyDesk — 우상단 떠있는 알림 벨(인박스 드롭다운). 로그인 사용자에게만
          렌더(비로그인/익명 시 미표시). 인라인 요소라 fixed 컨테이너로 감쌈. */}
      {env.VITE_NOTIFYDESK_URL && user?.id ? (
        <div
          style={{
            position: 'fixed',
            top: 14,
            right: 16,
            zIndex: 2147483000,
          }}
        >
          <NotificationBell
            recipientId={user.id}
            publishableKey={PK(env.VITE_NOTIFYDESK_PK)}
            endpoint={env.VITE_NOTIFYDESK_URL}
            align="right"
          />
        </div>
      ) : null}

      {/* SearchDesk — ⌘K / Ctrl+K 커맨드 팔레트(트리거 전엔 null 반환). */}
      {env.VITE_SEARCHDESK_URL && (
        <SearchPalette
          publishableKey={PK(env.VITE_SEARCHDESK_PK)}
          endpoint={env.VITE_SEARCHDESK_URL}
          hotkey="mod+k"
        />
      )}

      {/* 콘텐츠 위젯(리뷰·커뮤니티·미디어·신고) — 별도 페이지가 없어 떠있는 드로어로. */}
      <DeskCloudDock />
    </>
  )
}

export default DeskCloudWidgets
