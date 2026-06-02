import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { isPrismaP2002, isPrismaP2025 } from '../prisma/prisma-errors'

@Injectable()
export class PurchasesService {
  constructor(private readonly prisma: PrismaService) {}

  private static readonly PREMIUM_FEE_BPS_KEY = 'platform_fee_premium_bps'
  private static readonly PREMIUM_THRESHOLD_KEY = 'platform_fee_premium_threshold_cents'
  private static readonly ULTRA_PREMIUM_FEE_BPS_KEY = 'platform_fee_ultra_premium_bps'
  private static readonly ULTRA_PREMIUM_THRESHOLD_KEY = 'platform_fee_ultra_premium_threshold_cents'
  private static readonly PLATFORM_FEE_FLOOR_KEY = 'platform_fee_floor_cents'
  private static readonly PLATFORM_FEE_BPS_KEY = 'platform_fee_bps'
  private static readonly DEFAULT_PLATFORM_FEE_BPS = 1700
  private static readonly DEFAULT_PREMIUM_FEE_BPS = 1400
  private static readonly DEFAULT_ULTRA_PREMIUM_FEE_BPS = 1200
  private static readonly DEFAULT_PREMIUM_THRESHOLD_CENTS = 3_000
  // $10,000 — currently unreachable given the $9,999 max listing price; lower to activate the tier.
  private static readonly DEFAULT_ULTRA_PREMIUM_THRESHOLD_CENTS = 10_000_00
  private static readonly DEFAULT_PLATFORM_FEE_FLOOR_CENTS = 0

  private normalizeFeeBps(value: number): number {
    if (!Number.isInteger(value)) return PurchasesService.DEFAULT_PLATFORM_FEE_BPS
    if (value < 0) return 0
    if (value > 10_000) return 10_000
    return value
  }

  private normalizeMoneyCents(value: number): number {
    const n = Math.trunc(value)
    if (!Number.isFinite(n)) return 0
    if (n < 0) return 0
    return n
  }

  private async getRevenuePolicy() {
    const keys = [
      PurchasesService.PLATFORM_FEE_BPS_KEY,
      PurchasesService.PREMIUM_FEE_BPS_KEY,
      PurchasesService.ULTRA_PREMIUM_FEE_BPS_KEY,
      PurchasesService.ULTRA_PREMIUM_THRESHOLD_KEY,
      PurchasesService.PREMIUM_THRESHOLD_KEY,
      PurchasesService.PLATFORM_FEE_FLOOR_KEY,
    ]

    const settings = await this.prisma.platformSetting.findMany({
      where: { key: { in: keys } },
    })
    const byKey = new Map(settings.map((row) => [row.key, row.intValue]))

    return {
      platformFeeBps: this.normalizeFeeBps(
        byKey.get(PurchasesService.PLATFORM_FEE_BPS_KEY) ??
          PurchasesService.DEFAULT_PLATFORM_FEE_BPS
      ),
      premiumFeeBps: this.normalizeFeeBps(
        byKey.get(PurchasesService.PREMIUM_FEE_BPS_KEY) ?? PurchasesService.DEFAULT_PREMIUM_FEE_BPS
      ),
      ultraPremiumFeeBps: this.normalizeFeeBps(
        byKey.get(PurchasesService.ULTRA_PREMIUM_FEE_BPS_KEY) ??
          PurchasesService.DEFAULT_ULTRA_PREMIUM_FEE_BPS
      ),
      ultraPremiumThresholdCents: this.normalizeMoneyCents(
        byKey.get(PurchasesService.ULTRA_PREMIUM_THRESHOLD_KEY) ??
          PurchasesService.DEFAULT_ULTRA_PREMIUM_THRESHOLD_CENTS
      ),
      premiumThresholdCents: this.normalizeMoneyCents(
        byKey.get(PurchasesService.PREMIUM_THRESHOLD_KEY) ??
          PurchasesService.DEFAULT_PREMIUM_THRESHOLD_CENTS
      ),
      platformFeeFloorCents: this.normalizeMoneyCents(
        byKey.get(PurchasesService.PLATFORM_FEE_FLOOR_KEY) ??
          PurchasesService.DEFAULT_PLATFORM_FEE_FLOOR_CENTS
      ),
    }
  }

  private selectFeeBps(
    grossAmountCents: number,
    policy: {
      platformFeeBps: number
      premiumFeeBps: number
      ultraPremiumFeeBps: number
      premiumThresholdCents: number
      ultraPremiumThresholdCents: number
    }
  ) {
    const tiers = [
      { threshold: policy.ultraPremiumThresholdCents, feeBps: policy.ultraPremiumFeeBps },
      { threshold: policy.premiumThresholdCents, feeBps: policy.premiumFeeBps },
      { threshold: 0, feeBps: policy.platformFeeBps },
    ]
    const sorted = [...tiers].sort((a, b) => b.threshold - a.threshold)
    for (const tier of sorted) {
      if (grossAmountCents >= tier.threshold) return tier.feeBps
    }
    return policy.platformFeeBps
  }

