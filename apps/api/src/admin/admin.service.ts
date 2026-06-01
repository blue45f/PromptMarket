import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

interface TopCreatorBucket {
  creatorId: string
  username: string
  listingCount: number
  salesCount: number
  grossRevenueCents: number
  sellerNetCents: number
  platformFeeCents: number
}

interface RevenuePolicy {
  platformFeeBps: number
  premiumFeeBps: number
  ultraPremiumFeeBps: number
  ultraPremiumThresholdCents: number
  premiumThresholdCents: number
  platformFeeFloorCents: number
}

interface RevenueSettingHistoryEntry {
  key: string
  value: number
  updatedAt: string | null
}

@Injectable()
export class AdminService {
  private static readonly PLATFORM_FEE_BPS_KEY = 'platform_fee_bps'
  private static readonly PREMIUM_FEE_BPS_KEY = 'platform_fee_premium_bps'
  private static readonly ULTRA_PREMIUM_FEE_BPS_KEY = 'platform_fee_ultra_premium_bps'
  private static readonly ULTRA_PREMIUM_THRESHOLD_KEY = 'platform_fee_ultra_premium_threshold_cents'
  private static readonly PREMIUM_THRESHOLD_KEY = 'platform_fee_premium_threshold_cents'
  private static readonly PLATFORM_FEE_FLOOR_KEY = 'platform_fee_floor_cents'

  private static readonly DEFAULT_PLATFORM_FEE_BPS = 1700
  private static readonly DEFAULT_PREMIUM_FEE_BPS = 1400
  private static readonly DEFAULT_ULTRA_PREMIUM_FEE_BPS = 1200
  private static readonly DEFAULT_PREMIUM_THRESHOLD_CENTS = 3_000
  private static readonly DEFAULT_ULTRA_PREMIUM_THRESHOLD_CENTS = 10_000_00
  private static readonly DEFAULT_PLATFORM_FEE_FLOOR_CENTS = 0

  constructor(private readonly prisma: PrismaService) {}

  private normalizeFeeBps(value: number): number {
    const n = Math.trunc(value)
    if (!Number.isFinite(n)) return AdminService.DEFAULT_PLATFORM_FEE_BPS
    if (n < 0) return 0
    if (n > 10_000) return 10_000
    return n
  }

  private normalizeMoneyCents(value: number): number {
    const n = Math.trunc(value)
    if (!Number.isFinite(n)) return 0
    if (n < 0) return 0
    return n
  }

  private async getRevenuePolicy(): Promise<RevenuePolicy> {
    const keys = [
      AdminService.PLATFORM_FEE_BPS_KEY,
      AdminService.PREMIUM_FEE_BPS_KEY,
      AdminService.ULTRA_PREMIUM_FEE_BPS_KEY,
      AdminService.ULTRA_PREMIUM_THRESHOLD_KEY,
      AdminService.PREMIUM_THRESHOLD_KEY,
      AdminService.PLATFORM_FEE_FLOOR_KEY,
    ]

    const entries = await this.prisma.platformSetting.findMany({
      where: { key: { in: keys } },
    })
    const byKey = new Map(entries.map((row) => [row.key, row.intValue]))

    return {
      platformFeeBps: this.normalizeFeeBps(
        byKey.get(AdminService.PLATFORM_FEE_BPS_KEY) ?? AdminService.DEFAULT_PLATFORM_FEE_BPS
      ),
      premiumFeeBps: this.normalizeFeeBps(
        byKey.get(AdminService.PREMIUM_FEE_BPS_KEY) ?? AdminService.DEFAULT_PREMIUM_FEE_BPS
      ),
      ultraPremiumFeeBps: this.normalizeFeeBps(
        byKey.get(AdminService.ULTRA_PREMIUM_FEE_BPS_KEY) ??
          AdminService.DEFAULT_ULTRA_PREMIUM_FEE_BPS
      ),
      ultraPremiumThresholdCents: this.normalizeMoneyCents(
        byKey.get(AdminService.ULTRA_PREMIUM_THRESHOLD_KEY) ??
          AdminService.DEFAULT_ULTRA_PREMIUM_THRESHOLD_CENTS
      ),
      premiumThresholdCents: this.normalizeMoneyCents(
        byKey.get(AdminService.PREMIUM_THRESHOLD_KEY) ??
          AdminService.DEFAULT_PREMIUM_THRESHOLD_CENTS
      ),
      platformFeeFloorCents: this.normalizeMoneyCents(
        byKey.get(AdminService.PLATFORM_FEE_FLOOR_KEY) ??
          AdminService.DEFAULT_PLATFORM_FEE_FLOOR_CENTS
      ),
    }
  }

