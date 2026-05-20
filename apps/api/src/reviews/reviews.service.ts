import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateReviewInput {
  rating: number;
  comment?: string;
}

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, listingId: string, input: CreateReviewInput) {
    if (
      !Number.isInteger(input.rating) ||
      input.rating < 1 ||
      input.rating > 5
    ) {
      throw new BadRequestException('rating must be an integer 1-5');
    }
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
    });
    if (!listing) throw new NotFoundException('Listing not found');
    if (listing.authorId === userId) {
      throw new ForbiddenException('You cannot review your own listing');
    }

    const purchase = await this.prisma.purchase.findUnique({
      where: { userId_listingId: { userId, listingId } },
    });
    if (!purchase) {
      throw new ForbiddenException('You must purchase before reviewing');
    }

    const existing = await this.prisma.review.findUnique({
      where: { userId_listingId: { userId, listingId } },
    });
    if (existing) {
      throw new ConflictException('You have already reviewed this listing');
    }

    const review = await this.prisma.review.create({
      data: {
        userId,
        listingId,
        rating: input.rating,
        comment: input.comment ?? null,
      },
      include: { user: { select: { id: true, username: true } } },
    });
    return {
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
      user: review.user,
    };
  }

  async listForListing(listingId: string) {
    const reviews = await this.prisma.review.findMany({
      where: { listingId },
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, username: true } } },
    });
    return reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
      user: r.user,
    }));
  }
}
