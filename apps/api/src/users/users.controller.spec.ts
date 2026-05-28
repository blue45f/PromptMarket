import { describe, expect, it, vi } from 'vitest';
import { UsersController } from './users.controller';
import type { AuthUser } from '../auth/current-user.decorator';

function makeController(overrides: Record<string, unknown> = {}) {
  const service = {
    getPublicProfile: vi.fn().mockResolvedValue({ id: 'u1' }),
    getMe: vi.fn().mockResolvedValue({ id: 'u1' }),
    topUp: vi.fn().mockResolvedValue({ balanceCents: 100 }),
    myPurchases: vi.fn().mockResolvedValue([]),
    myListings: vi.fn().mockResolvedValue([]),
    ...overrides,
  };
  return { controller: new UsersController(service as never), service };
}

describe('UsersController', () => {
  it('getProfile forwards the username', async () => {
    const { controller, service } = makeController();
    await controller.getProfile('alex');
    expect(service.getPublicProfile).toHaveBeenCalledWith('alex');
  });

  it('me forwards the authenticated user id', async () => {
    const { controller, service } = makeController();
    await controller.me({ id: 'u1' } as AuthUser);
    expect(service.getMe).toHaveBeenCalledWith('u1');
  });

  it('topup forwards user id + amountCents from the body', async () => {
    const { controller, service } = makeController();
    await controller.topup({ id: 'u1' } as AuthUser, {
      amountCents: 500,
    } as never);
    expect(service.topUp).toHaveBeenCalledWith('u1', 500);
  });

  it('myPurchases forwards the user id', async () => {
    const { controller, service } = makeController();
    await controller.myPurchases({ id: 'u1' } as AuthUser);
    expect(service.myPurchases).toHaveBeenCalledWith('u1');
  });

  it('myListings forwards the user id', async () => {
    const { controller, service } = makeController();
    await controller.myListings({ id: 'u1' } as AuthUser);
    expect(service.myListings).toHaveBeenCalledWith('u1');
  });
});
