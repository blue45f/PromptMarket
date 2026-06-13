import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common'
import { describe, expect, it, vi } from 'vitest'

import { CommunityService } from './community.service'

type PrismaMock = ConstructorParameters<typeof CommunityService>[0]

interface MockOptions {
  threads?: unknown[]
  threadCount?: number
  categoryGroups?: unknown[]
  thread?: unknown
  comment?: unknown
  createdThread?: unknown
  createdComment?: unknown
  forbiddenWords?: unknown[]
}

function makePrisma(opts: MockOptions = {}) {
  const prisma = {
    discussionThread: {
      count: vi.fn().mockResolvedValue(opts.threadCount ?? 0),
      findMany: vi.fn().mockResolvedValue(opts.threads ?? []),
      groupBy: vi.fn().mockResolvedValue(opts.categoryGroups ?? []),
      findUnique: vi.fn().mockResolvedValue(opts.thread ?? null),
      create: vi.fn().mockResolvedValue(opts.createdThread ?? null),
      delete: vi.fn().mockResolvedValue({}),
    },
    discussionComment: {
      findFirst: vi.fn().mockResolvedValue(opts.comment ?? null),
      findUnique: vi.fn().mockResolvedValue(opts.comment ?? null),
      create: vi.fn().mockResolvedValue(opts.createdComment ?? null),
      update: vi.fn().mockResolvedValue({}),
    },
    attachment: {
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    forbiddenWord: {
      findMany: vi.fn().mockResolvedValue(opts.forbiddenWords ?? []),
    },
    $transaction: vi.fn(async (ops: unknown[]) => Promise.all(ops as Promise<unknown>[])),
  }
  return prisma as unknown as PrismaMock & typeof prisma
}

describe('CommunityService.listThreads', () => {
  it('only queries non-hidden threads and seeds every category count', async () => {
    const prisma = makePrisma({
      threads: [],
      threadCount: 0,
      categoryGroups: [{ category: 'Coding', _count: { _all: 4 } }],
    })
    const svc = new CommunityService(prisma)
    const out = await svc.listThreads({ page: 1, pageSize: 20 } as never)

    expect(out.categoryCounts.Coding).toBe(4)
    expect(out.categoryCounts.Writing).toBe(0)
    expect(prisma.discussionThread.count).toHaveBeenCalledWith({
      where: { hiddenAt: null },
    })
  })

  it('derives lastActivityAt from the newest comment and builds excerpts', async () => {
    const created = new Date('2026-06-01T00:00:00Z')
    const lastComment = new Date('2026-06-05T00:00:00Z')
    const prisma = makePrisma({
      threadCount: 1,
      threads: [
        {
          id: 't1',
          title: 'CoT 프롬프트 공유',
          category: 'Coding',
          body: `${'아주 긴 본문 '.repeat(40)}`,
          author: { id: 'u1', username: 'alex' },
          comments: [{ createdAt: lastComment }],
          _count: { comments: 3, attachments: 1 },
          createdAt: created,
        },
      ],
    })
    const svc = new CommunityService(prisma)
    const out = await svc.listThreads({ page: 1, pageSize: 20 } as never)

    expect(out.items[0].lastActivityAt).toBe(lastComment)
    expect(out.items[0].excerpt.length).toBeLessThanOrEqual(180)
    expect(out.items[0].commentCount).toBe(3)
  })
})

describe('CommunityService.getThread', () => {
  const baseThread = {
    id: 't1',
    title: 'T',
    body: 'B',
    category: 'Coding',
    authorId: 'u1',
    author: { id: 'u1', username: 'alex' },
    hiddenAt: null as Date | null,
    createdAt: new Date(),
    updatedAt: new Date(),
    attachments: [],
    comments: [
      {
        id: 'c1',
        body: 'visible',
        deletedAt: null,
        author: { id: 'u2', username: 'beth' },
        authorId: 'u2',
        parentId: null,
        createdAt: new Date(),
        attachments: [],
      },
      {
        id: 'c2',
        body: 'secret',
        deletedAt: new Date(),
        author: { id: 'u3', username: 'cara' },
        authorId: 'u3',
        parentId: 'c1',
        createdAt: new Date(),
        attachments: [{ id: 'a9', dataUrl: 'data:image/png;base64,QUJD', width: 1, height: 1 }],
      },
    ],
  }

  it('masks soft-deleted comments (no body, author, or attachments)', async () => {
    const prisma = makePrisma({ thread: baseThread })
    const svc = new CommunityService(prisma)
    const out = await svc.getThread('t1', null)

    const deleted = out.comments.find((c) => c.id === 'c2')
    expect(deleted).toMatchObject({ deleted: true, body: null, author: null, attachments: [] })
  })

  it('404s hidden threads for regular members but serves admins', async () => {
    const hidden = { ...baseThread, hiddenAt: new Date() }
    const svc = new CommunityService(makePrisma({ thread: hidden }))
    await expect(svc.getThread('t1', { id: 'u9' })).rejects.toBeInstanceOf(NotFoundException)

    const adminSvc = new CommunityService(makePrisma({ thread: hidden }))
    const out = await adminSvc.getThread('t1', { id: 'admin', isAdmin: true })
    expect(out.hidden).toBe(true)
  })
})

describe('CommunityService.createComment', () => {
  it('blocks comments that match an enabled block rule', async () => {
    const prisma = makePrisma({
      thread: { id: 't1', hiddenAt: null },
      forbiddenWords: [{ action: 'BLOCK', normalizedPhrase: 'spoiler', matchType: 'WHOLE_WORD' }],
    })
    const svc = new CommunityService(prisma)

    await expect(
      svc.createComment('u1', 't1', { body: 'That is a spoiler.', attachments: [] } as never)
    ).rejects.toBeInstanceOf(BadRequestException)
    expect(prisma.discussionComment.create).not.toHaveBeenCalled()
  })

  it('404s when the thread is hidden', async () => {
    const svc = new CommunityService(makePrisma({ thread: { id: 't1', hiddenAt: new Date() } }))
    await expect(
      svc.createComment('u1', 't1', { body: 'hi', attachments: [] } as never)
    ).rejects.toBeInstanceOf(NotFoundException)
  })

  it('rejects replies to replies (one level only)', async () => {
    const svc = new CommunityService(
      makePrisma({
        thread: { id: 't1', hiddenAt: null },
        comment: { id: 'c2', parentId: 'c1', deletedAt: null },
      })
    )
    await expect(
      svc.createComment('u1', 't1', { body: 'hi', parentId: 'c2', attachments: [] } as never)
    ).rejects.toBeInstanceOf(BadRequestException)
  })

  it('rejects replies to deleted comments', async () => {
    const svc = new CommunityService(
      makePrisma({
        thread: { id: 't1', hiddenAt: null },
        comment: { id: 'c1', parentId: null, deletedAt: new Date() },
      })
    )
    await expect(
      svc.createComment('u1', 't1', { body: 'hi', parentId: 'c1', attachments: [] } as never)
    ).rejects.toBeInstanceOf(BadRequestException)
  })

  it('creates a top-level comment with the public shape', async () => {
    const createdAt = new Date()
    const prisma = makePrisma({
      thread: { id: 't1', hiddenAt: null },
      createdComment: {
        id: 'c1',
        body: '좋은 팁이네요',
        parentId: null,
        createdAt,
        author: { id: 'u1', username: 'alex' },
        attachments: [],
      },
    })
    const svc = new CommunityService(prisma)
    const out = await svc.createComment('u1', 't1', {
      body: '좋은 팁이네요',
      attachments: [],
    } as never)

    expect(out).toMatchObject({ id: 'c1', deleted: false, parentId: null })
    expect(prisma.forbiddenWord.findMany).toHaveBeenCalledWith({
      where: { enabled: true },
      select: { action: true, normalizedPhrase: true, matchType: true },
    })
    expect(prisma.discussionComment.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ needsReviewAt: null }),
      include: expect.any(Object),
    })
  })
})

