import { createContext } from 'react'

/** 앱 전반에서 쓰는 가벼운 사용자 형태(Firebase User 의 안전한 부분집합). */
export interface AuthUser {
  uid: string
  email: string | null
  isAnonymous: boolean
  displayName: string | null
}

export interface AuthState {
  /** 현재 사용자(미로그인 시 null). */
  user: AuthUser | null
  /** 초기 onAuthStateChanged 해석 전이면 true. */
  loading: boolean
  /** 최근 인증 작업의 한국어 에러 메시지(없으면 null). */
  error: string | null
  signUp(email: string, password: string): Promise<void>
  signIn(email: string, password: string): Promise<void>
  signInAsGuest(): Promise<void>
  signOut(): Promise<void>
  /** 표시된 에러를 비운다(예: 다이얼로그 모드 토글 시). */
  clearError(): void
}

/**
 * 컨텍스트는 컴포넌트 파일과 분리한다 — `AuthProvider.tsx` 가 컴포넌트만 export 하도록 해
 * react-refresh(fast-refresh)의 only-export-components 규칙을 만족시킨다.
 * Provider 밖에서 소비하면 즉시 throw(useAuth 참고).
 */
export const AuthContext = createContext<AuthState | null>(null)

/**
 * Firebase `auth/*` 에러 코드를 친근한 한국어 메시지로 매핑.
 * 모르는 코드는 일반 메시지로 폴백한다(원시 코드를 노출하지 않음).
 */
export function authErrorMessage(code: string | undefined): string {
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return '이메일 또는 비밀번호가 올바르지 않습니다.'
    case 'auth/email-already-in-use':
      return '이미 가입된 이메일입니다. 로그인해 주세요.'
    case 'auth/weak-password':
      return '비밀번호가 너무 약합니다. 6자 이상으로 설정해 주세요.'
    case 'auth/invalid-email':
      return '이메일 형식이 올바르지 않습니다.'
    case 'auth/missing-password':
      return '비밀번호를 입력해 주세요.'
    case 'auth/user-disabled':
      return '비활성화된 계정입니다. 관리자에게 문의하세요.'
    case 'auth/too-many-requests':
      return '시도가 너무 많습니다. 잠시 후 다시 시도해 주세요.'
    case 'auth/network-request-failed':
      return '네트워크 오류가 발생했습니다. 연결을 확인해 주세요.'
    case 'auth/operation-not-allowed':
      return '이 로그인 방식은 현재 사용할 수 없습니다.'
    case 'auth/popup-closed-by-user':
      return '로그인 창이 닫혔습니다. 다시 시도해 주세요.'
    case 'auth/configuration-not-found':
    case 'auth/invalid-api-key':
      return '인증 설정이 올바르지 않습니다. 환경변수(VITE_FIREBASE_*)를 확인하세요.'
    default:
      return '요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.'
  }
}
