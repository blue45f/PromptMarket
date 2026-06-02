import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { MODELS } from '@promptmarket/shared'
import { PrismaService } from '../prisma/prisma.service'
import { CreateListingDto } from './dto/create-listing.dto'
import { UpdateListingDto } from './dto/update-listing.dto'
import { QueryListingsDto } from './dto/query-listings.dto'

function slugify(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
  const suffix = Math.random().toString(36).slice(2, 8)
  return `${base || 'listing'}-${suffix}`
}

function csvToArray(csv: string | null | undefined): string[] {
  if (!csv) return []
  return csv
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
}

function arrayToCsv(arr: readonly string[] | string | undefined): string {
  if (Array.isArray(arr)) return arr.join(',')
  if (typeof arr === 'string') return arr
  return ''
}

/** Map a vendor name (case-insensitive) to all model slugs that belong to it. */
function slugsForVendor(vendor: string): string[] {
  const needle = vendor.trim().toLowerCase()
  return MODELS.filter((m) => m.vendor.toLowerCase() === needle).map((m) => m.slug)
}

function addAnd(where: Record<string, any>, clause: Record<string, any>) {
  where.AND = [...(Array.isArray(where.AND) ? where.AND : []), clause]
}

/** Exact-token match for a slug stored in a comma-separated models field. */
function modelSlugMatch(slug: string): Record<string, any> {
  return {
    OR: [
      { models: { equals: slug } },
      { models: { startsWith: `${slug},` } },
      { models: { endsWith: `,${slug}` } },
      { models: { contains: `,${slug},` } },
    ],
  }
}

const FRESH_SIGNAL_DAYS = 90
const DAY_MS = 86_400_000

@Injectable()
export class ListingsService {
  /** Tiny in-process cache for /listings/stats (homepage). */
  private statsCache: {
    value: { totalListings: number; totalDownloads: number; totalCreators: number }
    expires: number
  } | null = null
  private readonly STATS_TTL_MS = 30_000

  constructor(private readonly prisma: PrismaService) {}

  private serializeCard(l: any) {
    const ratings: number[] = (l.reviews ?? []).map((r: any) => r.rating)
    const avgRating =
      ratings.length > 0 ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length : 0
    return {
      id: l.id,
      slug: l.slug,
      title: l.title,
      type: l.type,
      description: l.description,
      category: l.category,
      tags: csvToArray(l.tags),
      models: csvToArray(l.models),
      technique: l.technique ?? null,
      difficulty: l.difficulty,
      license: l.license,
      version: l.version,
      priceCents: l.priceCents,
      coverEmoji: l.coverEmoji,
      downloads: l.downloads,
      author: l.author ? { id: l.author.id, username: l.author.username } : undefined,
      avgRating,
      reviewCount: ratings.length,
      createdAt: l.createdAt,
    }
  }

