import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common'
import { describe, expect, it, vi } from 'vitest'
import { ReviewsService } from './reviews.service'

type PrismaMock = ConstructorParameters<typeof ReviewsService>[0]

interface MockOptions {
  listing?: unknown
  purchase?: unknown
  existingReview?: unknown
  createdReview?: unknown
  createdReply?: unknown
  existingReply?: unknown
  reviews?: unknown[]
}

function makePrisma(opts: MockOptions = {}): PrismaMock {
  return {
    listing: {
      findUnique: vi.fn().mockResolvedValue(opts.listing ?? null),
    },
    purchase: {
      findUnique: vi.fn().mockResolvedValue(opts.purchase ?? null),
    },
    review: {
      findUnique: vi.fn().mockResolvedValue(opts.existingReview ?? null),
      findFirst: vi.fn().mockResolvedValue(opts.existingReview ?? null),
      findMany: vi.fn().mockResolvedValue(opts.reviews ?? []),
      create: vi.fn().mockResolvedValue(opts.createdReview ?? null),
    },
    reviewReply: {
      create: vi.fn().mockResolvedValue(opts.createdReply ?? null),
      findFirst: vi.fn().mockResolvedValue(opts.existingReply ?? null),
      update: vi.fn().mockResolvedValue({}),
    },
  } as unknown as PrismaMock
}

describe('ReviewsService.create', () => {
  it.each([
    ['non-integer', 4.5],
    ['below range', 0],
    ['above range', 6],
    ['NaN', Number.NaN],
  ])('rejects rating (%s)', async (_label, rating) => {
    const svc = new ReviewsService(makePrisma())
    await expect(svc.create('u1', 'l1', { rating: rating as number })).rejects.toBeInstanceOf(
      BadRequestException
    )
  })

  it('throws NotFoundException when listing does not exist', async () => {
    const svc = new ReviewsService(makePrisma({ listing: null }))
    await expect(svc.create('u1', 'l1', { rating: 5 })).rejects.toBeInstanceOf(NotFoundException)
  })

  it('forbids author from reviewing their own listing', async () => {
    const svc = new ReviewsService(makePrisma({ listing: { id: 'l1', authorId: 'u1' } }))
    await expect(svc.create('u1', 'l1', { rating: 5 })).rejects.toBeInstanceOf(ForbiddenException)
  })

  it('forbids review without a prior purchase', async () => {
    const svc = new ReviewsService(
      makePrisma({
        listing: { id: 'l1', authorId: 'author-1' },
        purchase: null,
      })
    )
    await expect(svc.create('u1', 'l1', { rating: 4 })).rejects.toBeInstanceOf(ForbiddenException)
  })

  it('conflicts when the user has already reviewed the listing', async () => {
    const svc = new ReviewsService(
      makePrisma({
        listing: { id: 'l1', authorId: 'author-1' },
        purchase: { userId: 'u1', listingId: 'l1' },
        existingReview: { id: 'r-prior' },
      })
    )
    await expect(svc.create('u1', 'l1', { rating: 4 })).rejects.toBeInstanceOf(ConflictException)
  })

  it('persists a review with comment when guards pass', async () => {
    const createdAt = new Date('2026-05-28T10:00:00Z')
    const prisma = makePrisma({
      listing: { id: 'l1', authorId: 'author-1' },
      purchase: { userId: 'u1', listingId: 'l1' },
      existingReview: null,
      createdReview: {
        id: 'r1',
        rating: 5,
        comment: '훌륭함',
        createdAt,
        user: { id: 'u1', username: 'alex' },
        attachments: [],
      },
    })
    const svc = new ReviewsService(prisma)
    const result = await svc.create('u1', 'l1', {
      rating: 5,
      comment: '훌륭함',
    })

    expect(result).toEqual({
      id: 'r1',
      rating: 5,
      comment: '훌륭함',
      createdAt,
      user: { id: 'u1', username: 'alex' },
      replies: [],
      attachments: [],
    })
    expect(
      (prisma as unknown as { review: { create: ReturnType<typeof vi.fn> } }).review.create
    ).toHaveBeenCalledWith({
      data: {
        userId: 'u1',
        listingId: 'l1',
        rating: 5,
        comment: '훌륭함',
        attachments: { create: [] },
      },
      include: {
        user: { select: { id: true, username: true } },
        attachments: true,
      },
    })
  })

  it('persists screenshot attachments alongside the review', async () => {
    const dataUrl = `data:image/png;base64,${'QUJD'.repeat(16)}`
    const prisma = makePrisma({
      listing: { id: 'l1', authorId: 'author-1' },
      purchase: { userId: 'u1', listingId: 'l1' },
      createdReview: {
        id: 'r1',
        rating: 5,
        comment: null,
        createdAt: new Date(),
        user: { id: 'u1', username: 'alex' },
        attachments: [{ id: 'a1', dataUrl, width: 1600, height: 900 }],
      },
    })
    const svc = new ReviewsService(prisma)
    const result = await svc.create('u1', 'l1', {
      rating: 5,
      attachments: [{ dataUrl, width: 1600, height: 900 }],
    })

    expect(result.attachments).toEqual([{ id: 'a1', dataUrl, width: 1600, height: 900 }])
    const createSpy = (prisma as unknown as { review: { create: ReturnType<typeof vi.fn> } }).review
      .create
    const created = createSpy.mock.calls[0][0].data.attachments.create
    expect(created).toHaveLength(1)
    expect(created[0]).toMatchObject({ dataUrl, width: 1600, height: 900, uploaderId: 'u1' })
    expect(created[0].byteSize).toBeGreaterThan(0)
  })

  it('rejects attachments that are not image data URLs', async () => {
    const svc = new ReviewsService(
      makePrisma({
        listing: { id: 'l1', authorId: 'author-1' },
        purchase: { userId: 'u1', listingId: 'l1' },
      })
    )
    await expect(
      svc.create('u1', 'l1', {
        rating: 5,
        attachments: [{ dataUrl: `data:text/html;base64,${'QUJD'.repeat(16)}` }],
      })
    ).rejects.toBeInstanceOf(BadRequestException)
  })

  it('coerces missing comment to null', async () => {
    const prisma = makePrisma({
      listing: { id: 'l1', authorId: 'author-1' },
      purchase: { userId: 'u1', listingId: 'l1' },
      createdReview: {
        id: 'r1',
        rating: 3,
        comment: null,
        createdAt: new Date(),
        user: { id: 'u1', username: 'alex' },
        attachments: [],
      },
    })
    const svc = new ReviewsService(prisma)
    await svc.create('u1', 'l1', { rating: 3 })
    const createSpy = (prisma as unknown as { review: { create: ReturnType<typeof vi.fn> } }).review
      .create
    expect(createSpy.mock.calls[0][0].data.comment).toBeNull()
  })
})

