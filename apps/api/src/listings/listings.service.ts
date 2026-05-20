import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { QueryListingsDto } from './dto/query-listings.dto';

function slugify(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${base || 'listing'}-${suffix}`;
}

function tagsToArray(tags: string | null | undefined): string[] {
  if (!tags) return [];
  return tags
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
}

@Injectable()
export class ListingsService {
  constructor(private readonly prisma: PrismaService) {}

  private serializeCard(l: any) {
    const ratings: number[] = (l.reviews ?? []).map((r: any) => r.rating);
    const avgRating =
      ratings.length > 0
        ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length
        : 0;
    return {
      id: l.id,
      slug: l.slug,
      title: l.title,
      type: l.type,
      description: l.description,
      category: l.category,
      tags: tagsToArray(l.tags),
      model: l.model,
      priceCents: l.priceCents,
      coverEmoji: l.coverEmoji,
      downloads: l.downloads,
      author: l.author
        ? { id: l.author.id, username: l.author.username }
        : undefined,
      avgRating,
      reviewCount: ratings.length,
      createdAt: l.createdAt,
    };
  }

  async list(query: QueryListingsDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 12;
    const where: any = {};
    if (query.type) where.type = query.type;
    if (query.category) where.category = query.category;
    if (query.model) where.model = query.model;
    if (query.q) {
      const q = query.q;
      where.OR = [
        { title: { contains: q } },
        { description: { contains: q } },
        { tags: { contains: q } },
      ];
    }
    if (query.free === 'true') where.priceCents = 0;
    if (query.free === 'false') where.priceCents = { gt: 0 };

    const sort = query.sort ?? 'newest';

    if (sort === 'top') {
      // Need to compute avg rating; fetch all matching then sort in memory
      const all = await this.prisma.listing.findMany({
        where,
        include: {
          author: { select: { id: true, username: true } },
          reviews: true,
        },
      });
      const scored = all.map((l) => {
        const ratings = l.reviews.map((r) => r.rating);
        const avg =
          ratings.length > 0
            ? ratings.reduce((a, b) => a + b, 0) / ratings.length
            : 0;
        return { listing: l, avg };
      });
      scored.sort((a, b) => {
        if (b.avg !== a.avg) return b.avg - a.avg;
        return b.listing.createdAt.getTime() - a.listing.createdAt.getTime();
      });
      const total = scored.length;
      const sliced = scored.slice((page - 1) * pageSize, page * pageSize);
      return {
        items: sliced.map((s) => this.serializeCard(s.listing)),
        total,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      };
    }

    const orderBy: any =
      sort === 'trending'
        ? [{ downloads: 'desc' }, { createdAt: 'desc' }]
        : [{ createdAt: 'desc' }];

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
    ]);

    return {
      items: items.map((l) => this.serializeCard(l)),
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  async getBySlug(slug: string, userId: string | null) {
    const listing = await this.prisma.listing.findUnique({
      where: { slug },
      include: {
        author: { select: { id: true, username: true, bio: true, avatarUrl: true } },
        reviews: {
          include: {
            user: { select: { id: true, username: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!listing) throw new NotFoundException('Listing not found');

    const isOwner = !!userId && listing.authorId === userId;
    let isPurchased = false;
    if (userId && !isOwner) {
      const purchase = await this.prisma.purchase.findUnique({
        where: {
          userId_listingId: { userId, listingId: listing.id },
        },
      });
      isPurchased = !!purchase;
    }
    const isFree = listing.priceCents === 0;
    const canViewBody = isOwner || isPurchased || isFree;

    const ratings = listing.reviews.map((r) => r.rating);
    const avgRating =
      ratings.length > 0
        ? ratings.reduce((a, b) => a + b, 0) / ratings.length
        : 0;

    return {
      id: listing.id,
      slug: listing.slug,
      title: listing.title,
      type: listing.type,
      description: listing.description,
      body: canViewBody ? listing.body : null,
      previewBody: listing.previewBody,
      category: listing.category,
      tags: tagsToArray(listing.tags),
      model: listing.model,
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
      })),
      avgRating,
      reviewCount: ratings.length,
      createdAt: listing.createdAt,
      updatedAt: listing.updatedAt,
      isOwner,
      isPurchased,
      canViewBody,
    };
  }

  async create(userId: string, dto: CreateListingDto) {
    const slug = slugify(dto.title);
    const previewBody = dto.body.slice(0, 300);
    const listing = await this.prisma.listing.create({
      data: {
        title: dto.title,
        slug,
        type: dto.type,
        description: dto.description,
        body: dto.body,
        previewBody,
        category: dto.category,
        tags: dto.tags,
        model: dto.model,
        priceCents: dto.priceCents,
        coverEmoji: dto.coverEmoji ?? '✨',
        authorId: userId,
      },
      include: {
        author: { select: { id: true, username: true } },
        reviews: true,
      },
    });
    return this.serializeCard(listing);
  }

  async update(userId: string, id: string, dto: UpdateListingDto) {
    const existing = await this.prisma.listing.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Listing not found');
    if (existing.authorId !== userId) {
      throw new ForbiddenException('Not the owner of this listing');
    }
    const data: any = { ...dto };
    if (dto.body !== undefined) {
      data.previewBody = dto.body.slice(0, 300);
    }
    const updated = await this.prisma.listing.update({
      where: { id },
      data,
      include: {
        author: { select: { id: true, username: true } },
        reviews: true,
      },
    });
    return this.serializeCard(updated);
  }

  async remove(userId: string, id: string) {
    const existing = await this.prisma.listing.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Listing not found');
    if (existing.authorId !== userId) {
      throw new ForbiddenException('Not the owner of this listing');
    }
    await this.prisma.review.deleteMany({ where: { listingId: id } });
    await this.prisma.purchase.deleteMany({ where: { listingId: id } });
    await this.prisma.listing.delete({ where: { id } });
    return { ok: true };
  }
}
