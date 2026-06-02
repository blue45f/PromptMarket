import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common'
import { describe, expect, it, vi } from 'vitest'
import { PurchasesService } from './purchases.service'

type PrismaMock = ConstructorParameters<typeof PurchasesService>[0]

interface MockOptions {
  listing?: unknown
  existingPurchase?: unknown
  buyer?: unknown
  createdPurchase?: unknown
  platformSetting?: { key: string; intValue: number }[]
}

function makePrisma(opts: MockOptions = {}): PrismaMock {
  const tx = {
    user: {
      updateMany: vi.fn().mockImplementation(async () => {
        const buyer = opts.buyer as { balanceCents: number } | null | undefined
        const priceCents = (opts.listing as { priceCents?: number } | null)?.priceCents ?? 0
        const hasFunds = buyer != null && buyer.balanceCents >= priceCents
        return { count: hasFunds ? 1 : 0 }
      }),
      update: vi.fn().mockResolvedValue({}),
    },
    purchase: {
      create: vi.fn().mockResolvedValue(opts.createdPurchase ?? null),
    },
    listing: {
      update: vi.fn().mockResolvedValue({}),
    },
  }

  const $transaction = vi.fn().mockImplementation(async (opsOrCallback: unknown) => {
    if (typeof opsOrCallback === 'function') {
      return (opsOrCallback as (t: typeof tx) => Promise<unknown>)(tx)
    }
    const ops = opsOrCallback as unknown[]
    const created = opts.createdPurchase ?? null
    return ops.map((_op, index) => (index === 0 ? created : undefined))
  })

  return {
    platformSetting: {
      findMany: vi.fn().mockResolvedValue(opts.platformSetting ?? []),
    },
    listing: {
      findUnique: vi.fn().mockResolvedValue(opts.listing ?? null),
      update: vi.fn(),
    },
    purchase: {
      findUnique: vi.fn().mockResolvedValue(opts.existingPurchase ?? null),
      create: vi.fn(),
    },
    user: {
      findUnique: vi.fn().mockResolvedValue(opts.buyer ?? null),
      update: vi.fn(),
    },
    $transaction,
  } as unknown as PrismaMock
}

