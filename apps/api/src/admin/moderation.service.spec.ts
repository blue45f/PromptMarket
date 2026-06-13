import { BadRequestException, NotFoundException } from '@nestjs/common'
import { describe, expect, it, vi } from 'vitest'
import { ModerationService } from './moderation.service'

type PrismaMock = ConstructorParameters<typeof ModerationService>[0]

interface MockOptions {
  threads?: unknown[]
  thread?: unknown
  reviews?: unknown[]
  review?: unknown
  attachment?: unknown
  users?: unknown[]
  user?: unknown
  forbiddenWords?: unknown[]
  forbiddenWord?: unknown
}

function makePrisma(opts: MockOptions = {}) {
  const prisma = {
    discussionThread: {
      findMany: vi.fn().mockResolvedValue(opts.threads ?? []),
      findUnique: vi.fn().mockResolvedValue(opts.thread ?? null),
      update: vi.fn().mockImplementation(async ({ data }: { data: { hiddenAt: Date | null } }) => ({
        id: 't1',
        hiddenAt: data.hiddenAt,
      })),
      delete: vi.fn().mockResolvedValue({}),
    },
    review: {
      findMany: vi.fn().mockResolvedValue(opts.reviews ?? []),
      findUnique: vi.fn().mockResolvedValue(opts.review ?? null),
      update: vi.fn().mockImplementation(async ({ data }: { data: { hiddenAt: Date | null } }) => ({
        id: 'r1',
        hiddenAt: data.hiddenAt,
      })),
      delete: vi.fn().mockResolvedValue({}),
    },
    reviewReply: {
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    attachment: {
      findUnique: vi.fn().mockResolvedValue(opts.attachment ?? null),
      delete: vi.fn().mockResolvedValue({}),
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    forbiddenWord: {
      findMany: vi.fn().mockResolvedValue(opts.forbiddenWords ?? []),
      findUnique: vi.fn().mockResolvedValue(opts.forbiddenWord ?? null),
      create: vi.fn().mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
        id: 'fw1',
        createdAt: new Date('2026-06-01T00:00:00Z'),
        updatedAt: new Date('2026-06-01T00:00:00Z'),
        ...data,
      })),
      update: vi.fn().mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
        id: 'fw1',
        phrase: 'old',
        normalizedPhrase: 'old',
        action: 'BLOCK',
        matchType: 'WHOLE_WORD',
        enabled: true,
        note: null,
        createdAt: new Date('2026-06-01T00:00:00Z'),
        updatedAt: new Date('2026-06-02T00:00:00Z'),
        ...data,
      })),
      delete: vi.fn().mockResolvedValue({}),
    },
    user: {
      findMany: vi.fn().mockResolvedValue(opts.users ?? []),
      findUnique: vi.fn().mockResolvedValue(opts.user ?? null),
      update: vi
        .fn()
        .mockImplementation(async ({ data }: { data: { suspendedAt: Date | null } }) => ({
          id: 'u2',
          suspendedAt: data.suspendedAt,
        })),
    },
    $transaction: vi.fn(async (ops: unknown[]) => Promise.all(ops as Promise<unknown>[])),
  }
  return prisma as unknown as PrismaMock & typeof prisma
}

describe('ModerationService visibility toggles', () => {
  it('hides and unhides a thread', async () => {
    const prisma = makePrisma({ thread: { id: 't1' } })
    const svc = new ModerationService(prisma)

    const hidden = await svc.setThreadVisibility('t1', true)
    expect(hidden.hiddenAt).toBeInstanceOf(Date)

    const restored = await svc.setThreadVisibility('t1', false)
    expect(restored.hiddenAt).toBeNull()
  })

  it('404s on a missing review', async () => {
    const svc = new ModerationService(makePrisma({ review: null }))
    await expect(svc.setReviewVisibility('nope', true)).rejects.toBeInstanceOf(NotFoundException)
  })
})

describe('ModerationService.deleteReview', () => {
  it('removes attachments and replies together with the review', async () => {
    const prisma = makePrisma({ review: { id: 'r1' } })
    const svc = new ModerationService(prisma)
    await expect(svc.deleteReview('r1')).resolves.toEqual({ ok: true })
    expect(prisma.attachment.deleteMany).toHaveBeenCalledWith({ where: { reviewId: 'r1' } })
    expect(prisma.reviewReply.deleteMany).toHaveBeenCalledWith({ where: { reviewId: 'r1' } })
    expect(prisma.review.delete).toHaveBeenCalledWith({ where: { id: 'r1' } })
  })
})

