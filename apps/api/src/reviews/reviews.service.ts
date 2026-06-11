import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import type { AttachmentInput } from '@promptmarket/shared'
import { PrismaService } from '../prisma/prisma.service'
import { isPrismaP2002 } from '../prisma/prisma-errors'
import { buildAttachmentCreates, serializeAttachment } from '../attachments/attachment.util'

export interface CreateReviewInput {
  rating: number
  comment?: string
  attachments?: AttachmentInput[]
}

export interface CreateReviewReplyInput {
  body: string
}

type ReplyRow = {
  id: string
  body: string
  deletedAt: Date | null
  createdAt: Date
  user: { id: string; username: string }
}

/** Soft-deleted replies keep their slot but lose body + author identity. */
function serializeReply(reply: ReplyRow) {
  return {
    id: reply.id,
    body: reply.deletedAt ? null : reply.body,
    deleted: !!reply.deletedAt,
    createdAt: reply.createdAt,
    // 삭제된 답글은 본문과 함께 작성자 신원도 감춘다 (공개 엔드포인트 노출 방지)
    user: reply.deletedAt ? null : reply.user,
  }
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

    const attachments = buildAttachmentCreates(userId, input.attachments)

    try {
      const review = await this.prisma.review.create({
        data: {
          userId,
          listingId,
          rating: input.rating,
          comment: input.comment ?? null,
          attachments: { create: attachments },
        },
        include: {
          user: { select: { id: true, username: true } },
          attachments: true,
        },
      })
      return {
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
        user: review.user,
        replies: [],
        attachments: review.attachments.map(serializeAttachment),
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
      where: { listingId, hiddenAt: null },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, username: true } },
        attachments: true,
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
      attachments: r.attachments.map(serializeAttachment),
      replies: r.replies.map(serializeReply),
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
      where: { id: reviewId, listingId, hiddenAt: null },
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
      deleted: false,
      createdAt: reply.createdAt,
      user: reply.user,
    }
  }

  /**
   * Soft delete — the reply stays as a placeholder ("deleted reply") so the
   * conversation below a review keeps its shape.
   */
  async deleteReply(
    user: { id: string; isAdmin?: boolean },
    listingId: string,
    reviewId: string,
    replyId: string
  ) {
    const reply = await this.prisma.reviewReply.findFirst({
      where: { id: replyId, reviewId, review: { listingId } },
      select: { id: true, userId: true, deletedAt: true },
    })
    if (!reply || reply.deletedAt) throw new NotFoundException('Reply not found')
    if (reply.userId !== user.id && !user.isAdmin) {
      throw new ForbiddenException('Only the author can delete this reply')
    }
    await this.prisma.reviewReply.update({
      where: { id: replyId },
      data: { deletedAt: new Date() },
    })
    return { ok: true }
  }
}