  async list(query: QueryListingsDto) {
    const page = query.page ?? 1
    const pageSize = query.pageSize ?? 12
    const where: any = {}
    if (query.type) where.type = query.type
    if (query.category) where.category = query.category
    if (query.technique) where.technique = query.technique
    if (query.difficulty) where.difficulty = query.difficulty
    if (query.model) addAnd(where, modelSlugMatch(query.model))
    if (query.vendor) {
      const slugs = slugsForVendor(query.vendor)
      if (slugs.length === 0) {
        // unknown vendor → guarantee empty result set
        where.id = '__no_match__'
      } else {
        where.OR = (where.OR ?? []).concat(slugs.map(modelSlugMatch))
      }
    }
    if (query.q) {
      const q = query.q
      const qFilter = [
        { title: { contains: q } },
        { description: { contains: q } },
        { tags: { contains: q } },
        { models: { contains: q } },
      ]
      if (where.OR && Array.isArray(where.OR) && where.OR.length > 0) {
        // Combine vendor OR with q OR via AND so we don't accidentally widen.
        where.AND = [...(where.AND ?? []), { OR: where.OR }, { OR: qFilter }]
        delete where.OR
      } else {
        where.OR = qFilter
      }
    }
    if (query.free === 'true') where.priceCents = 0
    if (query.free === 'false') where.priceCents = { gt: 0 }
    const signals = query.signal ?? []
    if (signals.includes('reviewed')) where.reviews = { some: {} }
    if (signals.includes('used')) where.downloads = { gt: 0 }
    if (signals.includes('multi-model')) addAnd(where, { models: { contains: ',' } })
    if (signals.includes('fresh')) {
      where.updatedAt = { gte: new Date(Date.now() - FRESH_SIGNAL_DAYS * DAY_MS) }
    }

    const sort = query.sort ?? 'newest'

    if (sort === 'top') {
      // Need to compute avg rating; fetch all matching then sort in memory.
      // Safety cap prevents full-table load when table is large.
      const all = await this.prisma.listing.findMany({
        where,
        take: 5000,
        include: {
          author: { select: { id: true, username: true } },
          reviews: true,
        },
      })
      const scored = all.map((l) => {
        const ratings = l.reviews.map((r) => r.rating)
        const avg = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0
        return { listing: l, avg }
      })
      scored.sort((a, b) => {
        if (b.avg !== a.avg) return b.avg - a.avg
        return b.listing.createdAt.getTime() - a.listing.createdAt.getTime()
      })
      const total = scored.length
      const sliced = scored.slice((page - 1) * pageSize, page * pageSize)
      return {
        items: sliced.map((s) => this.serializeCard(s.listing)),
        total,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      }
    }

    const orderBy: any =
      sort === 'trending' ? [{ downloads: 'desc' }, { createdAt: 'desc' }] : [{ createdAt: 'desc' }]

    const [total, items] = await Promise.all([
      this.prisma.listing.count({ where }),
      this.prisma.listing.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          author: { select: { id: true, username: true } },
          reviews: true,
        },
      }),
    ])

    return {
      items: items.map((l) => this.serializeCard(l)),
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    }
  }

  async getBySlug(slug: string, userId: string | null) {
    const listing = await this.prisma.listing.findUnique({
      where: { slug },
      include: {
        author: { select: { id: true, username: true, bio: true, avatarUrl: true } },
        reviews: {
          include: {
            user: { select: { id: true, username: true } },
            replies: {
              orderBy: { createdAt: 'asc' },
              include: { user: { select: { id: true, username: true } } },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    })
    if (!listing) throw new NotFoundException('Listing not found')

    const isOwner = !!userId && listing.authorId === userId
    let isPurchased = false
    if (userId && !isOwner) {
      const purchase = await this.prisma.purchase.findUnique({
        where: {
          userId_listingId: { userId, listingId: listing.id },
        },
      })
      isPurchased = !!purchase
    }
    const isFree = listing.priceCents === 0
    const canViewBody = isOwner || isPurchased || isFree

    const ratings = listing.reviews.map((r) => r.rating)
    const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0

    return {
      id: listing.id,
      slug: listing.slug,
      title: listing.title,
      type: listing.type,
      description: listing.description,
      body: canViewBody ? listing.body : null,
      previewBody: listing.previewBody,
      category: listing.category,
      tags: csvToArray(listing.tags),
      models: csvToArray(listing.models),
      technique: listing.technique ?? null,
      difficulty: listing.difficulty,
      license: listing.license,
      version: listing.version,
      priceCents: listing.priceCents,
      coverEmoji: listing.coverEmoji,
      downloads: listing.downloads,
      author: listing.author,
      reviews: listing.reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
        user: r.user,
        replies: (r.replies ?? []).map((reply) => ({
          id: reply.id,
          body: reply.body,
          createdAt: reply.createdAt,
          user: reply.user,
        })),
      })),
      avgRating,
      reviewCount: ratings.length,
      createdAt: listing.createdAt,
      updatedAt: listing.updatedAt,
      isOwner,
      isPurchased,
      canViewBody,
    }
  }

  async related(id: string, limit: number) {
    const safeLimit = Math.max(1, Math.min(limit, 12))
    const seed = await this.prisma.listing.findUnique({ where: { id } })
    if (!seed) throw new NotFoundException('Listing not found')

    const items = await this.prisma.listing.findMany({
      where: {
        id: { not: id },
        OR: [{ type: seed.type }, { category: seed.category }],
      },
      orderBy: [{ downloads: 'desc' }, { createdAt: 'desc' }],
      take: safeLimit,
      include: {
        author: { select: { id: true, username: true } },
        reviews: true,
      },
    })
    return { items: items.map((l) => this.serializeCard(l)) }
  }

  async stats() {
    const now = Date.now()
    if (this.statsCache && this.statsCache.expires > now) {
      return this.statsCache.value
    }
    const [totalListings, downloadsAgg, creators] = await Promise.all([
      this.prisma.listing.count(),
      this.prisma.listing.aggregate({ _sum: { downloads: true } }),
      this.prisma.listing.findMany({
        select: { authorId: true },
        distinct: ['authorId'],
      }),
    ])
    const value = {
      totalListings,
      totalDownloads: downloadsAgg._sum.downloads ?? 0,
      totalCreators: creators.length,
    }
    this.statsCache = { value, expires: now + this.STATS_TTL_MS }
    return value
  }

  async create(userId: string, dto: CreateListingDto) {
    const slug = slugify(dto.title)
    const previewBody = dto.body.slice(0, 300)
    const listing = await this.prisma.listing.create({
      data: {
        title: dto.title,
        slug,
        type: dto.type,
        description: dto.description,
        body: dto.body,
        previewBody,
        category: dto.category,
        tags: arrayToCsv(dto.tags),
        models: arrayToCsv(dto.models),
        technique: dto.technique ?? null,
        difficulty: dto.difficulty ?? 'intermediate',
        license: dto.license ?? 'MIT',
        version: dto.version ?? '1.0.0',
        priceCents: dto.priceCents,
        coverEmoji: dto.coverEmoji ?? '✨',
        authorId: userId,
      },
      include: {
        author: { select: { id: true, username: true } },
        reviews: true,
      },
    })
    return this.serializeCard(listing)
  }

  async update(userId: string, id: string, dto: UpdateListingDto) {
    const existing = await this.prisma.listing.findUnique({ where: { id } })
    if (!existing) throw new NotFoundException('Listing not found')
    if (existing.authorId !== userId) {
      throw new ForbiddenException('Not the owner of this listing')
    }
    const data: any = {}
    if (dto.title !== undefined) data.title = dto.title
    if (dto.type !== undefined) data.type = dto.type
    if (dto.description !== undefined) data.description = dto.description
    if (dto.body !== undefined) {
      data.body = dto.body
      data.previewBody = dto.body.slice(0, 300)
    }
    if (dto.category !== undefined) data.category = dto.category
    if (dto.tags !== undefined) data.tags = arrayToCsv(dto.tags)
    if (dto.models !== undefined) data.models = arrayToCsv(dto.models)
    if (dto.technique !== undefined) data.technique = dto.technique ?? null
    if (dto.difficulty !== undefined) data.difficulty = dto.difficulty
    if (dto.license !== undefined) data.license = dto.license
    if (dto.version !== undefined) data.version = dto.version
    if (dto.priceCents !== undefined) data.priceCents = dto.priceCents
    if (dto.coverEmoji !== undefined) data.coverEmoji = dto.coverEmoji

    const updated = await this.prisma.listing.update({
      where: { id },
      data,
      include: {
        author: { select: { id: true, username: true } },
        reviews: true,
      },
    })
    return this.serializeCard(updated)
  }

  async remove(userId: string, id: string) {
    const existing = await this.prisma.listing.findUnique({ where: { id } })
    if (!existing) throw new NotFoundException('Listing not found')
    if (existing.authorId !== userId) {
      throw new ForbiddenException('Not the owner of this listing')
    }
    await this.prisma.$transaction([
      this.prisma.review.deleteMany({ where: { listingId: id } }),
      this.prisma.purchase.deleteMany({ where: { listingId: id } }),
      this.prisma.listing.delete({ where: { id } }),
    ])
    return { ok: true }
  }
}