describe('PurchasesService.purchase', () => {
  it('throws NotFoundException when listing does not exist', async () => {
    const svc = new PurchasesService(makePrisma({ listing: null }))
    await expect(svc.purchase('u1', 'l1')).rejects.toBeInstanceOf(NotFoundException)
  })

  it('forbids the author from buying their own listing', async () => {
    const svc = new PurchasesService(
      makePrisma({ listing: { id: 'l1', authorId: 'u1', priceCents: 1000 } })
    )
    await expect(svc.purchase('u1', 'l1')).rejects.toBeInstanceOf(ForbiddenException)
  })

  it('conflicts on duplicate purchase', async () => {
    const svc = new PurchasesService(
      makePrisma({
        listing: { id: 'l1', authorId: 'author-1', priceCents: 1000 },
        existingPurchase: { id: 'p-prior' },
      })
    )
    await expect(svc.purchase('u1', 'l1')).rejects.toBeInstanceOf(ConflictException)
  })

  it('skips balance + seller credit on a free listing', async () => {
    const createdAt = new Date('2026-05-28T10:00:00Z')
    const prisma = makePrisma({
      listing: {
        id: 'l1',
        authorId: 'author-1',
        priceCents: 0,
        body: 'PROMPT BODY',
        ...{},
      },
      createdPurchase: {
        id: 'p1',
        listingId: 'l1',
        pricePaidCents: 0,
        grossAmountCents: 0,
        sellerNetCents: 0,
        platformFeeCents: 0,
        createdAt,
      },
    })
    const svc = new PurchasesService(prisma)

    const result = await svc.purchase('u1', 'l1')

    expect(result).toEqual({
      purchase: {
        id: 'p1',
        listingId: 'l1',
        pricePaidCents: 0,
        grossAmountCents: 0,
        sellerNetCents: 0,
        platformFeeCents: 0,
        createdAt,
      },
      body: 'PROMPT BODY',
    })
    const tx = (prisma as unknown as { $transaction: ReturnType<typeof vi.fn> }).$transaction
    expect(tx).toHaveBeenCalledTimes(1)
    expect(tx.mock.calls[0][0]).toHaveLength(2)
    expect(
      (prisma as unknown as { user: { findUnique: ReturnType<typeof vi.fn> } }).user.findUnique
    ).not.toHaveBeenCalled()
  })

  it('rejects paid purchase when buyer has no balance record', async () => {
    const svc = new PurchasesService(
      makePrisma({
        listing: { id: 'l1', authorId: 'author-1', priceCents: 1000 },
        buyer: null,
      })
    )
    await expect(svc.purchase('u1', 'l1')).rejects.toBeInstanceOf(BadRequestException)
  })

  it('rejects paid purchase on insufficient balance', async () => {
    const svc = new PurchasesService(
      makePrisma({
        listing: { id: 'l1', authorId: 'author-1', priceCents: 1000 },
        buyer: { id: 'u1', balanceCents: 999 },
      })
    )
    await expect(svc.purchase('u1', 'l1')).rejects.toBeInstanceOf(BadRequestException)
  })

  it('runs a 4-op transaction for paid purchases and credits the seller', async () => {
    const createdAt = new Date('2026-05-28T11:00:00Z')
    const prisma = makePrisma({
      listing: {
        id: 'l1',
        authorId: 'author-1',
        priceCents: 1500,
        body: 'PAID BODY',
      },
      buyer: { id: 'u1', balanceCents: 5000 },
      createdPurchase: {
        id: 'p1',
        listingId: 'l1',
        pricePaidCents: 1500,
        grossAmountCents: 1500,
        sellerNetCents: 1245,
        platformFeeCents: 255,
        createdAt,
      },
    })
    const svc = new PurchasesService(prisma)

    const result = await svc.purchase('u1', 'l1')

    expect(result).toEqual({
      purchase: {
        id: 'p1',
        listingId: 'l1',
        pricePaidCents: 1500,
        grossAmountCents: 1500,
        sellerNetCents: 1245,
        platformFeeCents: 255,
        createdAt,
      },
      body: 'PAID BODY',
    })
    const txSpy = (prisma as unknown as { $transaction: ReturnType<typeof vi.fn> }).$transaction
    expect(txSpy).toHaveBeenCalledTimes(1)
  })

  it('uses premium fee when gross amount exceeds threshold', async () => {
    const createdAt = new Date('2026-05-28T12:00:00Z')
    const createdPurchase = {
      id: 'p2',
      listingId: 'l1',
      pricePaidCents: 4000,
      grossAmountCents: 4000,
      sellerNetCents: 3440,
      platformFeeCents: 560,
      createdAt,
    }

    const prisma = makePrisma({
      listing: {
        id: 'l1',
        authorId: 'author-1',
        priceCents: 4000,
        body: 'PREMIUM BODY',
      },
      buyer: { id: 'u1', balanceCents: 8000 },
      platformSetting: [
        { key: 'platform_fee_bps', intValue: 1700 },
        { key: 'platform_fee_premium_bps', intValue: 1400 },
        { key: 'platform_fee_premium_threshold_cents', intValue: 3000 },
        { key: 'platform_fee_floor_cents', intValue: 0 },
      ],
      createdPurchase,
    })

    const svc = new PurchasesService(prisma)

    const result = await svc.purchase('u1', 'l1')

    expect(result.purchase).toEqual(createdPurchase)
  })

  it('uses ultra premium fee when gross amount exceeds ultra threshold', async () => {
    const createdAt = new Date('2026-05-28T14:00:00Z')
    const createdPurchase = {
      id: 'p4',
      listingId: 'l1',
      pricePaidCents: 8000,
      grossAmountCents: 8000,
      sellerNetCents: 7200,
      platformFeeCents: 800,
      createdAt,
    }

    const prisma = makePrisma({
      listing: {
        id: 'l1',
        authorId: 'author-1',
        priceCents: 8000,
        body: 'ULTRA PREMIUM BODY',
      },
      buyer: { id: 'u1', balanceCents: 20_000 },
      platformSetting: [
        { key: 'platform_fee_bps', intValue: 1700 },
        { key: 'platform_fee_premium_bps', intValue: 1400 },
        { key: 'platform_fee_premium_threshold_cents', intValue: 5000 },
        { key: 'platform_fee_ultra_premium_bps', intValue: 1000 },
        { key: 'platform_fee_ultra_premium_threshold_cents', intValue: 7000 },
        { key: 'platform_fee_floor_cents', intValue: 0 },
      ],
      createdPurchase,
    })

    const svc = new PurchasesService(prisma)

    const result = await svc.purchase('u1', 'l1')

    expect(result.purchase).toEqual(createdPurchase)
  })

  it('applies platform fee floor even if computed fee is lower', async () => {
    const createdAt = new Date('2026-05-28T13:00:00Z')
    const createdPurchase = {
      id: 'p3',
      listingId: 'l2',
      pricePaidCents: 100,
      grossAmountCents: 100,
      sellerNetCents: 0,
      platformFeeCents: 100,
      createdAt,
    }

    const prisma = makePrisma({
      listing: {
        id: 'l2',
        authorId: 'author-2',
        priceCents: 100,
        body: 'FLOOR BODY',
      },
      buyer: { id: 'u1', balanceCents: 500 },
      platformSetting: [
        { key: 'platform_fee_bps', intValue: 1700 },
        { key: 'platform_fee_premium_bps', intValue: 1400 },
        { key: 'platform_fee_premium_threshold_cents', intValue: 3000 },
        { key: 'platform_fee_floor_cents', intValue: 100 },
      ],
      createdPurchase,
    })

    const svc = new PurchasesService(prisma)

    const result = await svc.purchase('u1', 'l2')

    expect(result.purchase).toEqual(createdPurchase)
  })
})
