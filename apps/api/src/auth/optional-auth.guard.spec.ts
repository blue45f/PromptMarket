import { describe, expect, it, vi } from 'vitest'

import { OptionalAuthGuard } from './optional-auth.guard'

import type { TokenClaims, TokenService } from './heejun/token.service'
import type { ExecutionContext } from '@nestjs/common'

function makeContext(headers: Record<string, string | undefined>): {
  context: ExecutionContext
  req: { headers: Record<string, string | undefined>; user?: unknown }
} {
  const req = { headers }
  const context = {
    switchToHttp: () => ({ getRequest: () => req }),
  } as unknown as ExecutionContext
  return { context, req }
}

function makeGuard(verifyImpl: (token: string) => TokenClaims) {
  const tokens = { verify: vi.fn().mockImplementation(verifyImpl) } as unknown as TokenService
  return { guard: new OptionalAuthGuard(tokens), tokens }
}

const claims: TokenClaims = { id: 'u1', email: 'a@b.com', username: 'alex', isAdmin: false }

describe('OptionalAuthGuard', () => {
  it('passes through without setting req.user when no header is present', () => {
    const { guard } = makeGuard(() => claims)
    const { context, req } = makeContext({ authorization: undefined })
    expect(guard.canActivate(context)).toBe(true)
    expect(req.user).toBeUndefined()
  })

  it('passes through without setting req.user when the scheme is not Bearer', () => {
    const { guard } = makeGuard(() => claims)
    const { context, req } = makeContext({ authorization: 'Basic x' })
    expect(guard.canActivate(context)).toBe(true)
    expect(req.user).toBeUndefined()
  })

  it('passes through without rejecting when the token is invalid', () => {
    const { guard } = makeGuard(() => {
      throw new Error('bad sig')
    })
    const { context, req } = makeContext({ authorization: 'Bearer bad' })
    expect(guard.canActivate(context)).toBe(true)
    expect(req.user).toBeUndefined()
  })

  it('decodes and attaches req.user when the token is valid', () => {
    const { guard } = makeGuard(() => claims)
    const { context, req } = makeContext({ authorization: 'Bearer t-1' })
    expect(guard.canActivate(context)).toBe(true)
    expect(req.user).toEqual(claims)
  })
})
