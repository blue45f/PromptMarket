import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { CATEGORIES } from '@promptmarket/shared'
import { PrismaService } from '../prisma/prisma.service'
import { buildAttachmentCreates, serializeAttachment } from '../attachments/attachment.util'
import type { CreateThreadDto } from './dto/create-thread.dto'
import type { CreateCommentDto } from './dto/create-comment.dto'
import type { QueryThreadsDto } from './dto/query-threads.dto'
import { matchesForbiddenWord } from './forbidden-word.util'

const EXCERPT_LENGTH = 180

function toExcerpt(body: string): string {
  const flat = body.replace(/\s+/g, ' ').trim()
  return flat.length > EXCERPT_LENGTH ? `${flat.slice(0, EXCERPT_LENGTH - 1)}…` : flat
}

@Injectable()
export class CommunityService {
  constructor(private readonly prisma: PrismaService) {}

  async listThreads(query: QueryThreadsDto) {
    const page = query.page ?? 1
    const pageSize = query.pageSize ?? 20
    const where = {
      hiddenAt: null,
      ...(query.category ? { category: query.category } : {}),
    }

    const [total, threads, categoryGroups] = await Promise.all([
      this.prisma.discussionThread.count({ where }),
      this.prisma.discussionThread.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          author: { select: { id: true, username: true } },
          comments: {
            where: { deletedAt: null },
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { createdAt: true },
          },
          _count: { select: { comments: true, attachments: true } },
        },
      }),
      this.prisma.discussionThread.groupBy({
        by: ['category'],
        where: { hiddenAt: null },
        _count: { _all: true },
      }),
    ])

    const categoryCounts: Record<string, number> = {}
    for (const cat of CATEGORIES) categoryCounts[cat] = 0
    for (const row of categoryGroups) {
      categoryCounts[row.category] = row._count._all
    }

    return {
      items: threads.map((t) => ({
        id: t.id,
        title: t.title,
        category: t.category,
        excerpt: toExcerpt(t.body),
        author: t.author,
        commentCount: t._count.comments,
        attachmentCount: t._count.attachments,
        lastActivityAt: t.comments[0]?.createdAt ?? t.createdAt,
        createdAt: t.createdAt,
      })),
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
      categoryCounts,
    }
  }

  async getThread(id: string, viewer: { id: string; isAdmin?: boolean } | null) {
    const thread = await this.prisma.discussionThread.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, username: true } },
        attachments: true,
        comments: {
          orderBy: { createdAt: 'asc' },
          include: {
            author: { select: { id: true, username: true } },
            attachments: true,
          },
        },
      },
    })
    if (!thread) throw new NotFoundException('Thread not found')
    if (thread.hiddenAt && !viewer?.isAdmin) {
      // Hidden content is indistinguishable from deleted for regular members.
      throw new NotFoundException('Thread not found')
    }

    return {
      id: thread.id,
      title: thread.title,
      body: thread.body,
      category: thread.category,
      author: thread.author,
      hidden: !!thread.hiddenAt,
      isOwner: !!viewer && thread.authorId === viewer.id,
      createdAt: thread.createdAt,
      updatedAt: thread.updatedAt,
      attachments: thread.attachments.map(serializeAttachment),
      comments: thread.comments.map((c) => ({
        id: c.id,
        body: c.deletedAt ? null : c.body,
        deleted: !!c.deletedAt,
        author: c.deletedAt ? null : c.author,
        parentId: c.parentId,
        createdAt: c.createdAt,
        attachments: c.deletedAt ? [] : c.attachments.map(serializeAttachment),
        isOwn: !!viewer && !c.deletedAt && c.authorId === viewer.id,
      })),
    }
  }

  async createThread(userId: string, dto: CreateThreadDto) {
    const moderation = await this.evaluateContentModeration([dto.title, dto.body])
    const attachments = buildAttachmentCreates(userId, dto.attachments)
    const thread = await this.prisma.discussionThread.create({
      data: {
        title: dto.title,
        body: dto.body,
        category: dto.category,
        authorId: userId,
        needsReviewAt: moderation.needsReview ? new Date() : null,
        attachments: { create: attachments },
      },
      include: { author: { select: { id: true, username: true } } },
    })
    return { id: thread.id, title: thread.title, category: thread.category }
  }

  async createComment(userId: string, threadId: string, dto: CreateCommentDto) {
    const thread = await this.prisma.discussionThread.findUnique({
      where: { id: threadId },
      select: { id: true, hiddenAt: true },
    })
    if (!thread || thread.hiddenAt) throw new NotFoundException('Thread not found')

    if (dto.parentId) {
      const parent = await this.prisma.discussionComment.findFirst({
        where: { id: dto.parentId, threadId },
        select: { id: true, parentId: true, deletedAt: true },
      })
      if (!parent) throw new NotFoundException('Parent comment not found')
      if (parent.parentId) {
        throw new BadRequestException('Replies are one level deep — reply to the top comment')
      }
      if (parent.deletedAt) {
        throw new BadRequestException('Cannot reply to a deleted comment')
      }
    }

    const moderation = await this.evaluateContentModeration([dto.body])
    const attachments = buildAttachmentCreates(userId, dto.attachments)
    const comment = await this.prisma.discussionComment.create({
      data: {
        body: dto.body,
        threadId,
        authorId: userId,
        parentId: dto.parentId ?? null,
        needsReviewAt: moderation.needsReview ? new Date() : null,
        attachments: { create: attachments },
      },
      include: {
        author: { select: { id: true, username: true } },
        attachments: true,
      },
    })
    return {
      id: comment.id,
      body: comment.body,
      deleted: false,
      author: comment.author,
      parentId: comment.parentId,
      createdAt: comment.createdAt,
      attachments: comment.attachments.map(serializeAttachment),
    }
  }

  /**
   * Soft delete — the row stays so reply chains keep their shape; the body,
   * author, and attachments disappear behind a placeholder.
   */
  async deleteComment(user: { id: string; isAdmin?: boolean }, commentId: string) {
    const comment = await this.prisma.discussionComment.findUnique({
      where: { id: commentId },
      select: { id: true, authorId: true, deletedAt: true },
    })
    if (!comment || comment.deletedAt) throw new NotFoundException('Comment not found')
    if (comment.authorId !== user.id && !user.isAdmin) {
      throw new ForbiddenException('Only the author can delete this comment')
    }
    await this.prisma.$transaction([
      this.prisma.attachment.deleteMany({ where: { commentId } }),
      this.prisma.discussionComment.update({
        where: { id: commentId },
        data: { deletedAt: new Date() },
      }),
    ])
    return { ok: true }
  }

  async deleteThread(user: { id: string; isAdmin?: boolean }, threadId: string) {
    const thread = await this.prisma.discussionThread.findUnique({
      where: { id: threadId },
      select: { id: true, authorId: true },
    })
    if (!thread) throw new NotFoundException('Thread not found')
    if (thread.authorId !== user.id && !user.isAdmin) {
      throw new ForbiddenException('Only the author can delete this thread')
    }
    await this.prisma.discussionThread.delete({ where: { id: threadId } })
    return { ok: true }
  }

  private async evaluateContentModeration(parts: string[]) {
    const rules = await this.prisma.forbiddenWord.findMany({
      where: { enabled: true },
      select: { action: true, normalizedPhrase: true, matchType: true },
    })
    const text = parts.join('\n')
    let needsReview = false
    for (const rule of rules) {
      if (!matchesForbiddenWord(text, rule)) continue
      if (rule.action === 'BLOCK') {
        throw new BadRequestException('Your post contains a blocked word or phrase')
      }
      if (rule.action === 'REVIEW') needsReview = true
    }
    return { needsReview }
  }
}
