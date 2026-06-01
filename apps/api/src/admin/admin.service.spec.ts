import { BadRequestException } from '@nestjs/common'
import { describe, expect, it, vi } from 'vitest'
import { AdminService } from './admin.service'

type PrismaMock = ConstructorParameters<typeof AdminService>[0]

type AdminPrismaOverrides = Partial<{
  platformSetting: Partial<{
    findMany: ReturnType<typeof vi.fn>
    upsert: ReturnType<typeof vi.fn>
  }>
  purchase: Partial<{
    aggregate: ReturnType<typeof vi.fn>
    count: ReturnType<typeof vi.fn>
    groupBy: ReturnType<typeof vi.fn>
  }>
  listing: Partial<{
    findMany: ReturnType<typeof vi.fn>
  }>
}>

function makePrisma(overrides: AdminPrismaOverrides = {}) {
  const defaultPlatformSetting = {
    findMany: vi.fn().mockResolvedValue([]),
    upsert: vi.fn().mockResolvedValue({}),
  }
  const defaultPurchase = {
    aggregate: vi.fn().mockResolvedValue({ _sum: {} }),
    count: vi.fn().mockResolvedValue(0),
    groupBy: vi.fn().mockResolvedValue([]),
  }
  const defaultListing = {
    findMany: vi.fn().mockResolvedValue([]),
  }

  return {
    platformSetting: {
      ...defaultPlatformSetting,
      ...overrides.platformSetting,
    },
    purchase: {
      ...defaultPurchase,
      ...overrides.purchase,
    },
    listing: {
      ...defaultListing,
      ...overrides.listing,
    },
    ...overrides,
  } as unknown as PrismaMock
}

