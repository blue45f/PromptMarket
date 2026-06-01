import { UnauthorizedException } from '@nestjs/common'
import type { ExecutionContext } from '@nestjs/common'
import type { JwtService } from '@nestjs/jwt'
import { describe, expect, it, vi } from 'vitest'
import { JwtAuthGuard } from './jwt-auth.guard'

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

function makeGuard(verifyImpl: (token: string) => unknown) {
  const jwt = { verify: vi.fn().mockImplementation(verifyImpl) } as unknown as JwtService
  return { guard: new JwtAuthGuard(jwt), jwt }
}

describe('JwtAuthGuard', () => {
  it('rejects requests with no Authorization header', () => {
    const { guard } = makeGuard(() => ({}))
    const { context } = makeContext({ authorization: undefined })
    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException)
  })

  it('rejects non-Bearer schemes', () => {
    const { guard } = makeGuard(() => ({}))
    const { context } = makeContext({ authorization: 'Basic abc' })
    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException)
  })

  it('rejects an invalid token (verify throws)', () => {
    const { guard } = makeGuard(() => {
      throw new Error('bad sig')
    })
    const { context } = makeContext({ authorization: 'Bearer xxx' })
    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException)
  })

  it('extracts the bearer token, decodes it, and writes req.user', () => {
    const { guard, jwt } = makeGuard(() => ({
      sub: 'u1',
      email: 'a@b.com',
      username: 'alex',
    }))
    const { context, req } = makeContext({ authorization: 'Bearer t-1' })
    expect(guard.canActivate(context)).toBe(true)
    expect(jwt.verify).toHaveBeenCalledWith('t-1')
    expect(req.user).toEqual({ id: 'u1', email: 'a@b.com', username: 'alex', isAdmin: false })
  })

  it('strips whitespace around the token', () => {
    const { guard, jwt } = makeGuard(() => ({ sub: 'u1' }))
    const { context } = makeContext({ authorization: 'Bearer    t-1   ' })
    expect(guard.canActivate(context)).toBe(true)
    expect(jwt.verify).toHaveBeenCalledWith('t-1')
  })
})
