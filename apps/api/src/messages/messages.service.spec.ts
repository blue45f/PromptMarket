import { ForbiddenException, NotFoundException } from '@nestjs/common'
import { describe, expect, it, vi } from 'vitest'

import { MessagesService } from './messages.service'

type PrismaMock = ConstructorParameters<typeof MessagesService>[0]

interface MockOptions {
  listing?: unknown
  thread?: unknown
  existingThread?: unknown
  threads?: unknown[]
  unreadGroups?: unknown[]
  unreadCount?: number
  createdMessage?: unknown
}

function makePrisma(opts: MockOptions = {}) {
  const prisma = {
    listing: {
      findUnique: vi.fn().mockResolvedValue(opts.listing ?? null),
    },
    messageThread: {
      findMany: vi.fn().mockResolvedValue(opts.threads ?? []),
      findUnique: vi.fn().mockResolvedValue(opts.thread ?? opts.existingThread ?? null),
      create: vi.fn().mockResolvedValue({ id: 'thread-new' }),
      update: vi.fn().mockResolvedValue({}),
    },
    message: {
      groupBy: vi.fn().mockResolvedValue(opts.unreadGroups ?? []),
      count: vi.fn().mockResolvedValue(opts.unreadCount ?? 0),
      create: vi.fn().mockResolvedValue(
        opts.createdMessage ?? {
          id: 'm1',
          body: 'hello',
          senderId: 'u1',
          sender: { id: 'u1', username: 'alex' },
          readAt: null,
          createdAt: new Date(),
        }
      ),
      updateMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    $transaction: vi.fn(async (ops: unknown[]) => Promise.all(ops as Promise<unknown>[])),
  }
  return prisma as unknown as PrismaMock & typeof prisma
}

describe('MessagesService.startThread', () => {
  it('404s for a missing listing', async () => {
    const svc = new MessagesService(makePrisma({ listing: null }))
    await expect(
      svc.startThread('u1', { listingId: 'l1', body: 'hi' } as never)
    ).rejects.toBeInstanceOf(NotFoundException)
  })

  it('rejects messaging yourself about your own listing', async () => {
    const svc = new MessagesService(makePrisma({ listing: { id: 'l1', authorId: 'u1' } }))
    await expect(
      svc.startThread('u1', { listingId: 'l1', body: 'hi' } as never)
    ).rejects.toBeInstanceOf(ForbiddenException)
  })

  it('reuses the existing thread for the same listing + asker', async () => {
    const prisma = makePrisma({
      listing: { id: 'l1', authorId: 'seller-1' },
      existingThread: { id: 'thread-1' },
    })
    const svc = new MessagesService(prisma)
    const out = await svc.startThread('u1', { listingId: 'l1', body: '구매 전 질문' } as never)

    expect(out).toEqual({ id: 'thread-1' })
    expect(prisma.messageThread.create).not.toHaveBeenCalled()
    expect(prisma.message.create).toHaveBeenCalledWith({
      data: { threadId: 'thread-1', senderId: 'u1', body: '구매 전 질문' },
    })
  })

  it('creates a new thread bound to the listing author as seller', async () => {
    const prisma = makePrisma({
      listing: { id: 'l1', authorId: 'seller-1' },
      existingThread: null,
    })
    const svc = new MessagesService(prisma)
    const out = await svc.startThread('u1', { listingId: 'l1', body: 'hi' } as never)

    expect(out).toEqual({ id: 'thread-new' })
    expect(prisma.messageThread.create).toHaveBeenCalledWith({
      data: { listingId: 'l1', buyerId: 'u1', sellerId: 'seller-1' },
      select: { id: true },
    })
  })
})

describe('MessagesService.getThread', () => {
  const thread = {
    id: 'thread-1',
    buyerId: 'buyer-1',
    sellerId: 'seller-1',
    createdAt: new Date(),
    listing: { id: 'l1', slug: 's', title: 'T', coverEmoji: '✨', priceCents: 0 },
    buyer: { id: 'buyer-1', username: 'b' },
    seller: { id: 'seller-1', username: 's' },
    messages: [],
  }

  it('locks out non-participants', async () => {
    const svc = new MessagesService(makePrisma({ thread }))
    await expect(svc.getThread('stranger', 'thread-1')).rejects.toBeInstanceOf(ForbiddenException)
  })

  it('marks the counterparty messages read on open', async () => {
    const prisma = makePrisma({ thread })
    const svc = new MessagesService(prisma)
    const out = await svc.getThread('buyer-1', 'thread-1')

    expect(out.role).toBe('buyer')
    expect(out.counterpart.id).toBe('seller-1')
    expect(prisma.message.updateMany).toHaveBeenCalledWith({
      where: { threadId: 'thread-1', senderId: { not: 'buyer-1' }, readAt: null },
      data: { readAt: expect.any(Date) },
    })
  })
})

describe('MessagesService.listThreads', () => {
  it('summarizes threads with counterpart, role, and unread count', async () => {
    const updatedAt = new Date()
    const prisma = makePrisma({
      threads: [
        {
          id: 'thread-1',
          buyerId: 'me',
          sellerId: 'seller-1',
          updatedAt,
          listing: { id: 'l1', slug: 's', title: 'T', coverEmoji: '✨', priceCents: 500 },
          buyer: { id: 'me', username: 'me' },
          seller: { id: 'seller-1', username: 'maker' },
          messages: [{ id: 'm9', body: 'latest', senderId: 'seller-1', createdAt: updatedAt }],
        },
      ],
      unreadGroups: [{ threadId: 'thread-1', _count: { _all: 2 } }],
    })
    const svc = new MessagesService(prisma)
    const out = await svc.listThreads('me')

    expect(out).toHaveLength(1)
    expect(out[0]).toMatchObject({
      id: 'thread-1',
      role: 'buyer',
      counterpart: { id: 'seller-1', username: 'maker' },
      unreadCount: 2,
      lastMessage: { body: 'latest', senderId: 'seller-1' },
    })
  })
})

describe('MessagesService.sendMessage', () => {
  it('404s on a missing thread', async () => {
    const svc = new MessagesService(makePrisma({ thread: null }))
    await expect(svc.sendMessage('u1', 'thread-1', { body: 'hi' } as never)).rejects.toBeInstanceOf(
      NotFoundException
    )
  })

  it('rejects strangers and bumps updatedAt for participants', async () => {
    const base = { id: 'thread-1', buyerId: 'buyer-1', sellerId: 'seller-1' }
    await expect(
      new MessagesService(makePrisma({ thread: base })).sendMessage('x', 'thread-1', {
        body: 'hi',
      } as never)
    ).rejects.toBeInstanceOf(ForbiddenException)

    const prisma = makePrisma({ thread: base })
    const svc = new MessagesService(prisma)
    const out = await svc.sendMessage('buyer-1', 'thread-1', { body: 'hi' } as never)
    expect(out).toMatchObject({ id: 'm1', body: 'hello' })
    expect(prisma.messageThread.update).toHaveBeenCalledWith({
      where: { id: 'thread-1' },
      data: { updatedAt: expect.any(Date) },
    })
  })
})
