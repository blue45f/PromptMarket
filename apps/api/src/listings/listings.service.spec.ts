import { ForbiddenException, NotFoundException } from '@nestjs/common'
import { describe, expect, it, vi } from 'vitest'
import { ListingsService } from './listings.service'

type PrismaMock = ConstructorParameters<typeof ListingsService>[0]

function buildListing(overrides: Record<string, unknown> = {}) {
  return {
    id: 'l1',
    slug: 'l1-slug',
    title: 'Test Listing',
    type: 'prompt',
    description: 'desc',
    body: 'FULL BODY',
    previewBody: 'PREVIEW',
    category: 'writing',
    tags: 'a,b',
    models: 'gpt-5,claude-3-7',
    technique: 'chain-of-thought',
    difficulty: 'intermediate',
    license: 'MIT',
    version: '1.0.0',
    priceCents: 1000,
    coverEmoji: '✨',
    downloads: 0,
    authorId: 'author-1',
    createdAt: new Date('2026-05-01T00:00:00Z'),
    updatedAt: new Date('2026-05-02T00:00:00Z'),
    author: { id: 'author-1', username: 'alex', bio: null, avatarUrl: null },
    reviews: [],
    ...overrides,
  }
}

describe('ListingsService.getBySlug body visibility', () => {
  it('throws NotFoundException when slug does not exist', async () => {
    const prisma = {
      listing: { findUnique: vi.fn().mockResolvedValue(null) },
      purchase: { findUnique: vi.fn() },
    } as unknown as PrismaMock
    const svc = new ListingsService(prisma)
    await expect(svc.getBySlug('missing', null)).rejects.toBeInstanceOf(NotFoundException)
  })

  it('hides the body for an anonymous viewer on a paid listing', async () => {
    const prisma = {
      listing: { findUnique: vi.fn().mockResolvedValue(buildListing()) },
      purchase: { findUnique: vi.fn() },
    } as unknown as PrismaMock
    const svc = new ListingsService(prisma)
    const out = await svc.getBySlug('l1-slug', null)
    expect(out.body).toBeNull()
    expect(out.canViewBody).toBe(false)
    expect(out.isOwner).toBe(false)
    expect(out.isPurchased).toBe(false)
  })

  it('exposes the body when the listing is free, even to anonymous viewers', async () => {
    const prisma = {
      listing: {
        findUnique: vi.fn().mockResolvedValue(buildListing({ priceCents: 0 })),
      },
      purchase: { findUnique: vi.fn() },
    } as unknown as PrismaMock
    const svc = new ListingsService(prisma)
    const out = await svc.getBySlug('l1-slug', null)
    expect(out.body).toBe('FULL BODY')
    expect(out.canViewBody).toBe(true)
  })

  it('exposes the body to the owner regardless of price', async () => {
    const prisma = {
      listing: { findUnique: vi.fn().mockResolvedValue(buildListing()) },
      purchase: { findUnique: vi.fn() },
    } as unknown as PrismaMock
    const svc = new ListingsService(prisma)
    const out = await svc.getBySlug('l1-slug', 'author-1')
    expect(out.isOwner).toBe(true)
    expect(out.body).toBe('FULL BODY')
    expect(
      (prisma as unknown as { purchase: { findUnique: ReturnType<typeof vi.fn> } }).purchase
        .findUnique
    ).not.toHaveBeenCalled()
  })

  it('exposes the body when the viewer has purchased', async () => {
    const prisma = {
      listing: { findUnique: vi.fn().mockResolvedValue(buildListing()) },
      purchase: {
        findUnique: vi.fn().mockResolvedValue({ id: 'p1' }),
      },
    } as unknown as PrismaMock
    const svc = new ListingsService(prisma)
    const out = await svc.getBySlug('l1-slug', 'buyer-1')
    expect(out.isPurchased).toBe(true)
    expect(out.body).toBe('FULL BODY')
  })

  it('computes avgRating + reviewCount from reviews', async () => {
    const prisma = {
      listing: {
        findUnique: vi.fn().mockResolvedValue(
          buildListing({
            reviews: [
              {
                id: 'r1',
                rating: 5,
                comment: null,
                createdAt: new Date(),
                user: { id: 'u1', username: 'a' },
              },
              {
                id: 'r2',
                rating: 3,
                comment: null,
                createdAt: new Date(),
                user: { id: 'u2', username: 'b' },
              },
            ],
          })
        ),
      },
      purchase: { findUnique: vi.fn() },
    } as unknown as PrismaMock
    const svc = new ListingsService(prisma)
    const out = await svc.getBySlug('l1-slug', null)
    expect(out.avgRating).toBe(4)
    expect(out.reviewCount).toBe(2)
  })
})

