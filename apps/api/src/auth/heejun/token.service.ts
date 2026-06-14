import { Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'

import type { AccessSubject, TokenIssuer } from '@heejun/auth'
import type { Principal, Role } from '@heejun/contracts'

/** PromptMarket 액세스 토큰의 클레임/복호 형태(req.user 와 동일). */
export interface TokenClaims {
  id: string
  email: string
  username: string
  isAdmin: boolean
}

const ACCESS_TTL = '7d'

/**
 * `@heejun/auth` `TokenIssuer` 포트 구현.
 *
 * 토큰 발급/검증을 한 곳에 모아 플랫폼 계약에 맞춘다. 내부적으로 기존 `@nestjs/jwt`
 * 를 그대로 사용하므로 클레임 형태(`{ sub, email, username, isAdmin }`)·HS256·TTL(7d)·
 * 시크릿이 모두 동일 — **이미 발급된 토큰이 그대로 검증되어 강제 로그아웃이 없다.**
 *
 * `sign`/`verify` 가 PromptMarket 고유 클레임(username·isAdmin)을 보존하는 실사용
 * 경로이고, `issueAccess`/`verifyAccess` 는 향후 코어 `AuthService`(refresh 회전 등)
 * 채택을 대비한 포트 표준 진입점이다.
 */
@Injectable()
export class TokenService implements TokenIssuer {
  constructor(private readonly jwt: JwtService) {}

  /** PromptMarket 클레임으로 액세스 토큰 발급(기존 signToken 대체). */
  sign(user: TokenClaims): string {
    return this.jwt.sign(
      { sub: user.id, email: user.email, username: user.username, isAdmin: user.isAdmin },
      { expiresIn: ACCESS_TTL }
    )
  }

  /** 가드용: 토큰을 검증해 req.user 형태로 복원(유효하지 않으면 throw). */
  verify(token: string): TokenClaims {
    const payload = this.jwt.verify(token) as {
      sub: string
      email?: string
      username?: string
      isAdmin?: boolean
    }
    return {
      id: payload.sub,
      email: payload.email ?? '',
      username: payload.username ?? '',
      isAdmin: !!payload.isAdmin,
    }
  }

  // ── @heejun/auth TokenIssuer 표준 인터페이스(향후 코어 AuthService 채택 대비) ──
  // Principal/AccessSubject 는 username 을 담지 않으므로 표준 경로는 isAdmin↔roles 만
  // 매핑한다. 실사용(가드/로그인)은 username 을 보존하는 sign/verify 를 거친다.

  issueAccess(subject: AccessSubject): Promise<string> {
    return Promise.resolve(
      this.sign({
        id: subject.userId,
        email: subject.email ?? '',
        username: '',
        isAdmin: subject.roles.includes('admin' as Role),
      })
    )
  }

  verifyAccess(token: string): Promise<Principal> {
    const claims = this.verify(token)
    return Promise.resolve({
      userId: claims.id,
      email: claims.email,
      roles: claims.isAdmin ? (['admin'] as Role[]) : [],
    })
  }
}
