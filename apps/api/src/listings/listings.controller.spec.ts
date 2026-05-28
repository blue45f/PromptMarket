import { describe, expect, it, vi } from 'vitest';
import type { AuthUser } from '../auth/current-user.decorator';
import { ListingsController } from './listings.controller';

function makeController(overrides: Record<string, unknown> = {}) {
  const service = {
    list: vi.fn().mockResolvedValue({ items: [] }),
    stats: vi.fn().mockResolvedValue({ totalListings: 0 }),
    related: vi.fn().mockResolvedValue({ items: [] }),
    getBySlug: vi.fn().mockResolvedValue({ id: 'l1' }),
    create: vi.fn().mockResolvedValue({ id: 'l1' }),
    update: vi.fn().mockResolvedValue({ id: 'l1' }),
    remove: vi.fn().mockResolvedValue({ ok: true }),
    ...overrides,
  };
  return { controller: new ListingsController(service as never), service };
}

describe('ListingsController', () => {
  it('list passes the query DTO through unchanged', async () => {
    const { controller, service } = makeController();
    await controller.list({ q: 'agents' } as never);
    expect(service.list).toHaveBeenCalledWith({ q: 'agents' });
  });

  it('stats calls the service with no args', async () => {
    const { controller, service } = makeController();
    await controller.stats();
    expect(service.stats).toHaveBeenCalledWith();
  });

  it('related parses the limit query string into an integer', async () => {
    const { controller, service } = makeController();
    await controller.related('l1', '8');
    expect(service.related).toHaveBeenCalledWith('l1', 8);
  });

  it('related defaults limit to 4 when missing or zero', async () => {
    const { controller, service } = makeController();
    await controller.related('l1', undefined);
    expect(service.related).toHaveBeenLastCalledWith('l1', 4);
    await controller.related('l1', '0');
    expect(service.related).toHaveBeenLastCalledWith('l1', 4);
    await controller.related('l1', 'NaN');
    expect(service.related).toHaveBeenLastCalledWith('l1', 4);
  });

  it('getBySlug forwards the slug + nullable user id', async () => {
    const { controller, service } = makeController();
    await controller.getBySlug('my-slug', null);
    expect(service.getBySlug).toHaveBeenCalledWith('my-slug', null);
    await controller.getBySlug('my-slug', { id: 'u1' } as AuthUser);
    expect(service.getBySlug).toHaveBeenLastCalledWith('my-slug', 'u1');
  });

  it('create forwards user id + dto', async () => {
    const { controller, service } = makeController();
    const dto = { title: 't' } as never;
    await controller.create({ id: 'u1' } as AuthUser, dto);
    expect(service.create).toHaveBeenCalledWith('u1', dto);
  });

  it('update forwards user id + listing id + dto', async () => {
    const { controller, service } = makeController();
    const dto = { title: 't' } as never;
    await controller.update({ id: 'u1' } as AuthUser, 'l1', dto);
    expect(service.update).toHaveBeenCalledWith('u1', 'l1', dto);
  });

  it('remove forwards user id + listing id', async () => {
    const { controller, service } = makeController();
    await controller.remove({ id: 'u1' } as AuthUser, 'l1');
    expect(service.remove).toHaveBeenCalledWith('u1', 'l1');
  });
});