describe('ListingsService.update / remove ownership', () => {
  it('forbids update by a non-owner', async () => {
    const prisma = {
      listing: {
        findUnique: vi.fn().mockResolvedValue({ id: 'l1', authorId: 'author-1' }),
        update: vi.fn(),
      },
    } as unknown as PrismaMock
    const svc = new ListingsService(prisma)
    await expect(svc.update('intruder', 'l1', { title: 'new' } as never)).rejects.toBeInstanceOf(
      ForbiddenException
    )
  })

  it('forbids remove by a non-owner', async () => {
    const prisma = {
      listing: {
        findUnique: vi.fn().mockResolvedValue({ id: 'l1', authorId: 'author-1' }),
        delete: vi.fn(),
      },
      review: { deleteMany: vi.fn() },
      purchase: { deleteMany: vi.fn() },
    } as unknown as PrismaMock
    const svc = new ListingsService(prisma)
    await expect(svc.remove('intruder', 'l1')).rejects.toBeInstanceOf(ForbiddenException)
  })

  it('cascades review + purchase deletion when the owner deletes', async () => {
    const review = { deleteMany: vi.fn().mockResolvedValue({ count: 2 }) }
    const purchase = { deleteMany: vi.fn().mockResolvedValue({ count: 1 }) }
    const listing = {
      findUnique: vi.fn().mockResolvedValue({ id: 'l1', authorId: 'author-1' }),
      delete: vi.fn().mockResolvedValue({ id: 'l1' }),
    }
    const $transaction = vi.fn().mockImplementation(async (ops: unknown[]) => Promise.all(ops))
    const prisma = { listing, review, purchase, $transaction } as unknown as PrismaMock
    const svc = new ListingsService(prisma)
    await expect(svc.remove('author-1', 'l1')).resolves.toEqual({ ok: true })
    expect(review.deleteMany).toHaveBeenCalledWith({
      where: { listingId: 'l1' },
    })
    expect(purchase.deleteMany).toHaveBeenCalledWith({
      where: { listingId: 'l1' },
    })
    expect(listing.delete).toHaveBeenCalledWith({ where: { id: 'l1' } })
  })
})

describe('ListingsService.related', () => {
  it('clamps the limit into [1, 12]', async () => {
    const findMany = vi.fn().mockResolvedValue([])
    const prisma = {
      listing: {
        findUnique: vi.fn().mockResolvedValue({ id: 'l1', type: 'prompt', category: 'writing' }),
        findMany,
      },
    } as unknown as PrismaMock
    const svc = new ListingsService(prisma)
    await svc.related('l1', 999)
    expect(findMany.mock.calls[0][0].take).toBe(12)
    await svc.related('l1', 0)
    expect(findMany.mock.calls[1][0].take).toBe(1)
  })

  it('throws NotFoundException for a missing seed', async () => {
    const prisma = {
      listing: {
        findUnique: vi.fn().mockResolvedValue(null),
        findMany: vi.fn(),
      },
    } as unknown as PrismaMock
    const svc = new ListingsService(prisma)
    await expect(svc.related('missing', 4)).rejects.toBeInstanceOf(NotFoundException)
  })
})

describe('ListingsService.list sort=top', () => {
  it('uses all.length as total — no separate count() query is issued', async () => {
    const count = vi.fn()
    const rows = [buildListing({ id: 'l1', downloads: 5, reviews: [{ rating: 4 }] })]
    const findMany = vi.fn().mockResolvedValue(rows)
    const prisma = { listing: { count, findMany } } as unknown as PrismaMock
    const svc = new ListingsService(prisma)
    const out = await svc.list({ sort: 'top', page: 1, pageSize: 12 } as never)
    expect(count).not.toHaveBeenCalled()
    expect(out.total).toBe(1)
    expect(out.totalPages).toBe(1)
  })

  it('ranks by avg rating descending then createdAt descending', async () => {
    const older = buildListing({
      id: 'l-old',
      createdAt: new Date('2026-01-01'),
      reviews: [{ rating: 3 }],
    })
    const newer = buildListing({
      id: 'l-new',
      createdAt: new Date('2026-06-01'),
      reviews: [{ rating: 5 }],
    })
    const findMany = vi.fn().mockResolvedValue([older, newer])
    const prisma = { listing: { findMany } } as unknown as PrismaMock
    const svc = new ListingsService(prisma)
    const out = await svc.list({ sort: 'top', page: 1, pageSize: 12 } as never)
    expect(out.items[0].id).toBe('l-new')
    expect(out.items[1].id).toBe('l-old')
  })

  it('pages correctly within the in-memory window', async () => {
    const rows = Array.from({ length: 5 }, (_, i) =>
      buildListing({ id: `l${i}`, downloads: i, reviews: [] })
    )
    const findMany = vi.fn().mockResolvedValue(rows)
    const prisma = { listing: { findMany } } as unknown as PrismaMock
    const svc = new ListingsService(prisma)
    const page2 = await svc.list({ sort: 'top', page: 2, pageSize: 2 } as never)
    expect(page2.items).toHaveLength(2)
    expect(page2.total).toBe(5)
    expect(page2.totalPages).toBe(3)
  })
})

