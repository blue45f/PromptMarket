import { describe, expect, it } from 'vitest'
import {
  CreateListingSchema,
  CreateReviewSchema,
  RevenueSettingsSchema,
  RevenueSettingsHistorySchema,
  AdminRevenueSummarySchema,
  LISTING_TYPE_META,
  ListingQuerySchema,
  ListingType,
  LoginSchema,
  MODELS,
  MODEL_BY_SLUG,
  PromptTechnique,
  RegisterSchema,
  TECHNIQUE_META,
  TopupSchema,
  formatPrice,
  modelFamily,
  modelLabel,
  modelVendor,
  typeEmoji,
  typeLabel,
} from './index'

describe('formatPrice', () => {
  it('returns "Free" for 0 cents', () => {
    expect(formatPrice(0)).toBe('Free')
  })

  it('renders cents as dollars with 2 decimals', () => {
    expect(formatPrice(199)).toBe('$1.99')
    expect(formatPrice(12300)).toBe('$123.00')
    expect(formatPrice(1)).toBe('$0.01')
  })
})

describe('LISTING_TYPE_META', () => {
  it('has an entry for every ListingType enum value', () => {
    for (const t of ListingType.options) {
      expect(LISTING_TYPE_META).toHaveProperty(t)
      const meta = LISTING_TYPE_META[t]
      expect(meta.label).toBeTruthy()
      expect(meta.emoji).toBeTruthy()
      expect(meta.gradient).toContain('from-')
    }
  })

  it('typeLabel / typeEmoji read from the same map', () => {
    expect(typeLabel('PROMPT')).toBe(LISTING_TYPE_META.PROMPT.label)
    expect(typeEmoji('MCP_SERVER')).toBe(LISTING_TYPE_META.MCP_SERVER.emoji)
  })
})

describe('model registry', () => {
  it('every MODELS entry round-trips through MODEL_BY_SLUG', () => {
    for (const m of MODELS) {
      expect(MODEL_BY_SLUG[m.slug]?.label).toBe(m.label)
      expect(MODEL_BY_SLUG[m.slug]?.vendor).toBe(m.vendor)
      expect(MODEL_BY_SLUG[m.slug]?.family).toBe(m.family)
    }
  })

  it('helpers return safe fallbacks for unknown slugs', () => {
    expect(modelLabel('not-a-real-slug')).toBe('not-a-real-slug')
    expect(modelVendor('not-a-real-slug')).toBe('')
    expect(modelFamily('not-a-real-slug')).toBe('')
  })
})

describe('CreateListingSchema', () => {
  const valid = {
    title: 'Test prompt that is long enough',
    type: 'PROMPT' as const,
    description: 'A reasonably long description.',
    body: '# Body\n\nReasonably long markdown body for the listing.',
    category: 'Coding' as const,
    tags: 'agent,test',
    models: ['claude-opus-4-7'] as const,
    technique: 'chain-of-thought' as const,
    difficulty: 'intermediate' as const,
    license: 'MIT' as const,
    version: '1.0.0',
    priceCents: 199,
    coverEmoji: '✨',
  }

  it('accepts a well-formed payload', () => {
    const r = CreateListingSchema.safeParse(valid)
    expect(r.success).toBe(true)
  })

  it('rejects short titles', () => {
    const r = CreateListingSchema.safeParse({ ...valid, title: 'no' })
    expect(r.success).toBe(false)
  })

  it('rejects negative priceCents', () => {
    const r = CreateListingSchema.safeParse({ ...valid, priceCents: -1 })
    expect(r.success).toBe(false)
  })

  it('rejects malformed semver in version', () => {
    const r = CreateListingSchema.safeParse({ ...valid, version: '1.0' })
    expect(r.success).toBe(false)
  })

  it('rejects empty models array', () => {
    const r = CreateListingSchema.safeParse({ ...valid, models: [] })
    expect(r.success).toBe(false)
  })
})

describe('TECHNIQUE_META', () => {
  it('has an entry for every PromptTechnique enum value', () => {
    for (const t of PromptTechnique.options) {
      expect(TECHNIQUE_META).toHaveProperty(t)
      const meta = TECHNIQUE_META[t as PromptTechnique]
      expect(meta.label).toBeTruthy()
      expect(meta.hint).toBeTruthy()
    }
  })
})

describe('ListingQuerySchema', () => {
  it('defaults sort=newest, page=1, pageSize=12 when omitted', () => {
    const r = ListingQuerySchema.safeParse({})
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.sort).toBe('newest')
      expect(r.data.page).toBe(1)
      expect(r.data.pageSize).toBe(12)
    }
  })

  it('coerces string page and pageSize to numbers', () => {
    const r = ListingQuerySchema.safeParse({ page: '3', pageSize: '24' })
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.page).toBe(3)
      expect(r.data.pageSize).toBe(24)
    }
  })

  it('rejects page < 1', () => {
    expect(ListingQuerySchema.safeParse({ page: 0 }).success).toBe(false)
  })

  it('rejects pageSize > 48', () => {
    expect(ListingQuerySchema.safeParse({ pageSize: 49 }).success).toBe(false)
  })

  it('accepts all valid sort values', () => {
    for (const sort of ['newest', 'trending', 'top']) {
      expect(ListingQuerySchema.safeParse({ sort }).success).toBe(true)
    }
  })

  it('normalizes comma-separated trust signal filters', () => {
    const r = ListingQuerySchema.safeParse({ signal: 'reviewed,multi-model' })
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.signal).toEqual(['reviewed', 'multi-model'])
    }
  })

  it('rejects unknown trust signal filters', () => {
    expect(ListingQuerySchema.safeParse({ signal: 'reviewed,unknown' }).success).toBe(false)
  })
})