describe('ReviewsService.listForListing', () => {
  it('maps prisma rows to the public shape, masking deleted replies', async () => {
    const rows = [
      {
        id: 'r2',
        rating: 4,
        comment: 'good',
        createdAt: new Date('2026-05-02T00:00:00Z'),
        user: { id: 'u2', username: 'beth' },
        attachments: [{ id: 'a1', dataUrl: 'data:image/png;base64,QUJD', width: 10, height: 10 }],
        replies: [
          {
            id: 'reply-1',
            body: '동의해요. 설치도 쉬웠습니다.',
            deletedAt: null,
            createdAt: new Date('2026-05-03T00:00:00Z'),
            user: { id: 'u3', username: 'chris' },
          },
          {
            id: 'reply-2',
            body: '숨겨질 본문',
            deletedAt: new Date('2026-05-04T00:00:00Z'),
            createdAt: new Date('2026-05-03T01:00:00Z'),
            user: { id: 'u4', username: 'dana' },
          },
        ],
      },
    ]
    const prisma = makePrisma({ reviews: rows })
    const svc = new ReviewsService(prisma)
    const out = await svc.listForListing('l1')

    expect(out[0].attachments).toEqual([
      { id: 'a1', dataUrl: 'data:image/png;base64,QUJD', width: 10, height: 10 },
    ])
    expect(out[0].replies[0]).toMatchObject({ id: 'reply-1', deleted: false })
    // Soft-deleted reply keeps its slot but exposes no body.
    expect(out[0].replies[1]).toMatchObject({ id: 'reply-2', deleted: true, body: null })
    expect(
      (prisma as unknown as { review: { findMany: ReturnType<typeof vi.fn> } }).review.findMany
    ).toHaveBeenCalledWith({
      where: { listingId: 'l1', hiddenAt: null },
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
  })
})

describe('ReviewsService.createReply', () => {
  it('rejects a blank reply body', async () => {
    const svc = new ReviewsService(makePrisma())
    await expect(
      svc.createReply('u1', 'listing-1', 'review-1', { body: '   ' })
    ).rejects.toBeInstanceOf(BadRequestException)
  })

  it('throws ForbiddenException when caller is neither author nor buyer', async () => {
    const svc = new ReviewsService(
      makePrisma({
        listing: { id: 'listing-1', authorId: 'other-user' },
        purchase: null,
        existingReview: { id: 'review-1', listingId: 'listing-1' },
      })
    )
    await expect(
      svc.createReply('u1', 'listing-1', 'review-1', { body: '좋은 리뷰네요' })
    ).rejects.toBeInstanceOf(ForbiddenException)
  })

  it('throws NotFoundException when the parent review does not exist', async () => {
    const svc = new ReviewsService(
      makePrisma({
        listing: { id: 'listing-1', authorId: 'u1' }, // caller is author → no purchase check
        existingReview: null,
      })
    )
    await expect(
      svc.createReply('u1', 'listing-1', 'review-1', { body: '좋은 리뷰네요' })
    ).rejects.toBeInstanceOf(NotFoundException)
  })

  it('persists a reply for an existing review and returns the public shape', async () => {
    const createdAt = new Date('2026-06-01T10:00:00Z')
    const prisma = makePrisma({
      listing: { id: 'listing-1', authorId: 'other-user' }, // caller is NOT author
      purchase: { id: 'p1', userId: 'u1', listingId: 'listing-1' }, // but is a buyer
      existingReview: { id: 'review-1', listingId: 'listing-1' },
      createdReply: {
        id: 'reply-1',
        body: '설치 팁까지 알려주셔서 고마워요.',
        createdAt,
        user: { id: 'u1', username: 'alex' },
      },
    })
    const svc = new ReviewsService(prisma)

    const result = await svc.createReply('u1', 'listing-1', 'review-1', {
      body: '  설치 팁까지 알려주셔서 고마워요.  ',
    })

    expect(result).toEqual({
      id: 'reply-1',
      body: '설치 팁까지 알려주셔서 고마워요.',
      deleted: false,
      createdAt,
      user: { id: 'u1', username: 'alex' },
    })
    expect(
      (prisma as unknown as { review: { findFirst: ReturnType<typeof vi.fn> } }).review.findFirst
    ).toHaveBeenCalledWith({
      where: { id: 'review-1', listingId: 'listing-1', hiddenAt: null },
      select: { id: true },
    })
    expect(
      (prisma as unknown as { reviewReply: { create: ReturnType<typeof vi.fn> } }).reviewReply
        .create
    ).toHaveBeenCalledWith({
      data: {
        reviewId: 'review-1',
        userId: 'u1',
        body: '설치 팁까지 알려주셔서 고마워요.',
      },
      include: { user: { select: { id: true, username: true } } },
    })
  })
})

describe('ReviewsService.deleteReply', () => {
  it('404s when the reply does not exist or is already deleted', async () => {
    const svc = new ReviewsService(makePrisma({ existingReply: null }))
    await expect(
      svc.deleteReply({ id: 'u1' }, 'listing-1', 'review-1', 'reply-1')
    ).rejects.toBeInstanceOf(NotFoundException)
  })

  it('forbids deleting someone else’s reply for non-admins', async () => {
    const svc = new ReviewsService(
      makePrisma({ existingReply: { id: 'reply-1', userId: 'someone-else', deletedAt: null } })
    )
    await expect(
      svc.deleteReply({ id: 'u1' }, 'listing-1', 'review-1', 'reply-1')
    ).rejects.toBeInstanceOf(ForbiddenException)
  })

  it('soft-deletes own reply by stamping deletedAt', async () => {
    const prisma = makePrisma({
      existingReply: { id: 'reply-1', userId: 'u1', deletedAt: null },
    })
    const svc = new ReviewsService(prisma)
    const out = await svc.deleteReply({ id: 'u1' }, 'listing-1', 'review-1', 'reply-1')
    expect(out).toEqual({ ok: true })
    const updateSpy = (prisma as unknown as { reviewReply: { update: ReturnType<typeof vi.fn> } })
      .reviewReply.update
    expect(updateSpy).toHaveBeenCalledWith({
      where: { id: 'reply-1' },
      data: { deletedAt: expect.any(Date) },
    })
  })

  it('lets admins remove any reply', async () => {
    const prisma = makePrisma({
      existingReply: { id: 'reply-1', userId: 'someone-else', deletedAt: null },
    })
    const svc = new ReviewsService(prisma)
    await expect(
      svc.deleteReply({ id: 'admin-1', isAdmin: true }, 'listing-1', 'review-1', 'reply-1')
    ).resolves.toEqual({ ok: true })
  })
})
