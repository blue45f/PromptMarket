import { ConflictException, UnauthorizedException } from '@nestjs/common'
import * as argon2 from 'argon2'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AuthService } from './auth.service'
import { Argon2Hasher } from './heejun/argon2-hasher'

import type { OAuthProfile, OAuthVerifier } from '@heejun/auth'

vi.mock('argon2', () => ({
  hash: vi.fn(async (pw: string) => `hashed:${pw}`),
  verify: vi.fn(async (hash: string, pw: string) => hash === `hashed:${pw}`),
}))

type PrismaArg = ConstructorParameters<typeof AuthService>[0]
type TokensArg = ConstructorParameters<typeof AuthService>[1]
type ConfigArg = ConstructorParameters<typeof AuthService>[3]

const baseUser = {
  id: 'u1',
  email: 'a@b.com',
  username: 'alex',
  passwordHash: 'hashed:s3cret',
  bio: null,
  avatarUrl: null,
  isAdmin: false,
  balanceCents: 0,
  googleSub: null,
  suspendedAt: null,
  createdAt: new Date('2026-05-01T00:00:00Z'),
}

function makePrisma(
  overrides: Partial<{
    findFirst: unknown
    findUnique: unknown
    created: unknown
    updated: unknown
  }> = {}
): PrismaArg {
  return {
    user: {
      findFirst: vi.fn().mockResolvedValue(overrides.findFirst ?? null),
      findUnique: vi.fn().mockResolvedValue(overrides.findUnique ?? null),
      create: vi.fn().mockResolvedValue(overrides.created ?? baseUser),
      update: vi.fn().mockResolvedValue(overrides.updated ?? baseUser),
    },
  } as unknown as PrismaArg
}

function makeTokens(): TokensArg {
  return { sign: vi.fn().mockReturnValue('signed-token'), verify: vi.fn() } as unknown as TokensArg
}

// Password-path tests don't touch Google, so GOOGLE_CLIENT_ID can be undefined.
function makeConfig(googleClientId?: string): ConfigArg {
  return { get: vi.fn(() => googleClientId) } as unknown as ConfigArg
}

function makeOauth(profile?: OAuthProfile): OAuthVerifier {
  return {
    verify: vi
      .fn()
      .mockResolvedValue(profile ?? { sub: 'g-sub', email: 'New@Gmail.com', emailVerified: true }),
  }
}

function makeService(
  prismaOverrides: Parameters<typeof makePrisma>[0] = {},
  opts: { tokens?: TokensArg; config?: ConfigArg; oauth?: OAuthVerifier | null } = {}
) {
  const prisma = makePrisma(prismaOverrides)
  const tokens = opts.tokens ?? makeTokens()
  const svc = new AuthService(
    prisma,
    tokens,
    new Argon2Hasher(),
    opts.config ?? makeConfig(),
    opts.oauth ?? null
  )
  return { svc, prisma, tokens }
}

beforeEach(() => {
  vi.mocked(argon2.hash).mockClear()
  vi.mocked(argon2.verify).mockClear()
})

describe('AuthService.register', () => {
  it('rejects when email or username already exists', async () => {
    const { svc } = makeService({ findFirst: { id: 'taken' } })
    await expect(
      svc.register({ email: 'a@b.com', username: 'alex', password: 's3cret' } as never)
    ).rejects.toBeInstanceOf(ConflictException)
  })

  it('hashes the password via argon2 before persisting', async () => {
    const { svc, prisma } = makeService()
    await svc.register({ email: 'a@b.com', username: 'alex', password: 's3cret' } as never)
    expect(argon2.hash).toHaveBeenCalledWith('s3cret')
    const createSpy = (prisma as unknown as { user: { create: ReturnType<typeof vi.fn> } }).user
      .create
    expect(createSpy.mock.calls[0][0].data.passwordHash).toBe('hashed:s3cret')
    expect(createSpy.mock.calls[0][0].data.balanceCents).toBe(0)
  })

  it('returns a token + the public user (never the passwordHash)', async () => {
    const { svc, tokens } = makeService()
    const out = await svc.register({
      email: 'a@b.com',
      username: 'alex',
      password: 's3cret',
    } as never)
    expect(out.token).toBe('signed-token')
    expect(out.user).not.toHaveProperty('passwordHash')
    expect(out.user).toEqual({
      id: 'u1',
      email: 'a@b.com',
      username: 'alex',
      bio: null,
      avatarUrl: null,
      isAdmin: false,
      balanceCents: 0,
      createdAt: baseUser.createdAt,
    })
    expect((tokens as unknown as { sign: ReturnType<typeof vi.fn> }).sign).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'u1', email: 'a@b.com', username: 'alex', isAdmin: false })
    )
  })
})

