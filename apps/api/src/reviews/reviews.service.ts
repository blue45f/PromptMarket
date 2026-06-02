import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { isPrismaP2002 } from '../prisma/prisma-errors'

export interface CreateReviewInput {
  rating: number
  comment?: string
}

export interface CreateReviewReplyInput {
  body: string
}

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, listingId: string, input: CreateReviewInput) {
    if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
      throw new BadRequestException('rating must be an integer 1-5')
    }
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
    })
    if (!listing) throw new NotFoundException('Listing not found')
    if (listing.authorId === userId) {
      throw new ForbiddenException('You cannot review your own listing')
    }

    const purchase = await this.prisma.purchase.findUnique({
      where: { userId_listingId: { userId, listingId } },
    })
    if (!purchase) {
      throw new ForbiddenException('You must purchase before reviewing')
    }

    const existing = await this.prisma.review.findUnique({
      where: { userId_listingId: { userId, listingId } },
    })
    if (existing) {
      throw new ConflictException('You have already reviewed this listing')
    }

    try {
      const review = await this.prisma.review.create({
        data: {
          userId,
          listingId,
          rating: input.rating,
          comment: input.comment ?? null,
        },
        include: { user: { select: { id: true, username: true } } },
      })
      return {
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
        user: review.user,
        replies: [],
      }
    } catch (err) {
      if (isPrismaP2002(err)) {
        throw new ConflictException('You have already reviewed this listing')
      }
      throw err
    }
  }

  async listForListing(listingId: string) {
    const reviews = await this.prisma.review.findMany({
      where: { listingId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, username: true } },
        replies: {
          orderBy: { createdAt: 'asc' },
          include: { user: { select: { id: true, username: true } } },
        },
      },
    })
    return reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
      user: r.user,
      replies: r.replies.map((reply) => ({
        id: reply.id,
        body: reply.body,
        createdAt: reply.createdAt,
        user: reply.user,
      })),
    }))
  }

  async createReply(
    userId: string,
    listingId: string,
    reviewId: string,
    input: CreateReviewReplyInput
  ) {
    const body = input.body?.trim() ?? ''
    if (body.length < 1 || body.length > 1000) {
      throw new BadRequestException('reply body must be 1-1000 characters')
    }

    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      select: { authorId: true },
    })
    if (!listing) throw new NotFoundException('Listing not found')

    const isAuthor = listing.authorId === userId
    if (!isAuthor) {
      const purchase = await this.prisma.purchase.findUnique({
        where: { userId_listingId: { userId, listingId } },
        select: { id: true },
      })
      if (!purchase) throw new ForbiddenException('Only listing authors and buyers may reply')
    }

    const review = await this.prisma.review.findFirst({
      where: { id: reviewId, listingId },
      select: { id: true },
    })
    if (!review) throw new NotFoundException('Review not found')

    const reply = await this.prisma.reviewReply.create({
      data: {
        reviewId,
        userId,
        body,
      },
      include: { user: { select: { id: true, username: true } } },
    })

    return {
      id: reply.id,
      body: reply.body,
      createdAt: reply.createdAt,
      user: reply.user,
    }
  }
}
