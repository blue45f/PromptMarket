import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  private serializeListing(l: any) {
    const ratings: number[] = (l.reviews ?? []).map((r: any) => r.rating);
    const avgRating =
      ratings.length > 0
        ? ratings.reduce((a, b) => a + b, 0) / ratings.length
        : 0;
    const splitCsv = (csv: string | null | undefined): string[] =>
      csv ? csv.split(',').map((t: string) => t.trim()).filter(Boolean) : [];
    return {
      id: l.id,
      slug: l.slug,
      title: l.title,
      type: l.type,
      description: l.description,
      category: l.category,
      tags: splitCsv(l.tags),
      models: splitCsv(l.models),
      technique: l.technique ?? null,
      difficulty: l.difficulty,
      license: l.license,
      version: l.version,
      priceCents: l.priceCents,
      coverEmoji: l.coverEmoji,
      downloads: l.downloads,
      avgRating,
      reviewCount: ratings.length,
      createdAt: l.createdAt,
    };
  }

  async getPublicProfile(username: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      include: {
        listings: {
          include: { reviews: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return {
      id: user.id,
      username: user.username,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
      listings: user.listings.map((l) => ({
        ...this.serializeListing(l),
        author: { id: user.id, username: user.username },
      })),
    };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      balanceCents: user.balanceCents,
      createdAt: user.createdAt,
    };
  }

  async topUp(userId: string, amountCents: number) {
    if (!Number.isInteger(amountCents) || amountCents <= 0) {
      throw new BadRequestException('amountCents must be a positive integer');
    }
    if (amountCents > 100000) {
      throw new BadRequestException('amountCents too large');
    }
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { balanceCents: { increment: amountCents } },
    });
    return { balanceCents: user.balanceCents };
  }

  async myPurchases(userId: string) {
    const purchases = await this.prisma.purchase.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        listing: {
          include: {
            reviews: true,
            author: { select: { id: true, username: true } },
          },
        },
      },
    });
    return purchases.map((p) => ({
      id: p.id,
      pricePaidCents: p.pricePaidCents,
      createdAt: p.createdAt,
      listing: {
        ...this.serializeListing(p.listing),
        author: p.listing.author,
      },
    }));
  }

  async myListings(userId: string) {
    const listings = await this.prisma.listing.findMany({
      where: { authorId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        reviews: true,
        purchases: { select: { pricePaidCents: true } },
        author: { select: { id: true, username: true } },
      },
    });
    return listings.map((l) => {
      const salesCount = l.purchases.length;
      const earningsCents = l.purchases.reduce(
        (sum, p) => sum + p.pricePaidCents,
        0,
      );
      return {
        ...this.serializeListing(l),
        author: l.author,
        salesCount,
        earningsCents,
      };
    });
  }
}
