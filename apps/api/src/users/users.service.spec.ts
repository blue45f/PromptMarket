import { BadRequestException, NotFoundException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { describe, expect, it, vi } from 'vitest'
import { UsersService } from './users.service'

type PrismaArg = ConstructorParameters<typeof UsersService>[0]

function makePrisma(
  handlers: Partial<{
    userFindUnique: unknown
    userUpdate: unknown
    userUpdateThrowsP2025: boolean
    purchaseFindMany: unknown[]
    listingFindMany: unknown[]
  }> = {}
): PrismaArg {
  return {
    user: {
      findUnique: vi.fn().mockResolvedValue(handlers.userFindUnique ?? null),
      update: vi.fn().mockImplementation(async () => {
        if (handlers.userUpdateThrowsP2025) {
          throw new Prisma.PrismaClientKnownRequestError('Record not found', {
            code: 'P2025',
            clientVersion: '0.0.0',
          })
        }
        return handlers.userUpdate ?? null
      }),
    },
    purchase: {
      findMany: vi.fn().mockResolvedValue(handlers.purchaseFindMany ?? []),
    },
    listing: {
      findMany: vi.fn().mockResolvedValue(handlers.listingFindMany ?? []),
    },
  } as unknown as PrismaArg
}

describe('UsersService.getPublicProfile', () => {
  it('throws NotFoundException when the username is unknown', async () => {
    const svc = new UsersService(makePrisma({ userFindUnique: null }))
    await expect(svc.getPublicProfile('ghost')).rejects.toBeInstanceOf(NotFoundException)
  })

  it('omits email + balanceCents from the public shape', async () => {
    const svc = new UsersService(
      makePrisma({
        userFindUnique: {
          id: 'u1',
          email: 'a@b.com',
          username: 'alex',
          bio: 'hi',
          avatarUrl: null,
          balanceCents: 9999,
          passwordHash: 'should-never-appear',
          createdAt: new Date('2026-05-01T00:00:00Z'),
          listings: [],
        },
      })
    )
    const out = await svc.getPublicProfile('alex')
    expect(out).not.toHaveProperty('email')
    expect(out).not.toHaveProperty('balanceCents')
    expect(out).not.toHaveProperty('passwordHash')
    expect(out.username).toBe('alex')
  })

  it('serializes nested listings with avgRating + author', async () => {
    const svc = new UsersService(
      makePrisma({
        userFindUnique: {
          id: 'u1',
          email: 'a@b.com',
          username: 'alex',
          bio: null,
          avatarUrl: null,
          balanceCents: 0,
          createdAt: new Date(),
          listings: [
            {
              id: 'l1',
              slug: 'l1-slug',
              title: 'one',
              type: 'prompt',
              description: '',
              category: 'writing',
              tags: 'a,b',
              models: 'gpt-5',
              technique: null,
              difficulty: 'intermediate',
              license: 'MIT',
              version: '1.0.0',
              priceCents: 1000,
              coverEmoji: '✨',
              downloads: 4,
              createdAt: new Date(),
              reviews: [{ rating: 4 }, { rating: 2 }],
            },
          ],
        },
      })
    )
    const out = await svc.getPublicProfile('alex')
    expect(out.listings).toHaveLength(1)
    expect(out.listings[0].avgRating).toBe(3)
    expect(out.listings[0].reviewCount).toBe(2)
    expect(out.listings[0].author).toEqual({ id: 'u1', username: 'alex' })
    expect(out.listings[0].tags).toEqual(['a', 'b'])
  })
})

describe('UsersService.topUp', () => {
  it.each([
    ['non-integer', 12.5],
    ['zero', 0],
    ['negative', -100],
    ['too large', 100001],
  ])('rejects amountCents (%s)', async (_label, amount) => {
    const svc = new UsersService(makePrisma())
    await expect(svc.topUp('u1', amount as number)).rejects.toBeInstanceOf(BadRequestException)
  })

  it('increments the balance via update and returns the new balance', async () => {
    const prisma = makePrisma({
      userUpdate: { balanceCents: 1500 },
    })
    const svc = new UsersService(prisma)
    const out = await svc.topUp('u1', 500)
    expect(out).toEqual({ balanceCents: 1500 })
    const updateSpy = (prisma as unknown as { user: { update: ReturnType<typeof vi.fn> } }).user
      .update
    expect(updateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: 'u1' }),
        data: { balanceCents: { increment: 500 } },
      })
    )
  })

  it('throws BadRequestException when balance cap would be exceeded', async () => {
    const svc = new UsersService(
      makePrisma({ userUpdateThrowsP2025: true, userFindUnique: { id: 'u1' } })
    )
    await expect(svc.topUp('u1', 100)).rejects.toBeInstanceOf(BadRequestException)
  })
})

describe('UsersService.myListings', () => {
  it('aggregates salesCount + earningsCents from purchases', async () => {
    const svc = new UsersService(
      makePrisma({
        listingFindMany: [
          {
            id: 'l1',
            slug: 'l1',
            title: 'one',
            type: 'prompt',
            description: '',
            category: 'writing',
            tags: '',
            models: '',
            technique: null,
            difficulty: 'intermediate',
            license: 'MIT',
            version: '1.0.0',
            priceCents: 1000,
            coverEmoji: '✨',
            downloads: 0,
            createdAt: new Date(),
            reviews: [],
            purchases: [
              { pricePaidCents: 1000, sellerNetCents: 830 },
              { pricePaidCents: 1000, sellerNetCents: 830 },
              { pricePaidCents: 0, sellerNetCents: 0 },
            ],
            author: { id: 'u1', username: 'alex' },
          },
        ],
      })
    )
    const out = await svc.myListings('u1')
    expect(out[0].salesCount).toBe(3)
    expect(out[0].earningsCents).toBe(1660)
  })

  it('returns 0/0 when no purchases yet', async () => {
    const svc = new UsersService(
      makePrisma({
        listingFindMany: [
          {
            id: 'l1',
            slug: 'l1',
            title: 'one',
            type: 'prompt',
            description: '',
            category: 'writing',
            tags: '',
            models: '',
            technique: null,
            difficulty: 'intermediate',
            license: 'MIT',
            version: '1.0.0',
            priceCents: 0,
            coverEmoji: '✨',
            downloads: 0,
            createdAt: new Date(),
            reviews: [],
            purchases: [],
            author: { id: 'u1', username: 'alex' },
          },
        ],
      })
    )
    const out = await svc.myListings('u1')
    expect(out[0].salesCount).toBe(0)
    expect(out[0].earningsCents).toBe(0)
  })
})

describe('UsersService.getMe', () => {
  it('throws NotFoundException when the user is gone', async () => {
    const svc = new UsersService(makePrisma({ userFindUnique: null }))
    await expect(svc.getMe('u1')).rejects.toBeInstanceOf(NotFoundException)
  })

  it('returns private shape with email + balanceCents but never passwordHash', async () => {
    const svc = new UsersService(
      makePrisma({
        userFindUnique: {
          id: 'u1',
          email: 'a@b.com',
          username: 'alex',
          bio: null,
          avatarUrl: null,
          balanceCents: 4200,
          passwordHash: 'should-never-appear',
          createdAt: new Date(),
        },
      })
    )
    const out = await svc.getMe('u1')
    expect(out.email).toBe('a@b.com')
    expect(out.balanceCents).toBe(4200)
    expect(out).not.toHaveProperty('passwordHash')
  })
})
