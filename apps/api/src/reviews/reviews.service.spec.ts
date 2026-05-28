import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { ReviewsService } from './reviews.service';

type PrismaMock = ConstructorParameters<typeof ReviewsService>[0];

interface MockOptions {
  listing?: unknown;
  purchase?: unknown;
  existingReview?: unknown;
  createdReview?: unknown;
  reviews?: unknown[];
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
      findMany: vi.fn().mockResolvedValue(opts.reviews ?? []),
      create: vi.fn().mockResolvedValue(opts.createdReview ?? null),
    },
  } as unknown as PrismaMock;
}

describe('ReviewsService.create', () => {
  it.each([
    ['non-integer', 4.5],
    ['below range', 0],
    ['above range', 6],
    ['NaN', Number.NaN],
  ])('rejects rating (%s)', async (_label, rating) => {
    const svc = new ReviewsService(makePrisma());
    await expect(
      svc.create('u1', 'l1', { rating: rating as number }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws NotFoundException when listing does not exist', async () => {
    const svc = new ReviewsService(makePrisma({ listing: null }));
    await expect(
      svc.create('u1', 'l1', { rating: 5 }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('forbids author from reviewing their own listing', async () => {
    const svc = new ReviewsService(
      makePrisma({ listing: { id: 'l1', authorId: 'u1' } }),
    );
    await expect(
      svc.create('u1', 'l1', { rating: 5 }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('forbids review without a prior purchase', async () => {
    const svc = new ReviewsService(
      makePrisma({
        listing: { id: 'l1', authorId: 'author-1' },
        purchase: null,
      }),
    );
    await expect(
      svc.create('u1', 'l1', { rating: 4 }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('conflicts when the user has already reviewed the listing', async () => {
    const svc = new ReviewsService(
      makePrisma({
        listing: { id: 'l1', authorId: 'author-1' },
        purchase: { userId: 'u1', listingId: 'l1' },
        existingReview: { id: 'r-prior' },
      }),
    );
    await expect(
      svc.create('u1', 'l1', { rating: 4 }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('persists a review with comment when guards pass', async () => {
    const createdAt = new Date('2026-05-28T10:00:00Z');
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
      },
    });
    const svc = new ReviewsService(prisma);
    const result = await svc.create('u1', 'l1', {
      rating: 5,
      comment: '훌륭함',
    });

    expect(result).toEqual({
      id: 'r1',
      rating: 5,
      comment: '훌륭함',
      createdAt,
      user: { id: 'u1', username: 'alex' },
    });
    expect((prisma as unknown as { review: { create: ReturnType<typeof vi.fn> } }).review.create).toHaveBeenCalledWith({
      data: {
        userId: 'u1',
        listingId: 'l1',
        rating: 5,
        comment: '훌륭함',
      },
      include: { user: { select: { id: true, username: true } } },
    });
  });

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
      },
    });
    const svc = new ReviewsService(prisma);
    await svc.create('u1', 'l1', { rating: 3 });
    const createSpy = (prisma as unknown as { review: { create: ReturnType<typeof vi.fn> } }).review.create;
    expect(createSpy.mock.calls[0][0].data.comment).toBeNull();
  });
});

describe('ReviewsService.listForListing', () => {
  it('maps prisma rows to the public shape and preserves order', async () => {
    const rows = [
      {
        id: 'r2',
        rating: 4,
        comment: 'good',
        createdAt: new Date('2026-05-02T00:00:00Z'),
        user: { id: 'u2', username: 'beth' },
      },
      {
        id: 'r1',
        rating: 5,
        comment: null,
        createdAt: new Date('2026-05-01T00:00:00Z'),
        user: { id: 'u1', username: 'alex' },
      },
    ];
    const prisma = makePrisma({ reviews: rows });
    const svc = new ReviewsService(prisma);
    const out = await svc.listForListing('l1');
    expect(out).toEqual(rows);
    expect(
      (prisma as unknown as { review: { findMany: ReturnType<typeof vi.fn> } }).review.findMany,
    ).toHaveBeenCalledWith({
      where: { listingId: 'l1' },
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, username: true } } },
    });
  });
});