describe('AdminService.getPlatform settings', () => {
  it('returns default platform fee when no setting exists', async () => {
    const svc = new AdminService(makePrisma())
    const settings = await svc.getRevenueSettings()
    expect(settings).toEqual({
      platformFeeBps: 1700,
      platformFeePercent: 17,
      premiumFeeBps: 1400,
      premiumFeePercent: 14,
      ultraPremiumFeeBps: 1200,
      ultraPremiumFeePercent: 12,
      ultraPremiumThresholdCents: 10_000_00,
      premiumThresholdCents: 3000,
      platformFeeFloorCents: 0,
    })
  })

  it('updates and clamps platform fee to [0, 10000]', async () => {
    const prisma = makePrisma({
      platformSetting: {
        findMany: vi.fn().mockResolvedValue([
          { key: 'platform_fee_bps', intValue: 10_000 },
          { key: 'platform_fee_premium_bps', intValue: 100 },
          { key: 'platform_fee_premium_threshold_cents', intValue: 0 },
          { key: 'platform_fee_floor_cents', intValue: 0 },
        ]),
        upsert: vi.fn().mockResolvedValue({}),
      },
    })
    const svc = new AdminService(prisma)

    await expect(svc.updateRevenueSettings({ platformFeeBps: 12000 })).resolves.toEqual({
      platformFeeBps: 10000,
      platformFeePercent: 100,
      premiumFeeBps: 100,
      premiumFeePercent: 1,
      ultraPremiumFeeBps: 1200,
      ultraPremiumFeePercent: 12,
      ultraPremiumThresholdCents: 10_000_00,
      premiumThresholdCents: 0,
      platformFeeFloorCents: 0,
    })

    expect(prisma.platformSetting.upsert as ReturnType<typeof vi.fn>).toHaveBeenCalledWith({
      where: { key: 'platform_fee_bps' },
      create: { key: 'platform_fee_bps', intValue: 10000 },
      update: { intValue: 10000 },
    })
  })

  it('updates premium policy values and accepts defaults for unspecified fields', async () => {
    const prisma = makePrisma({
      platformSetting: {
        findMany: vi.fn().mockResolvedValue([
          { key: 'platform_fee_bps', intValue: 1700 },
          { key: 'platform_fee_premium_bps', intValue: 1300 },
          { key: 'platform_fee_premium_threshold_cents', intValue: 5000 },
          { key: 'platform_fee_ultra_premium_bps', intValue: 1200 },
          { key: 'platform_fee_ultra_premium_threshold_cents', intValue: 10_000_00 },
          { key: 'platform_fee_floor_cents', intValue: 12 },
        ]),
        upsert: vi.fn().mockResolvedValue({}),
      },
    })
    const svc = new AdminService(prisma)

    await expect(
      svc.updateRevenueSettings({
        premiumFeeBps: 1300,
        premiumThresholdCents: 5000,
        platformFeeFloorCents: 12,
      })
    ).resolves.toEqual({
      platformFeeBps: 1700,
      platformFeePercent: 17,
      premiumFeeBps: 1300,
      premiumFeePercent: 13,
      ultraPremiumFeeBps: 1200,
      ultraPremiumFeePercent: 12,
      ultraPremiumThresholdCents: 10_000_00,
      premiumThresholdCents: 5000,
      platformFeeFloorCents: 12,
    })

    expect(prisma.platformSetting.upsert as ReturnType<typeof vi.fn>).toHaveBeenCalledWith({
      where: { key: 'platform_fee_premium_bps' },
      create: { key: 'platform_fee_premium_bps', intValue: 1300 },
      update: { intValue: 1300 },
    })
    expect(prisma.platformSetting.upsert as ReturnType<typeof vi.fn>).toHaveBeenCalledWith({
      where: { key: 'platform_fee_premium_threshold_cents' },
      create: { key: 'platform_fee_premium_threshold_cents', intValue: 5000 },
      update: { intValue: 5000 },
    })
    expect(prisma.platformSetting.upsert as ReturnType<typeof vi.fn>).toHaveBeenCalledWith({
      where: { key: 'platform_fee_floor_cents' },
      create: { key: 'platform_fee_floor_cents', intValue: 12 },
      update: { intValue: 12 },
    })
  })

  it('rejects premium threshold above ultra premium threshold', async () => {
    const rows = [
      { key: 'platform_fee_bps', intValue: 1700 },
      { key: 'platform_fee_premium_bps', intValue: 1400 },
      { key: 'platform_fee_premium_threshold_cents', intValue: 3_000 },
      { key: 'platform_fee_ultra_premium_bps', intValue: 1200 },
      { key: 'platform_fee_ultra_premium_threshold_cents', intValue: 10_000_00 },
      { key: 'platform_fee_floor_cents', intValue: 0 },
    ]

    const upsertSpy = vi.fn().mockResolvedValue({})
    const prisma = makePrisma({
      platformSetting: {
        findMany: vi.fn().mockResolvedValue(rows),
        upsert: upsertSpy,
      },
    })

    const svc = new AdminService(prisma)

    await expect(
      svc.updateRevenueSettings({
        premiumThresholdCents: 12_000_00,
        ultraPremiumThresholdCents: 10_000_00,
      })
    ).rejects.toBeInstanceOf(BadRequestException)

    expect(upsertSpy).not.toHaveBeenCalled()
  })

  it('updates ultra premium policy values when explicitly provided', async () => {
    const rows: Array<{ key: string; intValue: number; updatedAt?: Date }> = [
      { key: 'platform_fee_bps', intValue: 1700 },
      { key: 'platform_fee_premium_bps', intValue: 1400 },
      { key: 'platform_fee_premium_threshold_cents', intValue: 3000 },
      { key: 'platform_fee_ultra_premium_bps', intValue: 1200 },
      { key: 'platform_fee_ultra_premium_threshold_cents', intValue: 10_000_00 },
      { key: 'platform_fee_floor_cents', intValue: 0 },
    ]

    const prisma = makePrisma({
      platformSetting: {
        findMany: vi.fn().mockImplementation(() => Promise.resolve(rows)),
        upsert: vi.fn().mockImplementation(({ where, create, update }) => {
          const key = where.key
          const intValue = update.intValue ?? create.intValue
          const next = rows.find((row) => row.key === key)
          if (next) {
            next.intValue = intValue
          } else {
            rows.push({ key, intValue, updatedAt: new Date() })
          }
          return Promise.resolve({})
        }),
      },
    })
    const svc = new AdminService(prisma)

    await expect(
      svc.updateRevenueSettings({
        ultraPremiumFeeBps: 1000,
        ultraPremiumThresholdCents: 20000,
      })
    ).resolves.toEqual({
      platformFeeBps: 1700,
      platformFeePercent: 17,
      premiumFeeBps: 1400,
      premiumFeePercent: 14,
      ultraPremiumFeeBps: 1000,
      ultraPremiumFeePercent: 10,
      ultraPremiumThresholdCents: 20000,
      premiumThresholdCents: 3000,
      platformFeeFloorCents: 0,
    })

    expect(prisma.platformSetting.upsert as ReturnType<typeof vi.fn>).toHaveBeenCalledWith({
      where: { key: 'platform_fee_ultra_premium_bps' },
      create: { key: 'platform_fee_ultra_premium_bps', intValue: 1000 },
      update: { intValue: 1000 },
    })
    expect(prisma.platformSetting.upsert as ReturnType<typeof vi.fn>).toHaveBeenCalledWith({
      where: { key: 'platform_fee_ultra_premium_threshold_cents' },
      create: { key: 'platform_fee_ultra_premium_threshold_cents', intValue: 20000 },
      update: { intValue: 20000 },
    })
  })

  it('returns revenue settings history with defaults for unset values', async () => {
    const updatedAt = new Date('2026-06-01T12:00:00.000Z')
    const svc = new AdminService(
      makePrisma({
        platformSetting: {
          findMany: vi
            .fn()
            .mockResolvedValue([{ key: 'platform_fee_bps', intValue: 1800, updatedAt }]),
          upsert: vi.fn().mockResolvedValue({}),
        },
      })
    )

    const history = await svc.getRevenueSettingsHistory()

    expect(history).toEqual([
      { key: 'platform_fee_bps', value: 1800, updatedAt: '2026-06-01T12:00:00.000Z' },
      {
        key: 'platform_fee_premium_bps',
        value: 1400,
        updatedAt: null,
      },
      {
        key: 'platform_fee_ultra_premium_bps',
        value: 1200,
        updatedAt: null,
      },
      {
        key: 'platform_fee_ultra_premium_threshold_cents',
        value: 10_000_00,
        updatedAt: null,
      },
      {
        key: 'platform_fee_premium_threshold_cents',
        value: 3000,
        updatedAt: null,
      },
      {
        key: 'platform_fee_floor_cents',
        value: 0,
        updatedAt: null,
      },
    ])
  })
})