  private splitRevenue(
    grossAmountCents: number,
    policy: {
      platformFeeBps: number
      premiumFeeBps: number
      ultraPremiumFeeBps: number
      premiumThresholdCents: number
      ultraPremiumThresholdCents: number
      platformFeeFloorCents: number
    }
  ) {
    const normalizedFeeBps = this.selectFeeBps(grossAmountCents, policy)
    const rawPlatformFeeCents = Math.max(
      0,
      Math.round((grossAmountCents * normalizedFeeBps) / 10_000)
    )
    const platformFeeCents = Math.max(policy.platformFeeFloorCents, rawPlatformFeeCents)
    const boundedPlatformFeeCents = Math.min(grossAmountCents, platformFeeCents)
    const sellerNetCents = Math.max(0, grossAmountCents - boundedPlatformFeeCents)
    return {
      grossAmountCents,
      platformFeeCents: boundedPlatformFeeCents,
      sellerNetCents,
      platformFeeBps: normalizedFeeBps,
    }
  }

  async purchase(userId: string, listingId: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
    })
    if (!listing) throw new NotFoundException('Listing not found')
    if (listing.authorId === userId) {
      throw new ForbiddenException('You cannot purchase your own listing')
    }

    const existing = await this.prisma.purchase.findUnique({
      where: { userId_listingId: { userId, listingId } },
    })
    if (existing) {
      throw new ConflictException('Already purchased')
    }

    if (listing.priceCents === 0) {
      const freePolicy = await this.getRevenuePolicy()
      try {
        const result = await this.prisma.$transaction(async (tx) => {
          // Re-verify price inside tx to prevent free→paid TOCTOU
          const liveListing = await tx.listing.findUnique({
            where: { id: listingId },
            select: { priceCents: true, body: true },
          })
          if (!liveListing) throw new NotFoundException('Listing not found')
          if (liveListing.priceCents !== 0)
            throw new BadRequestException('Listing is no longer free')
          const split = this.splitRevenue(0, freePolicy)
          const purchase = await tx.purchase.create({
            data: {
              userId,
              listingId,
              pricePaidCents: 0,
              grossAmountCents: split.grossAmountCents,
              sellerNetCents: split.sellerNetCents,
              platformFeeCents: split.platformFeeCents,
            },
          })
          await tx.listing.update({
            where: { id: listingId },
            data: { downloads: { increment: 1 } },
          })
          return { purchase, body: liveListing.body }
        })
        return {
          purchase: {
            id: result.purchase.id,
            listingId: result.purchase.listingId,
            pricePaidCents: result.purchase.pricePaidCents,
            grossAmountCents: result.purchase.grossAmountCents,
            sellerNetCents: result.purchase.sellerNetCents,
            platformFeeCents: result.purchase.platformFeeCents,
            createdAt: result.purchase.createdAt,
          },
          body: result.body,
        }
      } catch (err) {
        if (err instanceof BadRequestException) throw err
        if (err instanceof NotFoundException) throw err
        if (isPrismaP2002(err)) throw new ConflictException('Already purchased')
        if (isPrismaP2025(err)) throw new NotFoundException('Listing not found')
        throw err
      }
    }

    const policy = await this.getRevenuePolicy()
    try {
      const result = await this.prisma.$transaction(async (tx) => {
        // Re-read listing inside transaction to prevent price TOCTOU
        const liveListing = await tx.listing.findUnique({
          where: { id: listingId },
          select: { priceCents: true, authorId: true, body: true },
        })
        if (!liveListing) throw new NotFoundException('Listing not found')
        const currentPrice = liveListing.priceCents
        const split = this.splitRevenue(currentPrice, policy)
        const balanceUpdate = await tx.user.updateMany({
          where: { id: userId, balanceCents: { gte: currentPrice } },
          data: { balanceCents: { decrement: currentPrice } },
        })
        if (balanceUpdate.count === 0) {
          // count=0 means either the user row is gone (deleted between auth and tx) or funds are low.
          const userExists = await tx.user.findUnique({
            where: { id: userId },
            select: { id: true },
          })
          if (!userExists) throw new NotFoundException('User not found')
          throw new BadRequestException('Insufficient balance')
        }
        const newPurchase = await tx.purchase.create({
          data: {
            userId,
            listingId,
            pricePaidCents: currentPrice,
            grossAmountCents: split.grossAmountCents,
            sellerNetCents: split.sellerNetCents,
            platformFeeCents: split.platformFeeCents,
          },
        })
        // Scope P2025 catch here so author-deleted and listing-deleted cases are distinct.
        try {
          await tx.user.update({
            where: { id: liveListing.authorId },
            data: { balanceCents: { increment: split.sellerNetCents } },
          })
        } catch (authorErr) {
          if (isPrismaP2025(authorErr)) throw new NotFoundException('Seller account not found')
          throw authorErr
        }
        await tx.listing.update({
          where: { id: listingId },
          data: { downloads: { increment: 1 } },
        })
        return { purchase: newPurchase, body: liveListing.body }
      })
      return {
        purchase: {
          id: result.purchase.id,
          listingId: result.purchase.listingId,
          pricePaidCents: result.purchase.pricePaidCents,
          grossAmountCents: result.purchase.grossAmountCents,
          sellerNetCents: result.purchase.sellerNetCents,
          platformFeeCents: result.purchase.platformFeeCents,
          createdAt: result.purchase.createdAt,
        },
        body: result.body,
      }
    } catch (err) {
      if (err instanceof BadRequestException) throw err
      if (err instanceof NotFoundException) throw err
      if (isPrismaP2002(err)) throw new ConflictException('Already purchased')
      if (isPrismaP2025(err)) throw new NotFoundException('Listing not found')
      throw err
    }
  }
}