describe('ModerationService.deleteAttachment', () => {
  it('404s when missing, deletes when found', async () => {
    await expect(
      new ModerationService(makePrisma({ attachment: null })).deleteAttachment('a1')
    ).rejects.toBeInstanceOf(NotFoundException)

    const prisma = makePrisma({ attachment: { id: 'a1' } })
    await expect(new ModerationService(prisma).deleteAttachment('a1')).resolves.toEqual({
      ok: true,
    })
    expect(prisma.attachment.delete).toHaveBeenCalledWith({ where: { id: 'a1' } })
  })
})

describe('ModerationService forbidden words', () => {
  it('lists rules with enabled filtering and normalized search', async () => {
    const createdAt = new Date('2026-06-01T00:00:00Z')
    const updatedAt = new Date('2026-06-02T00:00:00Z')
    const prisma = makePrisma({
      forbiddenWords: [
        {
          id: 'fw1',
          phrase: 'Bad Word',
          normalizedPhrase: 'bad word',
          action: 'BLOCK',
          matchType: 'WHOLE_WORD',
          enabled: true,
          note: null,
          createdAt,
          updatedAt,
        },
      ],
    })
    const out = await new ModerationService(prisma).listForbiddenWords(false, ' BAD   WORD ')

    expect(out[0]).toMatchObject({ id: 'fw1', phrase: 'Bad Word', action: 'BLOCK' })
    expect(prisma.forbiddenWord.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { enabled: true, normalizedPhrase: { contains: 'bad word' } },
      })
    )
  })

  it('normalizes created phrases and trims empty notes to null', async () => {
    const prisma = makePrisma()
    const out = await new ModerationService(prisma).createForbiddenWord({
      phrase: '  Bad   Word  ',
      action: 'BLOCK',
      matchType: 'WHOLE_WORD',
      enabled: true,
      note: '   ',
    })

    expect(out.phrase).toBe('Bad   Word')
    expect(prisma.forbiddenWord.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        phrase: 'Bad   Word',
        normalizedPhrase: 'bad word',
        note: null,
      }),
    })
  })

  it('404s when deleting a missing rule', async () => {
    const svc = new ModerationService(makePrisma({ forbiddenWord: null }))
    await expect(svc.deleteForbiddenWord('missing')).rejects.toBeInstanceOf(NotFoundException)
  })
})

describe('ModerationService.setMemberSuspension', () => {
  it('blocks self-suspension', async () => {
    const svc = new ModerationService(makePrisma())
    await expect(svc.setMemberSuspension('admin-1', 'admin-1', true)).rejects.toBeInstanceOf(
      BadRequestException
    )
  })

  it('refuses to suspend another admin', async () => {
    const svc = new ModerationService(makePrisma({ user: { id: 'u2', isAdmin: true } }))
    await expect(svc.setMemberSuspension('admin-1', 'u2', true)).rejects.toBeInstanceOf(
      BadRequestException
    )
  })

  it('suspends and reinstates a regular member', async () => {
    const prisma = makePrisma({ user: { id: 'u2', isAdmin: false } })
    const svc = new ModerationService(prisma)

    const suspended = await svc.setMemberSuspension('admin-1', 'u2', true)
    expect(suspended.suspendedAt).toBeInstanceOf(Date)

    const restored = await svc.setMemberSuspension('admin-1', 'u2', false)
    expect(restored.suspendedAt).toBeNull()
  })
})

describe('ModerationService.listMembers', () => {
  it('maps activity counts into flat rows', async () => {
    const createdAt = new Date()
    const prisma = makePrisma({
      users: [
        {
          id: 'u1',
          username: 'alex',
          email: 'a@x.io',
          isAdmin: false,
          suspendedAt: null,
          createdAt,
          _count: { listings: 2, reviews: 3, discussionThreads: 1 },
        },
      ],
    })
    const svc = new ModerationService(prisma)
    const out = await svc.listMembers('al')
    expect(out[0]).toMatchObject({
      username: 'alex',
      listingCount: 2,
      reviewCount: 3,
      threadCount: 1,
    })
    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { OR: [{ username: { contains: 'al' } }, { email: { contains: 'al' } }] },
      })
    )
  })
})
