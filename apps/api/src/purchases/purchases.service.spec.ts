import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { PurchasesService } from './purchases.service';

type PrismaMock = ConstructorParameters<typeof PurchasesService>[0];

interface MockOptions {
  listing?: unknown;
  existingPurchase?: unknown;
  buyer?: unknown;
  createdPurchase?: unknown;
}

function makePrisma(opts: MockOptions = {}): PrismaMock {
  const $transaction = vi
    .fn()
    .mockImplementation(async (ops: unknown[]) => {
      const created = opts.createdPurchase ?? null;
      return ops.map((_op, index) => (index === 0 ? created : undefined));
    });

  return {
    listing: {
      findUnique: vi.fn().mockResolvedValue(opts.listing ?? null),
      update: vi.fn(),
    },
    purchase: {
      findUnique: vi.fn().mockResolvedValue(opts.existingPurchase ?? null),
      create: vi.fn(),
    },
    user: {
      findUnique: vi.fn().mockResolvedValue(opts.buyer ?? null),
      update: vi.fn(),
    },
    $transaction,
  } as unknown as PrismaMock;
}

describe('PurchasesService.purchase', () => {
  it('throws NotFoundException when listing does not exist', async () => {
    const svc = new PurchasesService(makePrisma({ listing: null }));
    await expect(svc.purchase('u1', 'l1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('forbids the author from buying their own listing', async () => {
    const svc = new PurchasesService(
      makePrisma({ listing: { id: 'l1', authorId: 'u1', priceCents: 1000 } }),
    );
    await expect(svc.purchase('u1', 'l1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('conflicts on duplicate purchase', async () => {
    const svc = new PurchasesService(
      makePrisma({
        listing: { id: 'l1', authorId: 'author-1', priceCents: 1000 },
        existingPurchase: { id: 'p-prior' },
      }),
    );
    await expect(svc.purchase('u1', 'l1')).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('skips balance + seller credit on a free listing', async () => {
    const createdAt = new Date('2026-05-28T10:00:00Z');
    const prisma = makePrisma({
      listing: {
        id: 'l1',
        authorId: 'author-1',
        priceCents: 0,
        body: 'PROMPT BODY',
      },
      createdPurchase: {
        id: 'p1',
        listingId: 'l1',
        pricePaidCents: 0,
        createdAt,
      },
    });
    const svc = new PurchasesService(prisma);

    const result = await svc.purchase('u1', 'l1');

    expect(result).toEqual({
      purchase: {
        id: 'p1',
        listingId: 'l1',
        pricePaidCents: 0,
        createdAt,
      },
      body: 'PROMPT BODY',
    });
    const tx = (prisma as unknown as { $transaction: ReturnType<typeof vi.fn> }).$transaction;
    expect(tx).toHaveBeenCalledTimes(1);
    expect(tx.mock.calls[0][0]).toHaveLength(2);
    expect(
      (prisma as unknown as { user: { findUnique: ReturnType<typeof vi.fn> } }).user.findUnique,
    ).not.toHaveBeenCalled();
  });

  it('rejects paid purchase when buyer is missing', async () => {
    const svc = new PurchasesService(
      makePrisma({
        listing: { id: 'l1', authorId: 'author-1', priceCents: 1000 },
        buyer: null,
      }),
    );
    await expect(svc.purchase('u1', 'l1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('rejects paid purchase on insufficient balance', async () => {
    const svc = new PurchasesService(
      makePrisma({
        listing: { id: 'l1', authorId: 'author-1', priceCents: 1000 },
        buyer: { id: 'u1', balanceCents: 999 },
      }),
    );
    await expect(svc.purchase('u1', 'l1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('runs a 4-op transaction for paid purchases and credits the seller', async () => {
    const createdAt = new Date('2026-05-28T11:00:00Z');
    const prisma = makePrisma({
      listing: {
        id: 'l1',
        authorId: 'author-1',
        priceCents: 1500,
        body: 'PAID BODY',
      },
      buyer: { id: 'u1', balanceCents: 5000 },
      createdPurchase: {
        id: 'p1',
        listingId: 'l1',
        pricePaidCents: 1500,
        createdAt,
      },
    });
    const svc = new PurchasesService(prisma);

    const result = await svc.purchase('u1', 'l1');

    expect(result).toEqual({
      purchase: {
        id: 'p1',
        listingId: 'l1',
        pricePaidCents: 1500,
        createdAt,
      },
      body: 'PAID BODY',
    });
    const tx = (prisma as unknown as { $transaction: ReturnType<typeof vi.fn> }).$transaction;
    expect(tx).toHaveBeenCalledTimes(1);
    expect(tx.mock.calls[0][0]).toHaveLength(4);
  });
});