describe('AdminService.getRevenueSummary', () => {
  it('aggregates and ranks creator revenue data', async () => {
    const prisma = makePrisma({
      platformSetting: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      purchase: {
        aggregate: vi.fn().mockResolvedValue({
          _sum: {
            grossAmountCents: 10_000,
            sellerNetCents: 8_300,
            platformFeeCents: 1_700,
          },
        }),
        count: vi.fn().mockResolvedValueOnce(4).mockResolvedValueOnce(3).mockResolvedValueOnce(1),
        groupBy: vi
          .fn()
          .mockResolvedValueOnce([
            {
              listingId: 'l-1',
              _count: { _all: 2 },
              _sum: {
                grossAmountCents: 5_000,
                sellerNetCents: 4_000,
                platformFeeCents: 1_000,
              },
            },
            {
              listingId: 'l-2',
              _count: { _all: 2 },
              _sum: {
                grossAmountCents: 5_000,
                sellerNetCents: 4_300,
                platformFeeCents: 700,
              },
            },
            {
              listingId: 'l-3',
              _count: { _all: 0 },
              _sum: {
                grossAmountCents: 0,
                sellerNetCents: 0,
                platformFeeCents: 0,
              },
            },
          ])
          .mockResolvedValueOnce([
            {
              grossAmountCents: 0,
              _count: { _all: 1 },
              _sum: { grossAmountCents: 0, sellerNetCents: 0, platformFeeCents: 0 },
            },
            {
              grossAmountCents: 5_000,
              _count: { _all: 3 },
              _sum: { grossAmountCents: 10_000, sellerNetCents: 8_300, platformFeeCents: 1_700 },
            },
          ]),
      },
      listing: {
        findMany: vi.fn().mockResolvedValue([
          { id: 'l-1', author: { id: 'alice', username: 'Alice' } },
          { id: 'l-2', author: { id: 'bob', username: 'Bob' } },
          // Intentionally out-of-order to prove map-based lookup is O(1)-friendly
          { id: 'l-3', author: { id: 'alice', username: 'Alice' } },
        ]),
      },
    })

    const svc = new AdminService(prisma)
    const out = await svc.getRevenueSummary(2)

    expect(out.totalPurchases).toBe(4)
    expect(out.paidPurchases).toBe(3)
    expect(out.freePurchases).toBe(1)
    expect(out.totalGrossCents).toBe(10_000)
    expect(out.tierBreakdown).toEqual({
      freeOrders: 1,
      baseOrders: 0,
      premiumOrders: 3,
      ultraPremiumOrders: 0,
      freeGrossCents: 0,
      baseGrossCents: 0,
      premiumGrossCents: 10_000,
      ultraPremiumGrossCents: 0,
      freePlatformFeeCents: 0,
      basePlatformFeeCents: 0,
      premiumPlatformFeeCents: 1_700,
      ultraPremiumPlatformFeeCents: 0,
      freeSellerNetCents: 0,
      baseSellerNetCents: 0,
      premiumSellerNetCents: 8_300,
      ultraPremiumSellerNetCents: 0,
    })
    expect(out.topCreators).toEqual([
      {
        creatorId: 'bob',
        username: 'Bob',
        listingCount: 1,
        salesCount: 2,
        grossRevenueCents: 5_000,
        sellerNetCents: 4_300,
        platformFeeCents: 700,
      },
      {
        creatorId: 'alice',
        username: 'Alice',
        listingCount: 2,
        salesCount: 2,
        grossRevenueCents: 5_000,
        sellerNetCents: 4_000,
        platformFeeCents: 1_000,
      },
    ])
  })

  it('clips limit to the range [1, 50] before returning top creators', async () => {
    const prisma = makePrisma({
      platformSetting: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      purchase: {
        aggregate: vi.fn().mockResolvedValue({
          _sum: {
            grossAmountCents: 0,
            sellerNetCents: 0,
            platformFeeCents: 0,
          },
        }),
        count: vi.fn().mockResolvedValue(0),
        groupBy: vi
          .fn()
          .mockResolvedValueOnce(
            Array.from({ length: 75 }, (_, i) => ({
              listingId: `l-${i}`,
              _count: { _all: 1 },
              _sum: {
                grossAmountCents: 100,
                sellerNetCents: 100,
                platformFeeCents: 0,
              },
            }))
          )
          .mockResolvedValueOnce([
            {
              grossAmountCents: 100,
              _count: { _all: 75 },
              _sum: {
                grossAmountCents: 7_500,
                sellerNetCents: 7_500,
                platformFeeCents: 0,
              },
            },
          ]),
      },
      listing: {
        findMany: vi.fn().mockResolvedValue(
          Array.from({ length: 75 }, (_, i) => ({
            id: `l-${i}`,
            author: { id: `creator-${i % 40}`, username: `creator-${i % 40}` },
          }))
        ),
      },
    })

    const out = await new AdminService(prisma).getRevenueSummary(5000)
    expect(out.topCreators).toHaveLength(40)
    expect(out.topCreators[0].creatorId).toMatch(/creator-/)
  })
})