describe('AuthService.login', () => {
  it('returns 401 when the email is unknown', async () => {
    const { svc } = makeService({ findUnique: null })
    await expect(svc.login({ email: 'no@one.com', password: 'x' } as never)).rejects.toBeInstanceOf(
      UnauthorizedException
    )
  })

  it('returns 401 when the password does not match', async () => {
    const { svc } = makeService({ findUnique: baseUser })
    await expect(
      svc.login({ email: 'a@b.com', password: 'wrong' } as never)
    ).rejects.toBeInstanceOf(UnauthorizedException)
  })

  it('returns 401 even when argon2.verify throws (corrupt hash)', async () => {
    vi.mocked(argon2.verify).mockRejectedValueOnce(new Error('boom'))
    const { svc } = makeService({ findUnique: baseUser })
    await expect(
      svc.login({ email: 'a@b.com', password: 's3cret' } as never)
    ).rejects.toBeInstanceOf(UnauthorizedException)
  })

  it('rejects suspended accounts', async () => {
    const { svc } = makeService({ findUnique: { ...baseUser, suspendedAt: new Date() } })
    await expect(svc.login({ email: 'a@b.com', password: 's3cret' } as never)).rejects.toThrow(
      /suspended/i
    )
  })

  it('returns a token + public user on success', async () => {
    const { svc } = makeService({ findUnique: baseUser })
    const out = await svc.login({ email: 'a@b.com', password: 's3cret' } as never)
    expect(out.token).toBe('signed-token')
    expect(out.user).not.toHaveProperty('passwordHash')
    expect(out.user.id).toBe('u1')
    expect(out.user.isAdmin).toBe(false)
  })
})

describe('AuthService.googleAuth', () => {
  it('rejects when Google sign-in is not configured (no verifier)', async () => {
    const { svc } = makeService({}, { oauth: null })
    await expect(svc.googleAuth('cred')).rejects.toBeInstanceOf(UnauthorizedException)
  })

  it('rejects when the ID token email is not verified', async () => {
    const oauth = makeOauth({ sub: 'g1', email: 'x@gmail.com', emailVerified: false })
    const { svc } = makeService({}, { oauth })
    await expect(svc.googleAuth('cred')).rejects.toBeInstanceOf(UnauthorizedException)
  })

  it('creates a new user (lowercased email, derived username) on first Google sign-in', async () => {
    const oauth = makeOauth({ sub: 'g-sub', email: 'New@Gmail.com', emailVerified: true })
    const created = { ...baseUser, id: 'g-user', email: 'new@gmail.com', username: 'new' }
    const { svc, prisma, tokens } = makeService({ created }, { oauth })
    const out = await svc.googleAuth('cred')
    expect(out.token).toBe('signed-token')
    const createSpy = (prisma as unknown as { user: { create: ReturnType<typeof vi.fn> } }).user
      .create
    expect(createSpy.mock.calls[0][0].data).toMatchObject({
      email: 'new@gmail.com',
      provider: 'google',
      googleSub: 'g-sub',
    })
    expect((tokens as unknown as { sign: ReturnType<typeof vi.fn> }).sign).toHaveBeenCalled()
  })

  it('links Google to an existing account on first use', async () => {
    const oauth = makeOauth({ sub: 'g-new', email: 'a@b.com', emailVerified: true })
    const { svc, prisma } = makeService({ findUnique: { ...baseUser, googleSub: null } }, { oauth })
    await svc.googleAuth('cred')
    const updateSpy = (prisma as unknown as { user: { update: ReturnType<typeof vi.fn> } }).user
      .update
    expect(updateSpy.mock.calls[0][0].data).toEqual({ googleSub: 'g-new' })
  })
})

describe('AuthService.me', () => {
  it('throws Unauthorized when the user is gone', async () => {
    const { svc } = makeService({ findUnique: null })
    await expect(svc.me('u1')).rejects.toBeInstanceOf(UnauthorizedException)
  })

  it('returns the public user without the passwordHash', async () => {
    const { svc } = makeService({ findUnique: baseUser })
    const out = await svc.me('u1')
    expect(out).not.toHaveProperty('passwordHash')
    expect(out.id).toBe('u1')
    expect(out.balanceCents).toBe(0)
  })
})
