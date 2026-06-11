import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

const LIST_TAKE = 100

/**
 * Moderation backend for the admin surfaces: discussion threads, reviews,
 * attachments, and member suspension. Hide is reversible (timestamp column),
 * delete is permanent. Hidden content disappears from public lists but keeps
 * its rows so a wrong call can be undone.
 */
@Injectable()
export class ModerationService {
  constructor(private readonly prisma: PrismaService) {}

  async listThreads(includeHidden: boolean) {
    const threads = await this.prisma.discussionThread.findMany({
      where: includeHidden ? {} : { hiddenAt: null },
      orderBy: { createdAt: 'desc' },
      take: LIST_TAKE,
      include: {
        author: { select: { id: true, username: true } },
        _count: { select: { comments: true, attachments: true } },
      },
    })
    // 첨부 패널은 count===0 이면 비활성화되므로 댓글에만 달린 첨부도 합산해야 한다.
    const ids = threads.map((t) => t.id)
    const commentAttachments = ids.length
      ? await this.prisma.attachment.findMany({
          where: { comment: { threadId: { in: ids } } },
          select: { comment: { select: { threadId: true } } },
        })
      : []
    const commentAttachmentCount = new Map<string, number>()
    for (const a of commentAttachments) {
      const tid = a.comment?.threadId
      if (tid) commentAttachmentCount.set(tid, (commentAttachmentCount.get(tid) ?? 0) + 1)
    }
    return threads.map((t) => ({
      id: t.id,
      title: t.title,
      category: t.category,
      author: t.author,
      commentCount: t._count.comments,
      attachmentCount: t._count.attachments + (commentAttachmentCount.get(t.id) ?? 0),
      hiddenAt: t.hiddenAt,
      createdAt: t.createdAt,
    }))
  }

  async setThreadVisibility(id: string, hidden: boolean) {
    const thread = await this.prisma.discussionThread.findUnique({
      where: { id },
      select: { id: true },
    })
    if (!thread) throw new NotFoundException('Thread not found')
    const updated = await this.prisma.discussionThread.update({
      where: { id },
      data: { hiddenAt: hidden ? new Date() : null },
      select: { id: true, hiddenAt: true },
    })
    return { id: updated.id, hiddenAt: updated.hiddenAt }
  }

  async deleteThread(id: string) {
    const thread = await this.prisma.discussionThread.findUnique({
      where: { id },
      select: { id: true },
    })
    if (!thread) throw new NotFoundException('Thread not found')
    await this.prisma.discussionThread.delete({ where: { id } })
    return { ok: true }
  }

  async listReviews(includeHidden: boolean) {
    const reviews = await this.prisma.review.findMany({
      where: includeHidden ? {} : { hiddenAt: null },
      orderBy: { createdAt: 'desc' },
      take: LIST_TAKE,
      include: {
        user: { select: { id: true, username: true } },
        listing: { select: { id: true, slug: true, title: true } },
        _count: { select: { replies: true, attachments: true } },
      },
    })
    return reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      user: r.user,
      listing: r.listing,
      replyCount: r._count.replies,
      attachmentCount: r._count.attachments,
      hiddenAt: r.hiddenAt,
      createdAt: r.createdAt,
    }))
  }

  async setReviewVisibility(id: string, hidden: boolean) {
    const review = await this.prisma.review.findUnique({ where: { id }, select: { id: true } })
    if (!review) throw new NotFoundException('Review not found')
    const updated = await this.prisma.review.update({
      where: { id },
      data: { hiddenAt: hidden ? new Date() : null },
      select: { id: true, hiddenAt: true },
    })
    return { id: updated.id, hiddenAt: updated.hiddenAt }
  }

  async deleteReview(id: string) {
    const review = await this.prisma.review.findUnique({ where: { id }, select: { id: true } })
    if (!review) throw new NotFoundException('Review not found')
    await this.prisma.$transaction([
      this.prisma.attachment.deleteMany({ where: { reviewId: id } }),
      this.prisma.reviewReply.deleteMany({ where: { reviewId: id } }),
      this.prisma.review.delete({ where: { id } }),
    ])
    return { ok: true }
  }

  /**
   * Attachments for one moderation target. Loaded lazily by the admin UI —
   * data URLs are heavy, so they never ride along with the list endpoints.
   * A threadId covers the thread body plus all of its comments.
   */
  async listAttachments(target: { threadId?: string; reviewId?: string }) {
    if (!target.threadId && !target.reviewId) {
      throw new BadRequestException('threadId or reviewId is required')
    }
    const attachments = await this.prisma.attachment.findMany({
      where: target.threadId
        ? { OR: [{ threadId: target.threadId }, { comment: { threadId: target.threadId } }] }
        : { reviewId: target.reviewId },
      orderBy: { createdAt: 'asc' },
      include: { uploader: { select: { id: true, username: true } } },
    })
    return attachments.map((a) => ({
      id: a.id,
      dataUrl: a.dataUrl,
      byteSize: a.byteSize,
      width: a.width,
      height: a.height,
      uploader: a.uploader,
      createdAt: a.createdAt,
    }))
  }

  /** Strip a single attachment from whatever post carries it. */
  async deleteAttachment(id: string) {
    const attachment = await this.prisma.attachment.findUnique({
      where: { id },
      select: { id: true },
    })
    if (!attachment) throw new NotFoundException('Attachment not found')
    await this.prisma.attachment.delete({ where: { id } })
    return { ok: true }
  }

  async listMembers(q?: string) {
    const needle = q?.trim()
    const users = await this.prisma.user.findMany({
      where: needle
        ? { OR: [{ username: { contains: needle } }, { email: { contains: needle } }] }
        : {},
      orderBy: { createdAt: 'desc' },
      take: LIST_TAKE,
      include: {
        _count: { select: { listings: true, reviews: true, discussionThreads: true } },
      },
    })
    return users.map((u) => ({
      id: u.id,
      username: u.username,
      email: u.email,
      isAdmin: u.isAdmin,
      suspendedAt: u.suspendedAt,
      createdAt: u.createdAt,
      listingCount: u._count.listings,
      reviewCount: u._count.reviews,
      threadCount: u._count.discussionThreads,
    }))
  }

  async setMemberSuspension(actorId: string, userId: string, suspended: boolean) {
    if (actorId === userId) {
      throw new BadRequestException('You cannot suspend your own account')
    }
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, isAdmin: true },
    })
    if (!user) throw new NotFoundException('User not found')
    if (user.isAdmin && suspended) {
      throw new BadRequestException('Admins cannot be suspended — demote the account first')
    }
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { suspendedAt: suspended ? new Date() : null },
      select: { id: true, suspendedAt: true },
    })
    return { id: updated.id, suspendedAt: updated.suspendedAt }
  }
}
