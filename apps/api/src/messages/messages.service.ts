import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { Prisma } from '@prisma/client'

import { PrismaService } from '../prisma/prisma.service'

import type { SendMessageDto } from './dto/send-message.dto'
import type { StartThreadDto } from './dto/start-thread.dto'

type ThreadWithParties = {
  id: string
  buyerId: string
  sellerId: string
}

@Injectable()
export class MessagesService {
  constructor(private readonly prisma: PrismaService) {}

  private assertParticipant(thread: ThreadWithParties, userId: string) {
    if (thread.buyerId !== userId && thread.sellerId !== userId) {
      throw new ForbiddenException('Not a participant of this thread')
    }
  }

  /** Inbox — every thread the user participates in, newest activity first. */
  async listThreads(userId: string) {
    const threads = await this.prisma.messageThread.findMany({
      where: { OR: [{ buyerId: userId }, { sellerId: userId }] },
      orderBy: { updatedAt: 'desc' },
      include: {
        listing: {
          select: { id: true, slug: true, title: true, coverEmoji: true, priceCents: true },
        },
        buyer: { select: { id: true, username: true } },
        seller: { select: { id: true, username: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    })

    // One grouped count for all unread incoming messages beats N queries.
    const unreadGroups = await this.prisma.message.groupBy({
      by: ['threadId'],
      where: {
        thread: { OR: [{ buyerId: userId }, { sellerId: userId }] },
        senderId: { not: userId },
        readAt: null,
      },
      _count: { _all: true },
    })
    const unreadByThread = new Map(unreadGroups.map((g) => [g.threadId, g._count._all]))

    return threads.map((t) => {
      const isBuyer = t.buyerId === userId
      const last = t.messages[0] ?? null
      return {
        id: t.id,
        listing: t.listing,
        counterpart: isBuyer ? t.seller : t.buyer,
        role: isBuyer ? ('buyer' as const) : ('seller' as const),
        lastMessage: last
          ? { body: last.body, senderId: last.senderId, createdAt: last.createdAt }
          : null,
        unreadCount: unreadByThread.get(t.id) ?? 0,
        updatedAt: t.updatedAt,
      }
    })
  }

  /** Total unread across the inbox — feeds the nav badge. */
  async unreadCount(userId: string) {
    const count = await this.prisma.message.count({
      where: {
        thread: { OR: [{ buyerId: userId }, { sellerId: userId }] },
        senderId: { not: userId },
        readAt: null,
      },
    })
    return { count }
  }

  /**
   * Start (or reuse) the thread between the asker and the listing's seller.
   * One thread per listing+asker pair; a fresh question lands in the existing
   * thread, mirroring how storefront Q&A actually flows.
   */
  async startThread(userId: string, dto: StartThreadDto) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: dto.listingId },
      select: { id: true, authorId: true },
    })
    if (!listing) throw new NotFoundException('Listing not found')
    if (listing.authorId === userId) {
      throw new ForbiddenException('You cannot message yourself about your own listing')
    }

    const existing = await this.prisma.messageThread.findUnique({
      where: { listingId_buyerId: { listingId: listing.id, buyerId: userId } },
      select: { id: true },
    })

    let threadId: string
    if (existing) {
      threadId = existing.id
    } else {
      try {
        threadId = (
          await this.prisma.messageThread.create({
            data: { listingId: listing.id, buyerId: userId, sellerId: listing.authorId },
            select: { id: true },
          })
        ).id
      } catch (e) {
        // 같은 구매자가 동시에 첫 질문을 두 번 보내면 unique 제약과 경합한다 — 승자 스레드를 재사용.
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
          const winner = await this.prisma.messageThread.findUnique({
            where: { listingId_buyerId: { listingId: listing.id, buyerId: userId } },
            select: { id: true },
          })
          if (!winner) throw e
          threadId = winner.id
        } else {
          throw e
        }
      }
    }

    await this.prisma.$transaction([
      this.prisma.message.create({
        data: { threadId, senderId: userId, body: dto.body },
      }),
      this.prisma.messageThread.update({
        where: { id: threadId },
        data: { updatedAt: new Date() },
      }),
    ])

    return { id: threadId }
  }

  /** Thread detail — marks the counterparty's messages as read. */
  async getThread(userId: string, threadId: string) {
    const thread = await this.prisma.messageThread.findUnique({
      where: { id: threadId },
      include: {
        listing: {
          select: { id: true, slug: true, title: true, coverEmoji: true, priceCents: true },
        },
        buyer: { select: { id: true, username: true } },
        seller: { select: { id: true, username: true } },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: { sender: { select: { id: true, username: true } } },
        },
      },
    })
    if (!thread) throw new NotFoundException('Thread not found')
    this.assertParticipant(thread, userId)

    await this.prisma.message.updateMany({
      where: { threadId, senderId: { not: userId }, readAt: null },
      data: { readAt: new Date() },
    })

    const isBuyer = thread.buyerId === userId
    return {
      id: thread.id,
      listing: thread.listing,
      counterpart: isBuyer ? thread.seller : thread.buyer,
      role: isBuyer ? ('buyer' as const) : ('seller' as const),
      createdAt: thread.createdAt,
      messages: thread.messages.map((m) => ({
        id: m.id,
        body: m.body,
        senderId: m.senderId,
        sender: m.sender,
        readAt: m.readAt,
        createdAt: m.createdAt,
      })),
    }
  }

  async sendMessage(userId: string, threadId: string, dto: SendMessageDto) {
    const thread = await this.prisma.messageThread.findUnique({
      where: { id: threadId },
      select: { id: true, buyerId: true, sellerId: true },
    })
    if (!thread) throw new NotFoundException('Thread not found')
    this.assertParticipant(thread, userId)

    const [message] = await this.prisma.$transaction([
      this.prisma.message.create({
        data: { threadId, senderId: userId, body: dto.body },
        include: { sender: { select: { id: true, username: true } } },
      }),
      this.prisma.messageThread.update({
        where: { id: threadId },
        data: { updatedAt: new Date() },
      }),
    ])
    return {
      id: message.id,
      body: message.body,
      senderId: message.senderId,
      sender: message.sender,
      readAt: message.readAt,
      createdAt: message.createdAt,
    }
  }
}
