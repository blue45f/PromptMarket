import { useContext } from 'react'

import { AuthContext, type AuthState } from './context'

/**
 * Firebase Auth 컨텍스트 소비 훅.
 * `<AuthProvider>` 안에서만 호출한다 — 밖에서 호출하면 즉시 throw 해 배선 실수를 빨리 드러낸다.
 */
export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth 는 <AuthProvider> 안에서만 사용할 수 있습니다.')
  }
  return ctx
}
