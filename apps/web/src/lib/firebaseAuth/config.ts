/**
 * Firebase 웹 설정 — 리터럴 금지, env(`VITE_FIREBASE_*`)에서만 읽는다.
 *
 * Firebase 웹 apiKey 는 기술적으로 **공개 식별자**지만(보안은 Auth 규칙 +
 * authorizedDomains 로 집행), 저장소 시크릿 스캔 훅이 `AIza…` 패턴을 차단하므로
 * 절대 소스에 박지 않고 env 로 주입한다. 실제 값은 로컬 `.env.local`(gitignored)
 * + Vercel 프로젝트 env 로 공급(`~/.config/deskcloud-firebase.env`에 비커밋 보관).
 *
 * projectId / authDomain 은 비밀이 아닌 고정 식별자라 안전한 기본값을 둔다(env 오버라이드 가능).
 * 나머지(apiKey·appId·senderId·storageBucket)는 env 가 없으면 `undefined` — 그래도
 * 객체/번들은 정상 빌드되며, 런타임 인증을 시도할 때만 값이 필요하다.
 *
 * 형제 앱 간 벤더링되는 단일 소스다(디자인 토큰 무관 — 그대로 복사).
 */
const env = import.meta.env

/** 기본 프로젝트(비밀 아님) — env 미설정 시 사용. */
export const DEFAULT_PROJECT_ID = 'deskcloud-fleet-auth'
export const DEFAULT_AUTH_DOMAIN = `${DEFAULT_PROJECT_ID}.firebaseapp.com`

export const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN ?? DEFAULT_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID ?? DEFAULT_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
} as const

/**
 * 런타임 인증 가능 여부 — apiKey/appId 가 주입됐는지로 판단.
 * UI 는 이 값으로 "환경변수 미설정" 안내를 띄워 친절히 degrade 할 수 있다.
 */
export const isFirebaseAuthConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.appId)
