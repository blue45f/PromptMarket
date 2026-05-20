import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PurchasesService {
  constructor(private readonly prisma: PrismaService) {}

  async purchase(userId: string, listingId: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
    });
    if (!listing) throw new NotFoundException('Listing not found');
    if (listing.authorId === userId) {
      throw new ForbiddenException('You cannot purchase your own listing');
    }

    const existing = await this.prisma.purchase.findUnique({
      where: { userId_listingId: { userId, listingId } },
    });
    if (existing) {
      throw new ConflictException('Already purchased');
    }

    if (listing.priceCents === 0) {
      const [purchase] = await this.prisma.$transaction([
        this.prisma.purchase.create({
          data: {
            userId,
            listingId,
            pricePaidCents: 0,
          },
        }),
        this.prisma.listing.update({
          where: { id: listingId },
          data: { downloads: { increment: 1 } },
        }),
      ]);
      return {
        purchase: {
          id: purchase.id,
          listingId: purchase.listingId,
          pricePaidCents: purchase.pricePaidCents,
          createdAt: purchase.createdAt,
        },
        body: listing.body,
      };
    }

    const buyer = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!buyer) throw new NotFoundException('Buyer not found');
    if (buyer.balanceCents < listing.priceCents) {
      throw new BadRequestException('Insufficient balance');
    }

    const [purchase] = await this.prisma.$transaction([
      this.prisma.purchase.create({
        data: {
          userId,
          listingId,
          pricePaidCents: listing.priceCents,
        },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: { balanceCents: { decrement: listing.priceCents } },
      }),
      this.prisma.user.update({
        where: { id: listing.authorId },
        data: { balanceCents: { increment: listing.priceCents } },
      }),
      this.prisma.listing.update({
        where: { id: listingId },
        data: { downloads: { increment: 1 } },
      }),
    ]);

    return {
      purchase: {
        id: purchase.id,
        listingId: purchase.listingId,
        pricePaidCents: purchase.pricePaidCents,
        createdAt: purchase.createdAt,
      },
      body: listing.body,
    };
  }
}
