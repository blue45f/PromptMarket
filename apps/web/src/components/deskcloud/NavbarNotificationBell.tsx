/**
 * NavbarNotificationBell — NotifyDesk(라이브) ↔ 자체 벨(폴백) 선택 래퍼.
 * ──────────────────────────────────────────────────────────────────────────
 * 내비바의 알림 벨 자리에서, NotifyDesk 가 설정(VITE_NOTIFYDESK_URL)되면 라이브
 * 인박스 벨을 그 자리에 그대로 렌더하고, 미설정(기본)이면 기존 자체 정적 벨을
 * 폴백으로 렌더합니다. 즉 NotifyDesk 가 "설정 시 우선 경로", 자체 벨이 폴백 —
 * 되돌리기 가능(env 만 비우면 자체 벨로 복귀). 둘은 절대 동시에 뜨지 않습니다.
 *
 * NotifyDesk 벨은 자기-완결(.nd-* 스코프 CSS)이라 토큰 시스템과 충돌하지 않고,
 * 인라인 요소라 내비바 아이콘 클러스터에 그대로 들어갑니다. 비로그인/익명 또는
 * NotifyDesk 미설정 시에는 자체 벨 경로를 그대로 사용합니다.
 * ──────────────────────────────────────────────────────────────────────────
 */
import HomegrownNotificationBell from '@components/NotificationBell'
import { useAuthStore } from '@store/auth'
import { type ReactElement } from 'react'

import { NotificationBell as NotifyDeskBell } from './NotificationBell'

const env = import.meta.env
const PK = (specific: string | undefined): string => specific ?? 'pk_demo'

export default function NavbarNotificationBell(): ReactElement {
  const user = useAuthStore((s) => s.user)

  // 설정 시 우선 경로: NotifyDesk 라이브 인박스. recipientId 가 있어야(로그인)
  // 의미가 있으므로 user.id 가 있을 때만 라이브 벨을 띄우고, 그 외엔 폴백.
  if (env.VITE_NOTIFYDESK_URL && user?.id) {
    return (
      <NotifyDeskBell
        recipientId={user.id}
        publishableKey={PK(env.VITE_NOTIFYDESK_PK)}
        endpoint={env.VITE_NOTIFYDESK_URL}
        align="right"
        // 액센트는 위젯 기본값(대비-균형 잡힌 뉴트럴 블루)을 유지합니다. NotifyDesk 는
        // --nd-accent 단일 토큰을 '흰 배경 위 텍스트'와 '채움 배경' 양쪽에 쓰는데,
        // 앱의 volt 라임(L≈0.83)은 채움엔 좋아도 흰 배경 텍스트로는 대비 미달이라
        // 무리하게 주입하면 가독성 회귀가 납니다. 정체성은 내비바 맥락이 이미 전달.
      />
    )
  }

  // 폴백: 기존 자체 정적 벨(NotifyDesk 미설정 또는 익명 시).
  return <HomegrownNotificationBell />
}
