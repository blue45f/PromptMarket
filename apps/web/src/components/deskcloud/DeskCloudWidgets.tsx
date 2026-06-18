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
 *     SearchPalette    — 글로벌 검색 팔레트(mod+/; ⌘K 는 자체 카탈로그 팔레트 전용)
 * - 콘텐츠(별도 페이지가 없어 셸 떠있는 런처로):
 *     DeskCloudDock    — 리뷰·커뮤니티·미디어·신고(ReportButton) 위젯을 담는 드로어
 *
 * NotifyDesk 알림 벨은 여기서 띄우지 않고 내비바의 기존 벨 자리(NavbarNotificationBell)
 * 에서 렌더합니다 — 설정 시 라이브 NotifyDesk, 미설정 시 자체 벨 폴백(중복/충돌 방지).
 *
 * 앱의 기존 기능(자체 Navbar 의 SearchBar·카탈로그 ⌘K 팔레트 등)은 건드리지 않습니다.
 * DeskCloud 위젯은 전부 스코프 CSS(.cd-/.nd-/.sk-/.rd-/.dc-…)라 토큰 시스템과 충돌
 * 하지 않습니다.
 * ──────────────────────────────────────────────────────────────────────────
 */
import { type ReactElement } from 'react'

import { ChangelogWidget } from './changelogdesk/ChangelogWidget'
import { DeskCloudDock } from './DeskCloudDock'
import { SearchPalette } from './searchdesk/SearchPalette'

const env = import.meta.env

const PK = (specific: string | undefined): string => specific ?? 'pk_demo'

export function DeskCloudWidgets(): ReactElement {
  return (
    <>
      {/* ChangelogDesk — 'What's new' 런처. 우하단은 SurveyDesk 피드백 런처가
          이미 쓰므로(둘 다 br 이면 겹침), 좌하단에 둡니다. DeskCloudDock 런처는
          이 위로 스택되어(아래 .dc-launcher bottom 오프셋) 서로 겹치지 않습니다. */}
      {env.VITE_CHANGELOGDESK_URL && (
        <ChangelogWidget
          publishableKey={PK(env.VITE_CHANGELOGDESK_PK)}
          endpoint={env.VITE_CHANGELOGDESK_URL}
          position="bottom-left"
        />
      )}

      {/* NotifyDesk — 알림 벨은 내비바의 기존 벨 자리에서 NavbarNotificationBell 로
          렌더합니다(설정 시 라이브 NotifyDesk, 미설정 시 자체 벨 폴백). 별도의 떠있는
          벨을 두지 않아 내비바 벨과 중복/충돌하지 않습니다. */}

      {/* SearchDesk — 글로벌 검색 팔레트. 자체 카탈로그 ⌘K 팔레트(핵심 기능)와의
          단축키 충돌을 피하려 mod+/ 로 바인딩합니다(⌘K 는 자체 팔레트 전용). */}
      {env.VITE_SEARCHDESK_URL && (
        <SearchPalette
          publishableKey={PK(env.VITE_SEARCHDESK_PK)}
          endpoint={env.VITE_SEARCHDESK_URL}
          hotkey="mod+/"
        />
      )}

      {/* 콘텐츠 위젯(리뷰·커뮤니티·미디어·신고) — 별도 페이지가 없어 떠있는 드로어로. */}
      <DeskCloudDock />
    </>
  )
}

export default DeskCloudWidgets
