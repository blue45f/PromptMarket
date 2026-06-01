import { ConflictException, UnauthorizedException } from '@nestjs/common'
import type { JwtService } from '@nestjs/jwt'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('argon2', () => ({
  hash: vi.fn(async (pw: string) => `hashed:${pw}`),
  verify: vi.fn(async (hash: string, pw: string) => hash === `hashed:${pw}`),
}))

import * as argon2 from 'argon2'
import { AuthService } from './auth.service'

type PrismaArg = ConstructorParameters<typeof AuthService>[0]
type JwtArg = ConstructorParameters<typeof AuthService>[1]

const baseUser = {
  id: 'u1',
  email: 'a@b.com',
  username: 'alex',
  passwordHash: 'hashed:s3cret',
  bio: null,
  avatarUrl: null,
  isAdmin: false,
  balanceCents: 0,
  createdAt: new Date('2026-05-01T00:00:00Z'),
}

function makePrisma(
  overrides: Partial<{
    findFirst: unknown
    findUnique: unknown
    created: unknown
  }> = {}
): PrismaArg {
  return {
    user: {
      findFirst: vi.fn().mockResolvedValue(overrides.findFirst ?? null),
      findUnique: vi.fn().mockResolvedValue(overrides.findUnique ?? null),
      create: vi.fn().mockResolvedValue(overrides.created ?? baseUser),
    },
  } as unknown as PrismaArg
}

function makeJwt(): JwtArg {
  return { sign: vi.fn().mockReturnValue('signed-token') } as unknown as JwtArg
}

beforeEach(() => {
  vi.mocked(argon2.hash).mockClear()
  vi.mocked(argon2.verify).mockClear()
})

describe('AuthService.register', () => {
  it('rejects when email or username already exists', async () => {
    const svc = new AuthService(makePrisma({ findFirst: { id: 'taken' } }), makeJwt())
    await expect(
      svc.register({
        email: 'a@b.com',
        username: 'alex',
        password: 's3cret',
      } as never)
    ).rejects.toBeInstanceOf(ConflictException)
  })

  it('hashes the password via argon2 before persisting', async () => {
    const prisma = makePrisma()
    const svc = new AuthService(prisma, makeJwt())
    await svc.register({
      email: 'a@b.com',
      username: 'alex',
      password: 's3cret',
    } as never)
    expect(argon2.hash).toHaveBeenCalledWith('s3cret')
    const createSpy = (
      prisma as unknown as {
        user: { create: ReturnType<typeof vi.fn> }
      }
    ).user.create
    expect(createSpy.mock.calls[0][0].data.passwordHash).toBe('hashed:s3cret')
    expect(createSpy.mock.calls[0][0].data.balanceCents).toBe(0)
  })

  it('returns a token + the public user (never the passwordHash)', async () => {
    const jwt = makeJwt()
    const svc = new AuthService(makePrisma(), jwt)
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
    expect((jwt as unknown as { sign: ReturnType<typeof vi.fn> }).sign).toHaveBeenCalledWith(
      { sub: 'u1', email: 'a@b.com', username: 'alex', isAdmin: false },
      { expiresIn: '7d' }
    )
  })
})

describe('AuthService.login', () => {
  it('returns 401 when the email is unknown', async () => {
    const svc = new AuthService(makePrisma({ findUnique: null }), makeJwt())
    await expect(svc.login({ email: 'no@one.com', password: 'x' } as never)).rejects.toBeInstanceOf(
      UnauthorizedException
    )
  })

  it('returns 401 when the password does not match', async () => {
    const svc = new AuthService(makePrisma({ findUnique: baseUser }), makeJwt())
    await expect(
      svc.login({ email: 'a@b.com', password: 'wrong' } as never)
    ).rejects.toBeInstanceOf(UnauthorizedException)
  })

  it('returns 401 even when argon2.verify throws (corrupt hash)', async () => {
    vi.mocked(argon2.verify).mockRejectedValueOnce(new Error('boom'))
    const svc = new AuthService(makePrisma({ findUnique: baseUser }), makeJwt())
    await expect(
      svc.login({ email: 'a@b.com', password: 's3cret' } as never)
    ).rejects.toBeInstanceOf(UnauthorizedException)
  })

  it('returns a token + public user on success', async () => {
    const svc = new AuthService(makePrisma({ findUnique: baseUser }), makeJwt())
    const out = await svc.login({
      email: 'a@b.com',
      password: 's3cret',
    } as never)
    expect(out.token).toBe('signed-token')
    expect(out.user).not.toHaveProperty('passwordHash')
    expect(out.user.id).toBe('u1')
    expect(out.user.isAdmin).toBe(false)
  })
})

describe('AuthService.me', () => {
  it('throws Unauthorized when the user is gone', async () => {
    const svc = new AuthService(makePrisma({ findUnique: null }), makeJwt())
    await expect(svc.me('u1')).rejects.toBeInstanceOf(UnauthorizedException)
  })

  it('returns the public user without the passwordHash', async () => {
    const svc = new AuthService(makePrisma({ findUnique: baseUser }), makeJwt())
    const out = await svc.me('u1')
    expect(out).not.toHaveProperty('passwordHash')
    expect(out.id).toBe('u1')
    expect(out.balanceCents).toBe(0)
  })
})