describe('RegisterSchema', () => {
  const valid = { email: 'alice@example.com', username: 'alice_1', password: 'secret1' }

  it('accepts a well-formed payload', () => {
    expect(RegisterSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects an invalid email', () => {
    expect(RegisterSchema.safeParse({ ...valid, email: 'not-an-email' }).success).toBe(false)
  })

  it('rejects a username with spaces or special chars', () => {
    expect(RegisterSchema.safeParse({ ...valid, username: 'hi there!' }).success).toBe(false)
  })

  it('rejects a username that is too short', () => {
    expect(RegisterSchema.safeParse({ ...valid, username: 'ab' }).success).toBe(false)
  })

  it('rejects a short password', () => {
    expect(RegisterSchema.safeParse({ ...valid, password: 'abc' }).success).toBe(false)
  })
})

describe('LoginSchema', () => {
  it('accepts valid email + password', () => {
    expect(LoginSchema.safeParse({ email: 'a@b.com', password: 'p' }).success).toBe(true)
  })

  it('rejects missing password', () => {
    expect(LoginSchema.safeParse({ email: 'a@b.com' }).success).toBe(false)
  })

  it('rejects invalid email', () => {
    expect(LoginSchema.safeParse({ email: 'not-email', password: 'pw' }).success).toBe(false)
  })
})

describe('CreateReviewSchema', () => {
  it('accepts rating 1–5 with no comment', () => {
    for (const rating of [1, 2, 3, 4, 5]) {
      expect(CreateReviewSchema.safeParse({ rating }).success).toBe(true)
    }
  })

  it('accepts an optional comment', () => {
    expect(CreateReviewSchema.safeParse({ rating: 4, comment: 'Great!' }).success).toBe(true)
  })

  it('rejects rating 0 and 6', () => {
    expect(CreateReviewSchema.safeParse({ rating: 0 }).success).toBe(false)
    expect(CreateReviewSchema.safeParse({ rating: 6 }).success).toBe(false)
  })

  it('rejects a comment over 1000 chars', () => {
    expect(CreateReviewSchema.safeParse({ rating: 5, comment: 'x'.repeat(1001) }).success).toBe(
      false
    )
  })
})

describe('TopupSchema', () => {
  it('accepts amounts between 100 and 100_000 cents', () => {
    expect(TopupSchema.safeParse({ amountCents: 100 }).success).toBe(true)
    expect(TopupSchema.safeParse({ amountCents: 50_000 }).success).toBe(true)
    expect(TopupSchema.safeParse({ amountCents: 100_000 }).success).toBe(true)
  })

  it('rejects amounts below 100', () => {
    expect(TopupSchema.safeParse({ amountCents: 99 }).success).toBe(false)
  })

  it('rejects amounts above 100_000', () => {
    expect(TopupSchema.safeParse({ amountCents: 100_001 }).success).toBe(false)
  })

  it('rejects non-integer amounts', () => {
    expect(TopupSchema.safeParse({ amountCents: 1000.5 }).success).toBe(false)
  })
})

describe('Revenue schemas', () => {
  it('accepts a valid revenue setting payload', () => {
    expect(
      RevenueSettingsSchema.safeParse({
        platformFeeBps: 1700,
        platformFeePercent: 17,
        premiumFeeBps: 1200,
        premiumFeePercent: 12,
        premiumThresholdCents: 3000,
        platformFeeFloorCents: 0,
      }).success
    ).toBe(true)
  })

  it('accepts a valid admin revenue summary payload', () => {
    expect(
      AdminRevenueSummarySchema.safeParse({
        totalPurchases: 3,
        paidPurchases: 2,
        freePurchases: 1,
        totalGrossCents: 4500,
        totalSellerNetCents: 3600,
        totalPlatformFeeCents: 900,
        topCreators: [
          {
            creatorId: 'c1',
            username: 'alice',
            listingCount: 1,
            salesCount: 2,
            grossRevenueCents: 2000,
            sellerNetCents: 1600,
            platformFeeCents: 400,
          },
        ],
      }).success
    ).toBe(true)
  })

  it('accepts valid revenue settings history payload', () => {
    expect(
      RevenueSettingsHistorySchema.safeParse([
        { key: 'platform_fee_bps', value: 1700, updatedAt: '2026-06-01T00:00:00.000Z' },
        { key: 'platform_fee_premium_threshold_cents', value: 3000, updatedAt: null },
      ]).success
    ).toBe(true)
  })

  it('rejects negative history values', () => {
    expect(
      RevenueSettingsHistorySchema.safeParse([
        { key: 'platform_fee_bps', value: -1, updatedAt: null },
      ]).success
    ).toBe(false)
  })
})
