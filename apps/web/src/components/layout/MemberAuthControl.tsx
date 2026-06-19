import { cn } from '@utils/cn'
import { LogIn, LogOut, User as UserIcon } from 'lucide-react'
import { useState } from 'react'

import { AuthDialog, useAuth } from '@/lib/firebaseAuth'

/**
 * 헤더 회원 로그인 진입점 — Firebase Auth(이메일/비밀번호 + 게스트) 기반.
 *
 * 이 컨트롤은 기존 토큰 기반 콘솔 로그인(/login·/register, Google GIS + 이메일)과 **별개**다.
 * 통합 Firebase 로그인 모듈을 추가 옵션으로 노출한다(비파괴적).
 * 로그아웃 상태면 "로그인" 버튼으로 AuthDialog 를 열고, 로그인 상태면 이메일(또는
 * "게스트")과 로그아웃을 보여준다.
 */
export default function MemberAuthControl({ className }: { className?: string }) {
  const { user, loading, signOut } = useAuth()
  const [open, setOpen] = useState(false)

  if (loading) {
    // 초기 onAuthStateChanged 해석 전 — 레이아웃 점프 방지용 플레이스홀더.
    return (
      <div
        className={cn(
          'h-8 w-20 animate-pulse rounded-full bg-canvas-deep dark:bg-night-sub',
          className
        )}
        aria-hidden
      />
    )
  }

  if (!user) {
    return (
      <div className={className}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 text-[0.83rem] font-medium px-3 py-1.5 rounded-full text-ink-soft dark:text-bone-soft hover:text-ink dark:hover:text-bone motion-safe:transition ease-expo focus-volt"
        >
          <LogIn aria-hidden className="w-4 h-4" />
          <span className="hidden sm:inline">로그인</span>
        </button>
        <AuthDialog open={open} onOpenChange={setOpen} />
      </div>
    )
  }

  const label = user.isAnonymous ? '게스트' : (user.email ?? '회원')

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <span
        className="hidden max-w-[12rem] items-center gap-1.5 truncate rounded-full bg-canvas-deep dark:bg-night-sub px-2.5 py-1 text-[0.78rem] text-ink-soft dark:text-bone-soft sm:inline-flex"
        title={label}
      >
        <UserIcon aria-hidden className="w-3.5 h-3.5 shrink-0 text-ink-mute dark:text-bone-mute" />
        <span className="truncate">{label}</span>
      </span>
      <button
        type="button"
        onClick={() => void signOut()}
        aria-label={`${label} 로그아웃`}
        title="로그아웃"
        className="inline-flex items-center justify-center w-8 h-8 rounded-full text-ink-soft dark:text-bone-soft hover:text-coral-deep dark:hover:text-coral motion-safe:transition ease-expo focus-volt"
      >
        <LogOut aria-hidden className="w-4 h-4" />
      </button>
    </div>
  )
}