  private toRevenueSettings(policy: RevenuePolicy) {
    return {
      ...policy,
      platformFeePercent: Number((policy.platformFeeBps / 100).toFixed(2)),
      premiumFeePercent: Number((policy.premiumFeeBps / 100).toFixed(2)),
      ultraPremiumFeePercent: Number((policy.ultraPremiumFeeBps / 100).toFixed(2)),
    }
  }

  private async upsertSetting(key: string, intValue: number) {
    await this.prisma.platformSetting.upsert({
      where: { key },
      create: { key, intValue },
      update: { intValue },
    })
  }

  async getPlatformFeeSetting() {
    const policy = await this.getRevenuePolicy()
    return this.toRevenueSettings(policy)
  }

  getRevenueSettings() {
    return this.getPlatformFeeSetting()
  }

  async updateRevenueSettings(input: {
    platformFeeBps?: number
    premiumFeeBps?: number
    ultraPremiumFeeBps?: number
    ultraPremiumThresholdCents?: number
    premiumThresholdCents?: number
    platformFeeFloorCents?: number
  }) {
    if (input.platformFeeBps !== undefined) {
      await this.upsertSetting(
        AdminService.PLATFORM_FEE_BPS_KEY,
        this.normalizeFeeBps(input.platformFeeBps)
      )
    }

    if (input.premiumFeeBps !== undefined) {
      await this.upsertSetting(
        AdminService.PREMIUM_FEE_BPS_KEY,
        this.normalizeFeeBps(input.premiumFeeBps)
      )
    }

    if (input.ultraPremiumFeeBps !== undefined) {
      await this.upsertSetting(
        AdminService.ULTRA_PREMIUM_FEE_BPS_KEY,
        this.normalizeFeeBps(input.ultraPremiumFeeBps)
      )
    }

    if (input.ultraPremiumThresholdCents !== undefined) {
      await this.upsertSetting(
        AdminService.ULTRA_PREMIUM_THRESHOLD_KEY,
        this.normalizeMoneyCents(input.ultraPremiumThresholdCents)
      )
    }

    if (input.premiumThresholdCents !== undefined) {
      await this.upsertSetting(
        AdminService.PREMIUM_THRESHOLD_KEY,
        this.normalizeMoneyCents(input.premiumThresholdCents)
      )
    }

    if (input.platformFeeFloorCents !== undefined) {
      await this.upsertSetting(
        AdminService.PLATFORM_FEE_FLOOR_KEY,
        this.normalizeMoneyCents(input.platformFeeFloorCents)
      )
    }

    return this.getPlatformFeeSetting()
  }