describe('CommunityService.createThread', () => {
  it('blocks threads that match an enabled block rule', async () => {
    const prisma = makePrisma({
      forbiddenWords: [{ action: 'BLOCK', normalizedPhrase: 'leak', matchType: 'CONTAINS' }],
    })
    const svc = new CommunityService(prisma)

    await expect(
      svc.createThread('u1', {
        title: 'Prompt draft',
        body: 'Contains leaked credentials',
        category: 'Coding',
        attachments: [],
      } as never)
    ).rejects.toBeInstanceOf(BadRequestException)
    expect(prisma.discussionThread.create).not.toHaveBeenCalled()
  })

  it('marks threads that match an enabled review rule', async () => {
    const prisma = makePrisma({
      forbiddenWords: [{ action: 'REVIEW', normalizedPhrase: 'spoiler', matchType: 'WHOLE_WORD' }],
      createdThread: { id: 't2', title: 'Prompt draft', category: 'Coding' },
    })
    const svc = new CommunityService(prisma)

    await expect(
      svc.createThread('u1', {
        title: 'Spoiler discussion',
        body: 'Long enough body',
        category: 'Coding',
        attachments: [],
      } as never)
    ).resolves.toEqual({ id: 't2', title: 'Prompt draft', category: 'Coding' })
    expect(prisma.discussionThread.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ needsReviewAt: expect.any(Date) }),
      include: expect.any(Object),
    })
  })
})

describe('CommunityService.deleteComment', () => {
  it('forbids non-authors', async () => {
    const svc = new CommunityService(
      makePrisma({ comment: { id: 'c1', authorId: 'someone', deletedAt: null } })
    )
    await expect(svc.deleteComment({ id: 'u1' }, 'c1')).rejects.toBeInstanceOf(ForbiddenException)
  })

  it('soft-deletes and strips attachments in one transaction', async () => {
    const prisma = makePrisma({ comment: { id: 'c1', authorId: 'u1', deletedAt: null } })
    const svc = new CommunityService(prisma)
    await expect(svc.deleteComment({ id: 'u1' }, 'c1')).resolves.toEqual({ ok: true })
    expect(prisma.attachment.deleteMany).toHaveBeenCalledWith({ where: { commentId: 'c1' } })
    expect(prisma.discussionComment.update).toHaveBeenCalledWith({
      where: { id: 'c1' },
      data: { deletedAt: expect.any(Date) },
    })
  })

  it('404s comments that are already deleted', async () => {
    const svc = new CommunityService(
      makePrisma({ comment: { id: 'c1', authorId: 'u1', deletedAt: new Date() } })
    )
    await expect(svc.deleteComment({ id: 'u1' }, 'c1')).rejects.toBeInstanceOf(NotFoundException)
  })
})

describe('CommunityService.deleteThread', () => {
  it('lets admins delete any thread', async () => {
    const prisma = makePrisma({ thread: { id: 't1', authorId: 'someone' } })
    const svc = new CommunityService(prisma)
    await expect(svc.deleteThread({ id: 'admin', isAdmin: true }, 't1')).resolves.toEqual({
      ok: true,
    })
    expect(prisma.discussionThread.delete).toHaveBeenCalledWith({ where: { id: 't1' } })
  })

  it('forbids strangers', async () => {
    const svc = new CommunityService(makePrisma({ thread: { id: 't1', authorId: 'someone' } }))
    await expect(svc.deleteThread({ id: 'u1' }, 't1')).rejects.toBeInstanceOf(ForbiddenException)
  })
})
