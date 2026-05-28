import { describe, expect, it, vi } from 'vitest';
import type { AuthUser } from '../auth/current-user.decorator';
import { PurchasesController } from './purchases.controller';

describe('PurchasesController', () => {
  it('forwards @CurrentUser id + @Param id to PurchasesService.purchase', async () => {
    const purchase = vi.fn().mockResolvedValue({ purchase: { id: 'p1' } });
    const controller = new PurchasesController({ purchase } as never);
    const user: AuthUser = { id: 'u1', email: 'u1@example.com', username: 'user-u1' };
    await controller.purchase(user, 'listing-1');
    expect(purchase).toHaveBeenCalledWith('u1', 'listing-1');
  });

  it('propagates a service rejection unchanged', async () => {
    const err = new Error('insufficient balance');
    const controller = new PurchasesController({
      purchase: vi.fn().mockRejectedValue(err),
    } as never);
    const user: AuthUser = { id: 'u1', email: 'u1@example.com', username: 'user-u1' };
    await expect(controller.purchase(user, 'listing-1')).rejects.toBe(err);
  });
});