  async getRevenueSummary(limit: number) {
    const requested = Math.max(1, Math.min(Math.floor(limit) || 10, 50))

    const [totals, totalPurchases, paidPurchases, freePurchases, listingAgg] = await Promise.all([
      this.prisma.purchase.aggregate({
        _sum: {
          grossAmountCents: true,
          sellerNetCents: true,
          platformFeeCents: true,
        },
      }),
      this.prisma.purchase.count(),
      this.prisma.purchase.count({ where: { pricePaidCents: { gt: 0 } } }),
      this.prisma.purchase.count({ where: { pricePaidCents: 0 } }),
      this.prisma.purchase.groupBy({
        by: ['listingId'],
        _count: { _all: true },
        _sum: {
          grossAmountCents: true,
          sellerNetCents: true,
          platformFeeCents: true,
        },
      }),
    ])

    const listingIds = listingAgg.map((row) => row.listingId)
    const listings = await this.prisma.listing.findMany({
      where: { id: { in: listingIds } },
      select: {
        id: true,
        author: { select: { id: true, username: true } },
      },
    })
    const listingToCreator = new Map(listings.map((l) => [l.id, l]))

    const bucketByCreator = new Map<string, TopCreatorBucket>()
    for (const row of listingAgg) {
      const listing = listingToCreator.get(row.listingId)
      if (!listing?.author) continue

      const existing = bucketByCreator.get(listing.author.id) ?? {
        creatorId: listing.author.id,
        username: listing.author.username,
        listingCount: 0,
        salesCount: 0,
        grossRevenueCents: 0,
        sellerNetCents: 0,
        platformFeeCents: 0,
      }

      existing.listingCount += 1
      existing.salesCount += row._count._all
      existing.grossRevenueCents += row._sum.grossAmountCents ?? 0
      existing.sellerNetCents += row._sum.sellerNetCents ?? 0
      existing.platformFeeCents += row._sum.platformFeeCents ?? 0
      bucketByCreator.set(listing.author.id, existing)
    }

    const topCreators = [...bucketByCreator.values()].sort(
      (a, b) => b.sellerNetCents - a.sellerNetCents || b.salesCount - a.salesCount
    )
    const topCreatorsClipped = topCreators.slice(0, requested)

    return {
      totalPurchases,
      paidPurchases,
      freePurchases,
      totalGrossCents: totals._sum.grossAmountCents ?? 0,
      totalSellerNetCents: totals._sum.sellerNetCents ?? 0,
      totalPlatformFeeCents: totals._sum.platformFeeCents ?? 0,
      topCreators: topCreatorsClipped,
    }
  }

  async getRevenueSettingsHistory() {
    const keys = [
      AdminService.PLATFORM_FEE_BPS_KEY,
      AdminService.PREMIUM_FEE_BPS_KEY,
      AdminService.ULTRA_PREMIUM_FEE_BPS_KEY,
      AdminService.ULTRA_PREMIUM_THRESHOLD_KEY,
      AdminService.PREMIUM_THRESHOLD_KEY,
      AdminService.PLATFORM_FEE_FLOOR_KEY,
    ]

    const existing = await this.prisma.platformSetting.findMany({
      where: { key: { in: keys } },
      orderBy: { updatedAt: 'desc' },
    })

    const byKey = new Map(existing.map((row) => [row.key, row]))
    const defaults = await this.getRevenuePolicy()

    const defaultsByKey: Record<string, number> = {
      [AdminService.PLATFORM_FEE_BPS_KEY]: defaults.platformFeeBps,
      [AdminService.PREMIUM_FEE_BPS_KEY]: defaults.premiumFeeBps,
      [AdminService.ULTRA_PREMIUM_FEE_BPS_KEY]: defaults.ultraPremiumFeeBps,
      [AdminService.ULTRA_PREMIUM_THRESHOLD_KEY]: defaults.ultraPremiumThresholdCents,
      [AdminService.PREMIUM_THRESHOLD_KEY]: defaults.premiumThresholdCents,
      [AdminService.PLATFORM_FEE_FLOOR_KEY]: defaults.platformFeeFloorCents,
    }

    return keys.map((key) => {
      const row = byKey.get(key)
      let value = defaultsByKey[key] ?? 0

      if (row?.intValue !== undefined) {
        if (
          key === AdminService.PLATFORM_FEE_BPS_KEY ||
          key === AdminService.PREMIUM_FEE_BPS_KEY ||
          key === AdminService.ULTRA_PREMIUM_FEE_BPS_KEY
        ) {
          value = this.normalizeFeeBps(row.intValue)
        } else {
          value = this.normalizeMoneyCents(row.intValue)
        }
      }

      return {
        key,
        value,
        updatedAt: row ? row.updatedAt.toISOString() : null,
      } as RevenueSettingHistoryEntry
    })
  }
}