describe('ListingsService.list vendor filter', () => {
  it('forces an empty result set when the vendor name is unknown', async () => {
    const count = vi.fn().mockResolvedValue(0)
    const findMany = vi.fn().mockResolvedValue([])
    const prisma = {
      listing: { count, findMany },
    } as unknown as PrismaMock
    const svc = new ListingsService(prisma)
    const out = await svc.list({ vendor: 'definitely-not-a-vendor' } as never)
    expect(out.items).toEqual([])
    expect(out.total).toBe(0)
    // Sentinel id ensures the SQL where-clause cannot match any row.
    expect(count.mock.calls[0][0].where.id).toBe('__no_match__')
  })
})

describe('ListingsService.list sort=top pagination cap', () => {
  it('caps reported total to scored.length when DB count exceeds the 5000 in-memory window', async () => {
    const rows = Array.from({ length: 3 }, (_, i) =>
      buildListing({ id: `l${i}`, slug: `slug-${i}`, downloads: i, reviews: [] })
    )
    const count = vi.fn().mockResolvedValue(9999)
    const findMany = vi.fn().mockResolvedValue(rows)
    const prisma = { listing: { count, findMany } } as unknown as PrismaMock
    const svc = new ListingsService(prisma)
    const out = await svc.list({ sort: 'top', page: 1, pageSize: 12 } as never)
    // DB reports 9999 but we only fetched 3; reported total must be 3
    expect(out.total).toBe(3)
    expect(out.totalPages).toBe(1)
  })
})

describe('ListingsService.list modelSlugMatch', () => {
  it('builds all 4 OR branches for exact CSV token matching', async () => {
    const count = vi.fn().mockResolvedValue(0)
    const findMany = vi.fn().mockResolvedValue([])
    const prisma = { listing: { count, findMany } } as unknown as PrismaMock
    const svc = new ListingsService(prisma)

    await svc.list({ model: 'gpt-5' } as never)

    const where = count.mock.calls[0][0].where
    const slugFilter = where.AND?.find((c: Record<string, unknown>) => c.OR)
    expect(slugFilter).toBeDefined()
    expect(slugFilter.OR).toContainEqual({ models: { equals: 'gpt-5' } })
    expect(slugFilter.OR).toContainEqual({ models: { startsWith: 'gpt-5,' } })
    expect(slugFilter.OR).toContainEqual({ models: { endsWith: ',gpt-5' } })
    expect(slugFilter.OR).toContainEqual({ models: { contains: ',gpt-5,' } })
  })

  it('does not match a partial slug token (e.g. gpt-5 must not hit gpt-5-turbo)', async () => {
    const count = vi.fn().mockResolvedValue(0)
    const findMany = vi.fn().mockResolvedValue([])
    const prisma = { listing: { count, findMany } } as unknown as PrismaMock
    const svc = new ListingsService(prisma)

    await svc.list({ model: 'gpt-5' } as never)

    const where = count.mock.calls[0][0].where
    const slugFilter = where.AND?.find((c: Record<string, unknown>) => c.OR)
    const orBranches: Array<{ models: Record<string, string> }> = slugFilter?.OR ?? []
    // None of the 4 branches use bare `contains: 'gpt-5'` which would match 'gpt-5-turbo'
    const hasLooseContains = orBranches.some(
      (b) => b.models?.contains !== undefined && !b.models.contains.startsWith(',')
    )
    expect(hasLooseContains).toBe(false)
  })
})

describe('ListingsService.list signal filters', () => {
  it('pushes trust signal filters into the database where clause', async () => {
    const count = vi.fn().mockResolvedValue(0)
    const findMany = vi.fn().mockResolvedValue([])
    const prisma = {
      listing: { count, findMany },
    } as unknown as PrismaMock
    const svc = new ListingsService(prisma)

    await svc.list({
      signal: ['reviewed', 'used', 'multi-model', 'fresh'],
    } as never)

    const where = count.mock.calls[0][0].where
    expect(where.reviews).toEqual({ some: { hiddenAt: null } })
    expect(where.downloads).toEqual({ gt: 0 })
    expect(where.AND).toContainEqual({ models: { contains: ',' } })
    expect(where.updatedAt.gte).toBeInstanceOf(Date)
  })
})
