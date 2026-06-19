import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'

import { firebaseConfig, isFirebaseAuthConfigured } from './config'

/**
 * Firebase 앱 + Auth 싱글턴 — HMR 안전 + 미설정 안전.
 *
 * Vite dev 의 모듈 핫리로드로 이 파일이 재평가돼도 `initializeApp` 을 다시 부르면
 * "Firebase App named '[DEFAULT]' already exists" 가 난다. 이미 초기화돼 있으면
 * `getApp()` 으로 재사용한다.
 *
 * `getAuth` 는 apiKey 가 비면(`auth/invalid-api-key`) **모듈 평가 시점에 throw** 한다.
 * env 미설정(테스트/no-env 빌드) 환경에서도 이 모듈을 import 만 해도 크래시하지 않도록,
 * Auth 는 설정이 있을 때만 **지연 초기화**한다. 모든 실제 소비자(AuthProvider)는
 * `isFirebaseAuthConfigured` 로 게이트한 뒤에만 `auth` 에 접근하므로 동작은 동일하다.
 */
export const firebaseApp: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig)

let authSingleton: Auth | null = null

/** 설정이 있을 때만 Auth 를 초기화해 반환한다. 미설정이면 `null`(소비자가 게이트). */
export function getAuthInstance(): Auth | null {
  if (!isFirebaseAuthConfigured) return null
  authSingleton ??= getAuth(firebaseApp)
  return authSingleton
}
