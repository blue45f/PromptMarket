import { JwtService } from '@nestjs/jwt'
import { describe, expect, it } from 'vitest'

import { TokenService } from './token.service'

const SECRET = 'test-secret-please-change'

function makeService() {
  const jwt = new JwtService({ secret: SECRET })
  return { tokens: new TokenService(jwt), jwt }
}

const user = { id: 'u1', email: 'a@b.com', username: 'alex', isAdmin: true }

describe('TokenService', () => {
  it('round-trips PromptMarket claims (id/email/username/isAdmin)', () => {
    const { tokens } = makeService()
    const token = tokens.sign(user)
    expect(tokens.verify(token)).toEqual(user)
  })

  it('stays backward compatible with legacy @nestjs/jwt tokens (same secret + claim shape)', () => {
    const { tokens, jwt } = makeService()
    // 기존 AuthService.signToken 이 만들던 토큰(동일 시크릿·클레임)도 그대로 검증된다 →
    // 채택 배포 시 이미 발급된 토큰이 무효화되지 않음(강제 로그아웃 없음).
    const legacy = jwt.sign(
      { sub: 'u9', email: 'x@y.com', username: 'xy', isAdmin: false },
      { expiresIn: '7d' }
    )
    expect(tokens.verify(legacy)).toEqual({
      id: 'u9',
      email: 'x@y.com',
      username: 'xy',
      isAdmin: false,
    })
  })

  it('throws on a token signed with a different secret', () => {
    const { tokens } = makeService()
    const foreign = new JwtService({ secret: 'a-different-secret' }).sign({ sub: 'u1' })
    expect(() => tokens.verify(foreign)).toThrow()
  })

  it('implements the @heejun/auth TokenIssuer port (issueAccess/verifyAccess maps isAdmin↔roles)', async () => {
    const { tokens } = makeService()
    const token = await tokens.issueAccess({
      userId: 'u1',
      appId: 'promptmarket',
      roles: ['admin'],
      email: 'a@b.com',
    })
    const principal = await tokens.verifyAccess(token)
    expect(principal.userId).toBe('u1')
    expect(principal.roles).toContain('admin')
  })
})
