/**
 * 통합 로그인(Firebase Auth) 모듈 — 형제 앱에 벤더링되는 단일 소스.
 *
 * 사용:
 *   1) 앱 루트에 <AuthProvider> 마운트
 *   2) 어디서든 useAuth() 로 { user, loading, error, signIn, signUp, signInAsGuest, signOut }
 *   3) 로그인 진입점에서 <AuthDialog open onOpenChange={...} />
 *
 * 설정은 env(VITE_FIREBASE_*)로만 주입한다 — config.ts 참고(리터럴 금지).
 */
export { AuthProvider } from './AuthProvider'
export { AuthDialog } from './AuthDialog'
export { useAuth } from './useAuth'
export { isFirebaseAuthConfigured } from './config'
export type { AuthUser, AuthState } from './context'
