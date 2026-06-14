import { GoogleOAuthVerifier } from '@heejun/auth'
import { ConfigService } from '@nestjs/config'

import type { OAuthVerifier } from '@heejun/auth'
import type { Provider } from '@nestjs/common'

/** AuthService 가 주입받는 OAuth ID 토큰 검증기(미구성 시 null). */
export const OAUTH_VERIFIER = 'OAUTH_VERIFIER'

/**
 * `@heejun/auth` 의 `GoogleOAuthVerifier`(jose 원격 JWKS, GIS 플로 표준)를 제공한다.
 * 기존 인라인 `google-auth-library` 검증과 동치(서명·issuer·audience·email_verified 확인)
 * 이며, GOOGLE_CLIENT_ID 미설정 시 null → `AuthService.googleAuth` 가 "미구성" 401.
 */
export const oauthVerifierProvider: Provider = {
  provide: OAUTH_VERIFIER,
  inject: [ConfigService],
  useFactory: (config: ConfigService): OAuthVerifier | null => {
    const clientId = config.get<string>('GOOGLE_CLIENT_ID')?.trim()
    return clientId ? new GoogleOAuthVerifier(clientId) : null
  },
}
